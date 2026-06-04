#!/usr/bin/env node
/**
 * 企业微信群消息只读监控器
 * ==========================================
 * 监控目标: 莲藕（T-乐康医生团队）交流群
 * 模式: 只读（绝不发送任何消息）
 *
 * 原理:
 *   通过 macOS Accessibility API (JXA/JavaScript for Automation)
 *   读取企业微信 App 窗口中可见的文本内容。
 *   通过对比前后快照的哈希值检测新消息。
 *
 * 前置条件:
 *   1. macOS 辅助功能权限: 系统设置 → 隐私与安全性 → 辅助功能
 *      确保终端 (Terminal) 或 VS Code / Cursor 已勾选
 *   2. 企业微信 App 正在运行
 *   3. 企业微信窗口打开并选中「莲藕（T-乐康医生团队）交流群」
 *
 * 使用:
 *   node scripts/wecom-monitor/monitor.js [选项]
 *
 * 选项:
 *   --interval N    轮询间隔秒数 (默认 5)
 *   --log-file PATH 日志文件路径 (默认 ./scripts/wecom-monitor/messages.log)
 *
 * 环境变量:
 *   MONITOR_INTERVAL=N  同 --interval
 *   MONITOR_LOG_FILE=P  同 --log-file
 *
 * 停止: 按 Ctrl+C
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ==================== 配置 ====================
const TARGET_GROUP = "测试";
const TARGET_KEYWORDS = ["测试"]; // 用于识别目标群

const CONFIG = {
  interval: parseInt(process.env.MONITOR_INTERVAL) || 5,
  logFile: process.env.MONITOR_LOG_FILE || path.join(__dirname, "messages.log"),
  jxaTimeout: 15000
};

// 解析命令行参数
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--interval" && process.argv[i + 1]) {
    CONFIG.interval = Math.max(1, parseInt(process.argv[++i]));
  } else if (process.argv[i] === "--log-file" && process.argv[i + 1]) {
    CONFIG.logFile = path.resolve(process.argv[++i]);
  }
}

// ==================== JXA 脚本 ====================
// 通过辅助功能 API 只读获取企业微信窗口文本
function buildJxaScript() {
  return [
    // 目标群关键词
    "var KW = " + JSON.stringify(TARGET_KEYWORDS) + ";",
    "",
    'var app = Application("System Events");',
    'var w = app.processes["企业微信"].windows[0];',
    "var result = {",
    '    chat: "",', // 检测到的会话标题
    "    isTarget: false,", // 是否目标群
    '    desc: "",', // 群描述（如 "由企业微信用户创建的外部群..."）
    "    texts: []", // 所有文本内容
    "};",
    "var count = 0, MAX = 800;",
    "",
    "function read(e, d) {",
    "    if (d > 7 || count >= MAX) return;",
    "    count++;",
    "    try {",
    "        var r = String(e.role());",
    "",
    "        // 跳过侧边栏表格（会话列表元素极多，且不是当前会话内容）",
    '        if (r === "AXTable") return;',
    '        if (r === "AXColumn") return;',
    "",
    '        var n = ""; var v = "";',
    "        try { n = String(e.name()); } catch(ex) {}",
    "        try { v = String(e.value()); } catch(ex) {}",
    "",
    "        // ---- 会话识别 ----",
    "        // 方式1: AXTextField 中的会话标题",
    '        if (r === "AXTextField" && v && v.length > 2 && v.length < 100) {',
    "            for (var j = 0; j < KW.length; j++) {",
    "                if (v.indexOf(KW[j]) >= 0) {",
    "                    result.chat = v;",
    "                    result.isTarget = true;",
    "                }",
    "            }",
    "            // 也记录任何看起来像会话名的 TextField",
    '            if (!result.chat && (v.indexOf("群") >= 0 || v.indexOf("交流") >= 0)) {',
    "                result.chat = v;",
    "            }",
    "        }",
    "",
    "        // 方式2: AXStaticText 中的群描述",
    '        if (r === "AXStaticText" && n && n.indexOf("由企业微信用户创建的外部群") >= 0) {',
    "            result.desc = n;",
    "            for (var k = 0; k < KW.length; k++) {",
    "                if (n.indexOf(KW[k]) >= 0) result.isTarget = true;",
    "            }",
    "        }",
    "",
    "        // ---- 收集文本 ----",
    '        if (r === "AXStaticText" && n && n !== "null" && n.length > 0 && n.length < 2000) {',
    "            result.texts.push(n);",
    "        }",
    "",
    "        // ---- 递归子元素 ----",
    "        if (count < MAX) {",
    "            var kids = e.uiElements();",
    "            for (var i = 0; i < kids.length && count < MAX; i++) {",
    "                read(kids[i], d + 1);",
    "            }",
    "        }",
    "    } catch(ex) {}",
    "}",
    "",
    "read(w, 0);",
    "JSON.stringify(result);"
  ].join("\n");
}

// ==================== 消息检测引擎 ====================
let previousTexts = new Set();
let previousHash = "";
let initDone = false;
let consecutiveErrors = 0;

/**
 * 判断文本是否像一条有意义的消息
 */
