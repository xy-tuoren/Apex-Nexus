#!/usr/bin/env python3
"""
批量查询医生执业注册信息并截图。

用法：
    python3 scripts/batch-doctor-query.py 艾勇 张三 李四
    python3 scripts/batch-doctor-query.py --province 广东省 --hospital 莲藕健康医院 艾勇 张三
    python3 scripts/batch-doctor-query.py --file names.txt

输出：
    screenshots/<姓名>.png  — 每位医生的详情弹窗截图
"""

import argparse
import base64
import io
import json
import os
import sys
import time
import ddddocr
from PIL import Image
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

# ---------- 配置默认值 ----------
DEFAULT_PROVINCE = "广东省"
DEFAULT_HOSPITAL = "莲藕健康医院"
DEFAULT_INTERVAL = 60  # 秒
OUTPUT_DIR = "screenshots"


# ---------- 工具函数 ----------


def set_output_dir(path: str):
    global OUTPUT_DIR
    OUTPUT_DIR = path


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def safe_text(el):
    """安全获取元素文本"""
    try:
        return el.text_content().strip()
    except Exception:
        return ""


def log(msg: str):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")


# ---------- 验证码识别器 ----------


class CaptchaSolver:
    """使用 ddddocr 检测并识别点选验证码中的汉字位置"""

    def __init__(self):
        self.detector = ddddocr.DdddOcr(det=True, show_ad=False)
        # 双模型：beta 主打中文，标准做 backup
        self.ocr_beta = ddddocr.DdddOcr(beta=True, show_ad=False)
        self.ocr_std = ddddocr.DdddOcr(show_ad=False)

    def solve(self, canvas_data_url: str, target_words: list[str]) -> list[dict] | None:
        """
        解析 canvas data URL，返回按 target_words 顺序排列的点击坐标列表。
        失败返回 None。
        """
        # 1. 解码图片
        b64 = canvas_data_url
        for prefix in ("data:image/png;base64,", "data:image/jpeg;base64,"):
            if b64.startswith(prefix):
                b64 = b64[len(prefix) :]
                break
        padding = 4 - len(b64) % 4
        if padding != 4:
            b64 += "=" * padding

        try:
            img_bytes = base64.b64decode(b64)
        except Exception as e:
            log(f"  base64 解码失败: {e}")
            return None

        # 2. 检测所有字符位置
        poses = self.detector.detection(img_bytes)
        if not poses or len(poses) < len(target_words):
            log(f"  检测到 {len(poses) if poses else 0} 个字符，需要 {len(target_words)} 个")
            return None

        # 3. 逐个裁剪并用双模型识别，取最佳
        img = Image.open(io.BytesIO(img_bytes))
        candidates = []
        for x1, y1, x2, y2 in poses:
            pad = 3
            crop = img.crop(
                (max(0, x1 - pad), max(0, y1 - pad), min(381, x2 + pad), min(150, y2 + pad))
            )
            buf = io.BytesIO()
            crop.save(buf, format="PNG")
            buf.seek(0)
            crop_bytes = buf.read()

            # 两个模型各自识别
            r_beta = self.ocr_beta.classification(crop_bytes)
            r_std = self.ocr_std.classification(crop_bytes)

            candidates.append(
                {
                    "char_beta": r_beta,
                    "char_std": r_std,
                    "x": int((x1 + x2) / 2),
                    "y": int((y1 + y2) / 2),
                    "bbox": [x1, y1, x2, y2],
                }
            )

        # 4. 为每个 target 找最佳匹配（优先 beta 精确匹配，其次 std 精确匹配，最后退化）
        result = self._match_with_fallback(target_words, candidates)
        if result:
            return result

        # 5. 如果失败，尝试用位置顺序匹配（有时检测是按阅读顺序返回的）
        result = self._match_by_position(target_words, candidates, poses)
        return result

    def _match_with_fallback(self, target_words, candidates):
        """尝试精确匹配 target_words"""
        used = set()
        result = []
        for target in target_words:
            found = None
            for i, c in enumerate(candidates):
                if i in used:
                    continue
                if c["char_beta"] == target or c["char_std"] == target:
                    found = c
                    used.add(i)
                    break
            if found:
                result.append({"char": target, "x": found["x"], "y": found["y"]})
            else:
                return None  # 精确匹配失败，让上层 fallback
        return result

    def _match_by_position(self, target_words, candidates, poses):
        """当 OCR 无法精确匹配时，按目标字的顺序对应检测位置的顺序（阅读顺序）"""
        # 按位置排序：先上后下，先左后右
        sorted_candidates = sorted(
            candidates,
            key=lambda c: (c["bbox"][1], c["bbox"][0]),  # y, then x
        )
        log(f"    OCR原始: {[(c['char_beta'], c['char_std']) for c in sorted_candidates]}")
        log(f"    目标字: {target_words}")
        if len(sorted_candidates) >= len(target_words):
            result = []
            for i, target in enumerate(target_words):
                c = sorted_candidates[i]
                result.append({"char": target, "x": c["x"], "y": c["y"]})
            log(f"    使用位置顺序匹配")
            return result
        return None


