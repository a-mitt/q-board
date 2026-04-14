"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Home, MessageSquare, User, Wrench } from "lucide-react";
import NotificationBell from "./NotificationBell"; 

export default function Header() {
  const [role, setRole] = useState<string>("student");

  // ★ ログイン中のユーザーの権限（role）を取得する
  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (data) setRole(data.role);
      }
    };
    fetchRole();
  }, []);

  // 管理者かモデレーターなら true
  const canAccessAdmin = role === "admin" || role === "moderator";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-wider text-gray-800">
            先輩に質問！
            <br className="md:hidden" />
            <span className="md:ml-1">質問掲示板</span>
          </Link>
          <span className="hidden md:block text-[10px] text-gray-400 font-medium tracking-wider">
            ※この掲示板の利用期限は5月末までを予定しています
          </span>
          
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
            <Link href="/" className="flex items-center gap-1 hover:text-blue-600 transition">
              <Home size={18} />
              質問掲示板
            </Link>
            <Link href="/threads" className="flex items-center gap-1 hover:text-blue-600 transition">
              <MessageSquare size={18} />
              交流スレッド
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4 relative">
          {/* ★ 修正：権限がある時だけスパナマークを表示 */}
          {canAccessAdmin && (
            <Link 
              href="/admin" 
              className="p-2 text-gray-500 hover:text-blue-600 transition rounded-full hover:bg-blue-50" 
              title="管理画面（アドミン・モデレーター専用）"
            >
              <Wrench size={20} />
            </Link>
          )}

          <NotificationBell />

          <Link 
            href="/settings"
            className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition"
            title="アカウント設定"
          >
            <User size={18} />
          </Link>

          <Link 
            href="/login"
            className="text-sm font-bold text-blue-600 border border-blue-600 px-4 py-2 rounded-full hover:bg-blue-50 transition"
          >
            ログイン
          </Link>
        </div>
      </div>
    </header>
  );
}