function isMessageLine(text) {
  if (!text || text.length < 1 || text.length > 2000) return false;

  // ── 排除纯时间/日期 ──
  if (/^\d{1,2}:\d{2}$/.test(text)) return false;
  if (/^\d{1,2}\/\d{1,2}$/.test(text)) return false;
  if (/^\d+$/.test(text)) return false;
  if (/^(星期[一二三四五六日天]|昨天|今天|分钟前|刚刚|null)$/.test(text))
    return false;

  // ── 排除已知侧边栏会话名称 ──
  const NOISE = new Set([
    "DP电商视频",
    "DP视频研究小组",
    "DP提效沟通群",
    "内容产品部",
    "莲藕健康（高效&快乐）",
    "部门-工作流AI化",
    "科技啊科技💪",
    "账号登录",
    "审批",
    "日程",
    "公告",
    "打卡",
    "用友工资条",
    "邮件提醒",
    "文件传输助手",
    "行业资讯",
    "企业微信团队",
    "企业微信开发者中心",
    "可能的商务伙伴",
    "登录创作者中心",
    "莲藕医生7周年快乐",
    "快速会议",
    "测试"
  ]);
  if (NOISE.has(text)) return false;

  // ── 排除系统消息 ──
  if (text.indexOf("置顶了") >= 0) return false;
  if (text.indexOf("撤回了一条消息") >= 0) return false;
  if (text.startsWith("由企业微信用户创建的外部群")) return false;
  if (text.startsWith("一、团队与值班信息")) return false;
  if (text.indexOf("授予了") >= 0 && text.indexOf("管理员权限") >= 0)
    return false;

  // ── 排除联系人名称（纯中文名，不含冒号）──
  // 出现在消息区域的人名通常带有冒号和消息内容

  // ── ✅ 有效消息格式 ──
  // "发送者: 消息内容" 格式
  if (/^[^\s:]{1,20}:\s/.test(text) && text.length > 5) return true;

  // [文件], [图片], [自定义表情] 等附件引用
  if (/^\[.+\]$/.test(text) && text.length <= 100) return true;

  // 短文本回复（不含换行）
  if (text.length <= 60 && !text.includes("\n") && !text.includes("\t")) {
    // 但排除纯人名
    if (/^[一-鿿\w()（）]{1,10}$/.test(text) && !text.includes(":"))
      return false;
    return true;
  }

  // URL 链接
  if (/^https?:\/\//.test(text)) return true;

  return false;
}

function computeHash(texts) {
  return crypto.createHash("md5").update(texts.join("|")).digest("hex");
}

/**
 * 执行一次 JXA 快照读取
 */
function readSnapshot() {
  const jxa = buildJxaScript();
  const jxaPath = "/tmp/wecom-monitor.jxa";
  fs.writeFileSync(jxaPath, jxa, "utf-8");

  const raw = execSync(`osascript -l JavaScript "${jxaPath}"`, {
    timeout: CONFIG.jxaTimeout,
    maxBuffer: 2 * 1024 * 1024,
    encoding: "utf-8"
  });

  const trimmed = (raw || "").trim();
  if (!trimmed)
    throw new Error(
      "JXA returned empty output (企业微信窗口可能不可见或处于后台)"
    );
  return JSON.parse(trimmed);
}

function findNewTexts(currentTexts) {
  const newTexts = [];
  for (const t of currentTexts) {
    if (!previousTexts.has(t)) {
      newTexts.push(t);
    }
  }
  return newTexts;
}

function dedupe(texts) {
  return [...new Set(texts)];
}

// ==================== 输出工具函数 ====================
function ts() {
  const d = new Date();
  return `[${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}]`;
}

function logOut(text) {
  console.log(text);
}

function logSys(text) {
  console.error(`\x1b[36m[SYS]\x1b[0m ${text}`);
}

function logWarn(text) {
  console.error(`\x1b[33m[WARN]\x1b[0m ${text}`);
}

function logErr(text) {
  console.error(`\x1b[31m[ERR]\x1b[0m ${text}`);
}

function appendLog(line) {
  try {
    fs.appendFileSync(CONFIG.logFile, line + "\n", "utf-8");
  } catch (e) {
    logErr(`写入日志失败: ${e.message}`);
  }
}

// ==================== 主轮询循环 ====================
function poll() {
  let data;
  try {
    data = readSnapshot();
    consecutiveErrors = 0;
  } catch (e) {
    consecutiveErrors++;
    if (consecutiveErrors <= 3) {
      logErr(`读取失败 (${consecutiveErrors}/3): ${e.message}`);
    } else if (consecutiveErrors === 4) {
      logErr("连续多次读取失败，可能是权限问题或企業微信未运行");
      logErr("请检查: 1) 企業微信是否运行 2) 终端是否有辅助功能权限");
    }
    return;
  }

  // ── 检查是否在目标群 ──
  if (!data.isTarget) {
    if (data.chat) {
      logWarn(`当前会话: "${data.chat}"，非目标群「${TARGET_GROUP}」`);
      logWarn("请在企業微信中点击左侧会话列表，切换到目标群。");
    } else {
      logWarn(`未检测到目标群「${TARGET_GROUP}」`);
      logWarn("请确保企業微信窗口打开，并选中目标群会话。");
    }
    // 重置状态
    previousHash = "";
    previousTexts = new Set();
    initDone = false;
    return;
  }

  const allTexts = data.texts || [];
  const currentHash = computeHash(allTexts);

  // ── 首次初始化 ──
  if (!initDone) {
    previousTexts = new Set(allTexts);
    previousHash = currentHash;
    initDone = true;
    const msgCount = allTexts.filter(isMessageLine).length;
    logSys("✅ 监控就绪");
    logSys(`   目标群: 「${data.chat || TARGET_GROUP}」`);
    logSys(`   群描述: ${data.desc || "(未获取到)"}`);
    logSys(`   轮询间隔: ${CONFIG.interval}s`);
    logSys(`   日志文件: ${CONFIG.logFile}`);
    logSys(`   当前快照: ${allTexts.length} 条可见文本, 约 ${msgCount} 条消息`);
    logSys(`   等待新消息... (按 Ctrl+C 停止)`);
    return;
  }

  // ── 无变化 ──
  if (currentHash === previousHash) return;

  // ── 检测新消息 ──
  const newTexts = findNewTexts(allTexts);
  const newMessages = dedupe(newTexts.filter(isMessageLine));

  if (newMessages.length > 0 && newMessages.length < 30) {
    // 合理范围内的新消息数
    logSys(`📩 检测到 ${newMessages.length} 条新消息:`);
    for (const msg of newMessages) {
      const line = `${ts()} ${msg}`;
      logOut(`   ${msg}`);
      appendLog(line);
    }
  } else if (newMessages.length >= 30) {
    // 大量新文本（可能是滚动导致的新内容出现），不逐条输出
    logSys(
      `⚠️ 检测到 ${newMessages.length} 条新文本（可能由滚动触发），已更新快照`
    );
    logSys(`   若为新消息涌入，请检查企業微信窗口。`);
  }

  // ── 更新快照 ──
  previousTexts = new Set(allTexts);
  previousHash = currentHash;
}

// ==================== 启动入口 ====================
function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║       企業微信群消息监控器 (只读模式)       ║");
  console.log("║   目标: 莲藕（T-乐康医生团队）交流群        ║");
  console.log("║   绝不发送任何消息  |  Ctrl+C 停止          ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");

  // 初始化日志文件
  try {
    const dir = path.dirname(CONFIG.logFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    appendLog(`\n${ts()} ======== 监控会话开始 ========`);
  } catch (e) {
    logErr(`无法创建日志文件 ${CONFIG.logFile}: ${e.message}`);
    process.exit(1);
  }

  logSys(`轮询间隔: ${CONFIG.interval}s | 日志: ${CONFIG.logFile}`);
  logSys("");

  // 首次轮询
  poll();

  // 定时轮询
  setInterval(poll, CONFIG.interval * 1000);
}

// 优雅退出
process.on("SIGINT", () => {
  console.log("");
  logSys("监控已停止");
  appendLog(`${ts()} ======== 监控会话结束 ========\n`);
  process.exit(0);
});

process.on("SIGTERM", () => {
  logSys("监控已终止");
  process.exit(0);
});

main();
