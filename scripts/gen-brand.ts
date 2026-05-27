/**
 * Seedance 2.0 品牌素材生成
 * 调用火山引擎 ARK API 生成 SellBridge 品牌视频
 *
 * API: POST /api/v3/contents/generations/tasks (异步任务)
 *
 * 用法:
 *   npx tsx scripts/gen-brand.ts
 */
import fs from "node:fs";
import path from "node:path";

// ── 加载 .env.local ──
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  let raw = fs.readFileSync(envPath, "utf-8").replace(/^﻿/, "").replace(/\r/g, "");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const API_KEY = process.env.SEEDANCE_API_KEY;
const BASE = process.env.SEEDANCE_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3";

if (!API_KEY) {
  console.error("❌ 请在 .env.local 中设置 SEEDANCE_API_KEY");
  process.exit(1);
}

// ── API 工具 ──

async function api(method: string, endpoint: string, body?: unknown) {
  const url = `${BASE}${endpoint}`;
  console.log(`📡 ${method} ${url}`);
  const resp = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let data: Record<string, unknown>;
  try { data = JSON.parse(text); } catch {
    throw new Error(`Invalid JSON response (${resp.status}): ${text.slice(0, 300)}`);
  }
  if (!resp.ok) throw new Error(`API ${resp.status}: ${JSON.stringify(data, null, 2)}`);
  return data;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── 生成品牌视频 ──

async function main() {
  console.log("🎬 Seedance 2.0 生成 SellBridge 品牌视频\n");

  // 1. 创建生成任务
  console.log("Step 1: 创建视频生成任务...");
  const task = await api("POST", "/contents/generations/tasks", {
    model: "doubao-seedance-2-0-260128",
    content: [
      {
        type: "text",
        text: [
          "A professional 8-second brand intro video for 'SellBridge', a cross-border e-commerce SaaS platform.",
          "Style: modern tech startup, clean and sleek, indigo and violet gradient color theme (#6366f1 to #8b5cf6).",
          "Start with a glowing bridge icon forming from particles over a dark gradient background.",
          "Show abstract visualizations: packages flowing across the bridge, global map nodes connecting (SE Asia), data charts rising smoothly.",
          "End with the glowing bridge icon centered, with subtle particle effects around it.",
          "Smooth cinematic transitions, no text overlay needed, no voiceover.",
          "Background: modern electronic ambient music, soft beats.",
        ].join(" "),
      },
    ],
    ratio: "16:9",
    duration: 8,
    watermark: false,
    generate_audio: true,
  });

  const taskId = task.id as string;
  console.log(`   ✅ 任务已创建: ${taskId}`);

  // 2. 轮询等待完成
  console.log("\nStep 2: 等待生成完成...");
  let result: Record<string, unknown> | null = null;
  for (let i = 0; i < 40; i++) {
    await sleep(15000); // 每 15 秒查询
    const status = await api("GET", `/contents/generations/tasks/${taskId}`);
    console.log(`   [${i + 1}] status: ${status.status}`);

    if (status.status === "succeeded") {
      result = status;
      break;
    }
    if (status.status === "failed") {
      console.error("❌ 生成失败:", JSON.stringify(status, null, 2));
      process.exit(1);
    }
  }

  if (!result) {
    console.error("❌ 超时：生成任务未在 10 分钟内完成");
    process.exit(1);
  }

  // 3. 下载视频
  console.log("\nStep 3: 下载视频...");
  const content = result.content as { video_url?: string; audio_url?: string };
  const videoUrl = content?.video_url;
  if (!videoUrl) {
    console.error("❌ 未找到视频 URL:", JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log(`   📥 下载: ${videoUrl}`);
  const videoResp = await fetch(videoUrl);
  const buf = Buffer.from(await videoResp.arrayBuffer());
  const dest = path.join(process.cwd(), "public", "brand-video.mp4");
  fs.writeFileSync(dest, buf);
  console.log(`   ✅ 已保存: ${dest} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);

  console.log("\n🎉 品牌视频生成完成！刷新页面即可看到新的品牌视频。");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
