"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, User, Bell, ShieldAlert } from "lucide-react"; // ★ ShieldAlert を追加

export default function BottomNav() {
  const pathname = usePathname();
  const [myRole, setMyRole] = useState("student");

  // ★ 自分の権限を取得する
  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (data) setMyRole(data.role);
      }
    };
    getRole();
  }, []);

  // 基本のナビゲーション
  const navItems = [
    { name: "ホーム", href: "/", icon: Home },
    { name: "スレッド", href: "/threads", icon: MessageSquare },
    { name: "通知", href: "/notifications", icon: Bell }, // ★ "#" から "/notifications" に修正！
    { name: "設定", href: "/settings", icon: User },
  ];

  // ★ モデレーターか管理者なら「管理」ボタンを特別に追加！
  if (myRole === "admin" || myRole === "moderator") {
    navItems.push({ name: "管理", href: "/admin", icon: ShieldAlert });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] overflow-x-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.name} 
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon size={20} className={isActive ? "fill-blue-50" : ""} />
            <span className="text-[10px] font-bold whitespace-nowrap">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}