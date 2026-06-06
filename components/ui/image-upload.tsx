"use client";

import * as React from "react";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  accept?: string[];
  className?: string;
  maxItems?: number;
  transformFile?: (file: File) => Promise<string>;
  value: string[];
  onChange: (value: string[]) => void;
};

const DEFAULT_ACCEPT = ["image/png", "image/jpeg", "image/webp"];

function acceptLabel(accept: string[]) {
  return accept
    .map((type) => type.replace("image/", "").replace("jpeg", "jpg").toUpperCase())
    .join(" / ");
}

async function fileToObjectUrl(file: File) {
  return URL.createObjectURL(file);
}

export function ImageUpload({
  accept = DEFAULT_ACCEPT,
  className,
  maxItems = 5,
  transformFile = fileToObjectUrl,
  value,
  onChange,
}: ImageUploadProps) {
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const items = value.slice(0, maxItems);
  const canUploadMore = items.length < maxItems;

  async function addFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setError(null);
    const remaining = Math.max(maxItems - items.length, 0);
    const selectedFiles = Array.from(files)
      .filter((file) => accept.includes(file.type))
      .slice(0, remaining);

    if (selectedFiles.length === 0) {
      setError(`请上传 ${acceptLabel(accept)} 图片。`);
      return;
    }

    const results = await Promise.allSettled(selectedFiles.map(transformFile));
    const nextItems = results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
      .map((result) => result.value)
      .filter(Boolean);

    if (!nextItems.length) {
      setError("图片处理失败，请换一张图片重试。");
      return;
    }

    onChange([...items, ...nextItems].slice(0, maxItems));
  }

  function removeItem(index: number) {
    onChange(items.filter((_item, itemIndex) => itemIndex !== index));
  }

  function openPicker() {
    inputRef.current?.click();
  }

  return (
    <div className={cn("min-w-0 overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] px-3 py-2.5">
        <p className="text-xs text-[var(--muted)]">
          {items.length}/{maxItems} 张 · {acceptLabel(accept)}
        </p>
        {canUploadMore && items.length > 0 ? (
          <button
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--surface-strong)]"
            type="button"
            onClick={openPicker}
          >
            <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
            上传
          </button>
        ) : null}
      </div>

      {items.length === 0 && canUploadMore ? (
        <button
          className="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 p-6 text-center transition hover:bg-[var(--surface-strong)]"
          type="button"
          onClick={openPicker}
        >
          <ImageIcon aria-hidden className="h-5 w-5 text-[var(--ink)]" strokeWidth={1.75} />
          <span className="text-sm font-medium text-[var(--ink)]">上传图片</span>
          <span className="text-xs text-[var(--muted)]">点击选择本地图片</span>
        </button>
      ) : (
        <div className="flex flex-wrap gap-3 p-3">
          {items.map((item, index) => (
            <div
              key={`${item.slice(0, 48)}-${index}`}
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface-strong)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`图片 ${index + 1}`}
                className="h-full w-full object-contain p-1.5"
                src={item}
              />
              <button
                aria-label={`删除图片 ${index + 1}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--canvas)]/95 opacity-0 shadow-sm transition hover:bg-[var(--surface-card)] group-hover:opacity-100 group-focus-within:opacity-100"
                type="button"
                onClick={() => removeItem(index)}
              >
                <Trash2 aria-hidden className="h-3 w-3 text-[var(--ink)]" strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error ? (
        <p className="border-t border-[var(--hairline)] px-3 py-2 text-xs text-[var(--semantic-error)]">
          {error}
        </p>
      ) : null}

      <input
        ref={inputRef}
        accept={accept.join(",")}
        className="sr-only"
        multiple
        type="file"
        onChange={(event) => {
          addFiles(event.target.files).catch(() => setError("图片处理失败，请换一张图片重试。"));
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
