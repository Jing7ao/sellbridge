"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, ArrowRight, Globe, Zap, BarChart3, Sparkles, Check, X, Gift } from "lucide-react";
import { BrandIcon } from "../../components/brand-logo";
import { checkPassword } from "../../src/auth/password";

const FEATURES = [
  { icon: Globe, title: "一键上架", desc: "同时发布到 Lazada / Shopee / TikTok Shop / Shopify" },
  { icon: Zap, title: "AI 智能翻译", desc: "自动适配 6 个东南亚市场本地化语言 + SEO 关键词" },
  { icon: BarChart3, title: "价格监控", desc: "跨平台比价 + 智能调价策略，利润最大化" },
  { icon: Sparkles, title: "AI 客服", desc: "24/7 智能问答，解决跨境运营难题" },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite") ?? "";
  const [mode, setMode] = useState<"login" | "register">(inviteCode ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValid = email.length === 0 || emailRegex.test(email);

  function validateEmail(val: string) {
    if (val.length > 0 && !emailRegex.test(val)) {
      setEmailError("请输入有效的邮箱地址");
    } else {
      setEmailError("");
    }
  }

  const passwordCheck = useMemo(() => {
    if (mode === "register") return checkPassword(password);
    return null;
  }, [password, mode]);

  const passwordOk = mode === "login" || (passwordCheck?.valid ?? false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name, invite: inviteCode }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "注册失败");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "邮箱或密码错误" : result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("操作失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen grid grid-cols-1 md:grid-cols-3 overflow-hidden">
      {/* 左侧品牌视频区 — 2/3 */}
      <div className="hidden md:flex md:col-span-2 relative overflow-hidden bg-slate-950 items-center justify-center">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/brand-video.mp4" type="video/mp4" />
        </video>

        {/* 黑纱布遮罩 — 深黑蒙层 + 织物噪点 */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            backgroundColor: 'rgba(0,0,0,0.42)',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='4' height='4' fill='transparent'/%3E%3Crect width='1' height='1' x='0' y='0' fill='rgba(255,255,255,0.02)'/%3E%3Crect width='1' height='1' x='2' y='2' fill='rgba(255,255,255,0.015)'/%3E%3Crect width='1' height='1' x='2' y='0' fill='rgba(0,0,0,0.06)'/%3E%3Crect width='1' height='1' x='0' y='2' fill='rgba(0,0,0,0.06)'/%3E%3Crect width='1' height='1' x='1' y='3' fill='rgba(255,255,255,0.015)'/%3E%3Crect width='1' height='1' x='3' y='1' fill='rgba(255,255,255,0.015)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* 品牌内容叠加层 */}
        <div className="relative z-10 max-w-xl px-12">
          <div className="flex items-center gap-3 mb-10">
            <BrandIcon size={48} />
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                <span className="gradient-text">SellBridge</span>
              </h1>
              <p className="text-white/40 text-xs mt-0.5 tracking-wide">东南亚跨境电商 SaaS 平台</p>
            </div>
          </div>

          <p className="text-white/85 text-lg leading-relaxed mb-12 font-medium">
            将商品<span className="text-white font-bold">一键上架</span>到 Lazada、Shopee、
            TikTok Shop 和 Shopify，覆盖<span className="text-white font-bold"> 6 大东南亚市场</span>
          </p>

          <div className="grid grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <p className="text-white/90 text-sm font-semibold">{f.title}</p>
                  <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧表单区 — 1/3 */}
      <div className="flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-sm">
          {/* 品牌标识 — 与左侧同品牌图标 */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <BrandIcon size={44} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">SellBridge</h1>
            <p className="text-xs text-slate-400 mt-1">东南亚跨境电商管理平台</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
            {/* 邀请横幅 */}
            {inviteCode && mode === "register" && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 mb-4 animate-fade-in">
                <Gift className="w-4 h-4 text-indigo-500 shrink-0" />
                <p className="text-xs text-indigo-700 font-medium">通过邀请链接注册，你和邀请人各得 <span className="font-bold">50 额度</span></p>
              </div>
            )}

            {/* Tab 切换 */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => { setMode("login"); setError(""); }}
              >
                登录
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === "register"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => { setMode("register"); setError(""); }}
              >
                注册
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "register" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">名称</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                      placeholder="你的名字（选填）"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">邮箱</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    onBlur={(e) => validateEmail(e.target.value)}
                    required
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-4 ${
                      emailError
                        ? "border-red-300 focus:border-red-400 focus:ring-red-50"
                        : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-50"
                    }`}
                    placeholder="your@email.com"
                  />
                  {emailError && (
                    <p className="text-xs text-red-500 mt-1 animate-fade-in">{emailError}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">密码</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    placeholder={mode === "register" ? "至少8位，含大小写字母+数字" : "输入密码"}
                  />
                </div>

                {mode === "register" && password.length > 0 && (
                  <div className="mt-2 animate-fade-in">
                    {/* 强度条 */}
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4].map((level) => {
                        const filled = level <= (passwordCheck?.strength ?? 0);
                        const colors = [
                          "bg-red-400",
                          "bg-orange-400",
                          "bg-amber-400",
                          "bg-emerald-400",
                        ];
                        return (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              filled ? colors[level - 1] : "bg-slate-200"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className={`text-xs font-medium ${
                      !passwordCheck ? "text-slate-400" :
                      passwordCheck.strength <= 1 ? "text-red-500" :
                      passwordCheck.strength === 2 ? "text-orange-500" :
                      passwordCheck.strength === 3 ? "text-amber-500" :
                      "text-emerald-500"
                    }`}>
                      {passwordCheck?.label ?? ""}
                    </span>

                    {/* 四项要求 */}
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {[
                        { ok: password.length >= 8, label: "至少 8 位" },
                        { ok: /[A-Z]/.test(password), label: "大写字母" },
                        { ok: /[a-z]/.test(password), label: "小写字母" },
                        { ok: /[0-9]/.test(password), label: "含数字" },
                      ].map((req) => (
                        <div key={req.label} className="flex items-center gap-1">
                          {req.ok ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <X className="w-3 h-3 text-slate-300" />
                          )}
                          <span className={`text-xs ${req.ok ? "text-emerald-600" : "text-slate-400"}`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 animate-fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password || !passwordOk || !emailValid}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    处理中...
                  </>
                ) : (
                  <>
                    {mode === "login" ? "登录" : "注册"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            {mode === "login" ? "还没有账号？" : "已有账号？"}
            <button
              type="button"
              className="text-indigo-500 font-medium ml-1 hover:text-indigo-600 transition-colors"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            >
              {mode === "login" ? "立即注册" : "去登录"}
            </button>
          </p>

          <p className="text-center text-[10px] text-slate-300 mt-3">
            注册即表示同意
            <Link href="/terms" className="text-slate-400 hover:text-slate-500 underline underline-offset-2">用户协议</Link>
            和
            <Link href="/privacy" className="text-slate-400 hover:text-slate-500 underline underline-offset-2">隐私政策</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