# ---------- 主流程 ----------


def dismiss_dialog(page):
    """关闭可能存在的验证失败弹窗"""
    try:
        close_btn = page.get_by_role("button", name="关 闭")
        if close_btn.is_visible(timeout=1000):
            close_btn.click()
            page.wait_for_timeout(500)
            return True
    except Exception:
        pass
    return False


def solve_and_click_captcha(page, solver, target_words, max_refresh=6) -> bool:
    """识别验证码并点击，失败时自动刷新重试"""
    canvas = page.locator("#checkCodeContainer canvas")
    refresh_btn = page.locator("#checkCodeContainer .icon-refresh").first

    for attempt in range(1, max_refresh + 1):
        # 更新验证码提示（刷新后可能变）
        verify_msg_text = safe_text(page.locator("#checkCodeContainer .verify-msg"))
        if "【" in verify_msg_text and "】" in verify_msg_text:
            inner = verify_msg_text.split("【")[1].split("】")[0]
            current_targets = [w.strip() for w in inner.split("，") if w.strip()]
            if len(current_targets) == 4:
                target_words = current_targets

        # 获取当前验证码图片
        canvas_data_url = canvas.evaluate("el => el.toDataURL('image/png')")
        click_order = solver.solve(canvas_data_url, target_words)

        if not click_order:
            log(f"    [{attempt}/{max_refresh}] 识别失败，刷新...")
            refresh_btn.click()
            page.wait_for_timeout(1500)
            continue

        log(f"    [{attempt}/{max_refresh}] 点击: {[(c['char'], c['x'], c['y']) for c in click_order]}")

        # 依次点击（force=True 绕过点击后出现的 point-area 标记点遮挡）
        for click_info in click_order:
            canvas.click(
                position={"x": click_info["x"], "y": click_info["y"]},
                force=True,
            )
            page.wait_for_timeout(400)

        page.wait_for_timeout(500)

        # 检查结果
        verify_msg = safe_text(page.locator("#checkCodeContainer .verify-msg"))

        if "验证成功" in verify_msg or "验证通过" in verify_msg:
            return True

        if "验证失败" in verify_msg:
            log(f"    [{attempt}/{max_refresh}] 验证失败")
            dismiss_dialog(page)
            if attempt < max_refresh:
                refresh_btn.click()
                page.wait_for_timeout(1500)

    return False


def query_one(page, name: str, province: str, hospital: str, solver: CaptchaSolver) -> bool:
    """
    查询单个医生并截图。返回 True 表示成功。
    """
    log(f"--- 开始查询: {name} ---")

    # 1. 打开页面
    try:
        page.goto("https://zgcx.nhc.gov.cn/doctor", wait_until="domcontentloaded", timeout=30000)
    except PWTimeout:
        log("  页面加载超时，重试一次...")
        page.goto("https://zgcx.nhc.gov.cn/doctor", wait_until="domcontentloaded", timeout=30000)

    page.wait_for_timeout(2000)
    # 确保页面无残留弹窗
    dismiss_dialog(page)

    # 2. 填写省份
    try:
        province_combo = page.get_by_role("combobox", name="* 所在省份 :")
        province_combo.click()
        page.wait_for_timeout(500)
        page.get_by_title(province).click()
        page.wait_for_timeout(300)
        log(f"  省份: {province} ✓")
    except Exception as e:
        log(f"  选择省份失败: {e}")
        return False

    # 3. 填写姓名
    try:
        name_input = page.get_by_role("textbox", name="* 医师姓名 :")
        name_input.fill(name)
        log(f"  姓名: {name} ✓")
    except Exception as e:
        log(f"  填写姓名失败: {e}")
        return False

    # 4. 填写医疗机构
    try:
        hospital_input = page.get_by_role("textbox", name="* 所在医疗机构 :")
        hospital_input.fill(hospital)
        log(f"  机构: {hospital} ✓")
    except Exception as e:
        log(f"  填写机构失败: {e}")
        return False

    # 5. 获取验证码信息
    verify_msg_el = page.locator("#checkCodeContainer .verify-msg")
    verify_msg = safe_text(verify_msg_el)
    log(f"  验证码: {verify_msg}")

    # 解析目标字 (格式: "请顺序点击【内，准，雨，神】")
    target_words = []
    if "【" in verify_msg and "】" in verify_msg:
        inner = verify_msg.split("【")[1].split("】")[0]
        target_words = [w.strip() for w in inner.split("，") if w.strip()]

    if len(target_words) != 4:
        log(f"  无法解析目标字: {verify_msg}")
        return False

    # 6. 识别并点击验证码（带重试）
    if not solve_and_click_captcha(page, solver, target_words):
        log("  验证码破解失败（已达最大重试次数）")
        return False

    log("  验证码 ✓")

    # 7. 点击查询按钮
    dismiss_dialog(page)  # 确保无弹窗遮挡
    search_btn = page.get_by_role("button", name="查 询")
    search_btn.click()
    page.wait_for_timeout(3000)

    # 检查结果：优先看是否有结果表格，再看是否有失败弹窗
    result_table = page.locator("table")
    has_results = result_table.count() > 0 and "详 细" in (result_table.first.text_content() or "")

    if not has_results:
        if dismiss_dialog(page):
            log("  查询返回失败")
            return False
        # 再多等一会儿
        page.wait_for_timeout(2000)
        has_results = result_table.count() > 0 and "详 细" in (result_table.first.text_content() or "")

    # 8. 点击详情
    try:
        # 先滚动到底部确保结果表可见
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(300)

        # 多种方式尝试找到并点击详情链接
        clicked = False
        selectors = [
            "td a",                          # <a>详 细</a>
            "a:has-text('详')",              # 包含"详"的 a 标签
            "td:has-text('详')",             # 包含"详"的 td
            "text=详 细",                    # 精确文本
        ]
        for sel in selectors:
            try:
                el = page.locator(sel).first
                if el.count() > 0:
                    el.click(force=True, timeout=3000)
                    page.wait_for_timeout(1500)
                    clicked = True
                    break
            except Exception:
                continue

        if not clicked:
            log("  未找到详情链接")
            return False
    except Exception as e:
        log(f"  点击详情失败: {e}")
        return False

    # 9. 等待抽屉打开
    try:
        page.wait_for_selector(".ant-drawer-open", timeout=5000)
        page.wait_for_timeout(500)
    except PWTimeout:
        log("  详情抽屉未打开")
        return False

    # 10. 截取抽屉内容
    drawer = page.locator(".ant-drawer-content-wrapper")
    filename = os.path.join(OUTPUT_DIR, f"{name}.png")
    drawer.screenshot(path=filename)
    log(f"  💾 截图已保存: {filename}")

    # 11. 关闭抽屉
    try:
        close_drawer_btn = page.locator(".ant-drawer-close")
        if close_drawer_btn.is_visible(timeout=2000):
            close_drawer_btn.click()
            page.wait_for_timeout(500)
    except Exception:
        pass

    log(f"--- {name} 查询完成 ---")
    return True


