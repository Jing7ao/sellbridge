"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, LogOut, Package, History, BarChart3,
  Bot, Settings, UserCircle, ShoppingBag, Boxes,
} from "lucide-react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { BrandIcon, BrandWordmark } from "../components/brand-logo";
import { ThemeToggle } from "../components/theme-toggle";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>
            <Toaster position="top-center" richColors closeButton />
            <AppShell>{children}</AppShell>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800
                    dark:from-slate-950 dark:via-slate-950 dark:to-slate-900
                    text-white flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <BrandIcon size={32} />
            <div>
              <h1 className="text-base font-bold tracking-tight">
                <BrandWordmark size={16} />
              </h1>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 导航 */}
        <nav className="flex-1 px-3 py-5 space-y-0.5">
          <NavItem
            href="/" icon={<Package className="w-4 h-4" />}
            label="商品上架" active={pathname === "/"}
          />
          <NavItem
            href="/history" icon={<History className="w-4 h-4" />}
            label="上架记录" active={pathname === "/history"}
          />
          <NavItem
            href="/orders" icon={<ShoppingBag className="w-4 h-4" />}
            label="订单管理" active={pathname === "/orders"}
          />
          <NavItem
            href="/inventory" icon={<Boxes className="w-4 h-4" />}
            label="库存管理" active={pathname === "/inventory"}
          />
          <NavItem
            href="/monitor" icon={<BarChart3 className="w-4 h-4" />}
            label="价格监控" active={pathname === "/monitor"}
          />
          <NavItem
            href="/ai-support" icon={<Bot className="w-4 h-4" />}
            label="AI 客服" active={pathname === "/ai-support"}
          />
          <NavItem
            href="/settings" icon={<Settings className="w-4 h-4" />}
            label="店铺设置" active={pathname === "/settings"}
          />
          <NavItem
            href="/account" icon={<UserCircle className="w-4 h-4" />}
            label="用户中心" active={pathname === "/account"}
          />
        </nav>

        {/* 底部：主题切换 + 用户 */}
        <div className="px-3 pb-3 space-y-1.5">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[10px] text-slate-500">v0.3.0</span>
            <ThemeToggle />
          </div>

          {session?.user && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white/5 backdrop-blur border border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                {(session.user.name || session.user.email || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {session.user.name || session.user.email}
                </p>
                <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                title="退出登录"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 移动端顶栏 */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm">
            <BrandWordmark size={14} />
          </span>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${
        active
          ? "bg-white/10 text-white font-medium"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gradient-to-b from-indigo-400 to-violet-500" />
      )}
      <span className={`${active ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-300"}`}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
