/**
 * 图片本地文件存储 — 替代 base64 localStorage
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { log } from "../logger.js";

const IMAGE_DIR = path.join(process.cwd(), "data", "images");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function ensureDir() {
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

/**
 * 将 base64 图片保存到本地文件，返回访问路径
 */
export function saveBase64Image(base64: string): string | null {
  try {
    ensureDir();

    // 解析 base64 data URL
    const matches = base64.match(/^data:image\/([\w+]+);base64,(.+)$/);
    if (!matches) return null;

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const data = Buffer.from(matches[2], "base64");

    if (data.length > MAX_FILE_SIZE) {
      log.warn("Image too large, skipping", { size: data.length });
      return null;
    }

    const hash = crypto.createHash("md5").update(data).digest("hex").slice(0, 12);
    const filename = `${hash}.${ext}`;
    const filepath = path.join(IMAGE_DIR, filename);

    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, data);
    }

    return `/api/images/${filename}`;
  } catch (err) {
    log.error("Failed to save image", { error: String(err) });
    return null;
  }
}

/**
 * 读取图片文件
 */
export function getImageFile(filename: string): { data: Uint8Array; mime: string } | null {
  const filepath = path.join(IMAGE_DIR, filename);
  // 防止路径遍历
  if (!filepath.startsWith(IMAGE_DIR)) return null;
  if (!fs.existsSync(filepath)) return null;

  const ext = path.extname(filename).slice(1);
  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
  };

  const buf = fs.readFileSync(filepath);
  return {
    data: new Uint8Array(buf),
    mime: mimeMap[ext] ?? "image/png",
  };
}