def batch_query(
    names: list[str],
    province: str = DEFAULT_PROVINCE,
    hospital: str = DEFAULT_HOSPITAL,
    interval: int = DEFAULT_INTERVAL,
):
    """批量查询多个医生"""
    ensure_output_dir()
    solver = CaptchaSolver()

    results = {"success": [], "failed": []}

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            locale="zh-CN",
        )
        page = context.new_page()

        for i, name in enumerate(names):
            name = name.strip()
            if not name:
                continue

            if i > 0:
                log(f"⏳ 等待 {interval} 秒后查询下一位...")
                time.sleep(interval)

            try:
                ok = query_one(page, name, province, hospital, solver)
                results["success" if ok else "failed"].append(name)
            except Exception as e:
                log(f"  ❌ 异常: {e}")
                results["failed"].append(name)

        browser.close()

    # 打印汇总
    print("\n" + "=" * 50)
    print(f"查询完成: 成功 {len(results['success'])} 人, 失败 {len(results['failed'])} 人")
    if results["success"]:
        print(f"成功: {', '.join(results['success'])}")
    if results["failed"]:
        print(f"失败: {', '.join(results['failed'])}")
    print(f"截图保存在: {os.path.abspath(OUTPUT_DIR)}/")


# ---------- CLI ----------


def main():
    parser = argparse.ArgumentParser(
        description="批量查询医生执业注册信息并截图",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s 艾勇 张三
  %(prog)s --province 广东省 --hospital 莲藕健康医院 艾勇
  %(prog)s --interval 120 艾勇 张三 李四
  %(prog)s --file names.txt
        """,
    )
    parser.add_argument("names", nargs="*", help="要查询的医生姓名")
    parser.add_argument("--province", "-p", default=DEFAULT_PROVINCE, help="所在省份")
    parser.add_argument("--hospital", "-H", default=DEFAULT_HOSPITAL, help="所在医疗机构")
    parser.add_argument("--interval", "-i", type=int, default=DEFAULT_INTERVAL, help="查询间隔（秒）")
    parser.add_argument("--file", "-f", help="从文件读取姓名，每行一个")
    parser.add_argument("--output", "-o", default=OUTPUT_DIR, help="截图输出目录")

    args = parser.parse_args()

    set_output_dir(args.output)

    # 收集姓名
    names = list(args.names)
    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    names.append(line)

    if not names:
        parser.print_help()
        print("\n❌ 请提供至少一个姓名")
        sys.exit(1)

    print(f"省 份: {args.province}")
    print(f"机 构: {args.hospital}")
    print(f"间 隔: {args.interval}s")
    print(f"姓 名: {', '.join(names)}")
    print(f"共 {len(names)} 人\n")

    batch_query(names, args.province, args.hospital, args.interval)


if __name__ == "__main__":
    main()
