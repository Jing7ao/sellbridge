"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Sparkles, Trash2, Eraser } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PRESET_CATEGORIES: { label: string; questions: string[] }[] = [
  {
    label: "新手入门",
    questions: [
      "完全没做过跨境电商，应该从哪个平台开始？",
      "做东南亚电商需要准备多少启动资金？",
      "个人卖家可以入驻 Lazada 和 Shopee 吗？",
      "没有营业执照能在 TikTok Shop 开店吗？",
      "Shopify 独立站和平台店铺各有什么优缺点？",
      "新手第一个市场选泰国还是印尼比较好？",
    ],
  },
  {
    label: "选品与定价",
    questions: [
      "泰国市场最近什么品类最好卖？",
      "越南消费者喜欢什么价位的商品？",
      "怎么给东南亚市场定价才能既有利润又有竞争力？",
      "不同国家同一款商品应该统一定价吗？",
      "怎么判断一个品类在东南亚有没有市场？",
      "跨境卖家选品最容易踩的坑有哪些？",
    ],
  },
  {
    label: "商品上架",
    questions: [
      "Lazada 上架商品标题怎么写更吸引人？",
      "Shopee 的商品描述有什么格式要求？",
      "多语言标题翻译怎么做才能保持 SEO 效果？",
      "商品主图有什么要求？白底图还是场景图好？",
      "SKU 多的商品怎么高效上架到多个平台？",
      "上架后多久能搜到自己的商品？",
    ],
  },
  {
    label: "物流仓储",
    questions: [
      "东南亚跨境物流走什么渠道最划算？",
      "海外仓和国内直发怎么选择？",
      "Shopee 的 SLS 物流和第三方物流哪个好？",
      "跨境物流一般几天能到消费者手上？",
      "易碎品跨境包装有什么技巧？",
      "退货率高怎么处理跨境退货问题？",
    ],
  },
  {
    label: "运营推广",
    questions: [
      "新品上架后怎么快速出第一单？",
      "Lazada 的Sponsored Discovery 广告怎么投？",
      "TikTok Shop 怎么做短视频带货？",
      "东南亚消费者更喜欢什么类型的促销活动？",
      "怎么在 Shopee 上提高店铺评分？",
      "大促期间怎么准备库存和物流？",
    ],
  },
  {
    label: "平台规则",
    questions: [
      "Shopee 对跨境卖家有什么特殊要求？",
      "Lazada 的佣金结构是怎样的？",
      "TikTok Shop 东南亚各站点的分佣比例是多少？",
      "跨境卖家需要交当地 VAT/GST 税吗？",
      "被平台判定违规怎么申诉？",
      "各平台的回款周期是多久？",
    ],
  },
];

const STORAGE_KEY = "sellbridge_ai_chat";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDynamicPresets(): string[] {
  const shuffledCategories = shuffle(PRESET_CATEGORIES);
  const picks: string[] = [];

  for (const cat of shuffledCategories) {
    if (picks.length >= 4) break;
    const shuffled = shuffle(cat.questions);
    picks.push(shuffled[0]);
  }

  return picks;
}

function loadMessages(): Message[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m: unknown) =>
        m &&
        typeof m === "object" &&
        (m as Message).role &&
        (m as Message).content
    );
  } catch {
    return [];
  }
}

function saveMessages(msgs: Message[]) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {
    /* storage full */
  }
}

export default function AISupportPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPresets(getDynamicPresets());
    setMessages(loadMessages());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveMessages(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: Message = { role: "user", content: text };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setInput("");
      setLoading(true);

      try {
        const resp = await fetch("/api/ai-support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updated.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await resp.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "抱歉，网络请求失败，请稍后再试。" },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  const clearChat = () => {
    setMessages([]);
    setPresets(getDynamicPresets());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isFirstMessage = messages.length === 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-indigo-50 via-violet-50/50 to-pink-50/30">
      {/* 顶部标题栏 */}
      <div className="shrink-0 px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">AI 客服助手</h2>
              <p className="text-sm text-slate-500">跨境电商智能问答 · 基于 DeepSeek</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">清空对话</span>
            </button>
          )}
        </div>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8 min-h-0">
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
          {!hydrated ? null : isFirstMessage ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-20">
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 blur-2xl opacity-40 animate-pulse" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                  <Bot className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                你好！我是小桥 🌉
              </h3>
              <p className="text-sm text-slate-500 mb-8 text-center max-w-sm leading-relaxed">
                你的跨境电商 AI 顾问，随时帮你解答平台选择、选品上架、运营推广等问题
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full">
                {presets.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-sm px-4 py-3 rounded-2xl bg-white text-indigo-700 border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md transition-all duration-200 font-medium text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPresets(getDynamicPresets())}
                className="mt-6 text-xs text-indigo-400 hover:text-indigo-600 transition-colors"
              >
                换一批问题 →
              </button>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                    <Bot className="w-4.5 h-4.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-br-md shadow-indigo-500/30"
                      : "bg-white text-slate-700 rounded-bl-md border border-indigo-100 shadow-indigo-100/50"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                    <User className="w-4.5 h-4.5 text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-md border border-indigo-100 px-5 py-4 shadow-md">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="shrink-0 px-4 md:px-6 lg:px-8 pb-4 md:pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg shadow-indigo-100/50 pl-5 pr-2 py-2 flex items-center gap-2 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:shadow-xl transition-all duration-200">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题，小桥来帮你解答..."
              rows={1}
              className="flex-1 resize-none border-0 outline-none focus:outline-none focus:ring-0 focus:shadow-none text-sm py-2 px-0 bg-transparent placeholder:text-slate-400"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.03] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shrink-0 flex items-center gap-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">发送</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
