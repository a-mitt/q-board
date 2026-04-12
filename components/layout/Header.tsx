"use client";

import Link from "next/link";
import { Home, MessageSquare, User, Wrench } from "lucide-react";
// ★修正1: 先ほど作った本物の「通知ベル」をインポートする
import NotificationBell from "./NotificationBell"; 

export default function Header() {
  // ※権限などの管理は後ほど
  const isModerator = true; 

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* 左側：タイトルとナビゲーション */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-light tracking-wider text-gray-800 font-bold">
            先輩に質問！質問掲示板
          </Link>
          
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

        {/* 右側：アイコン群 */}
        <div className="flex items-center gap-4 relative">
          {isModerator && (
            <button className="p-2 text-gray-500 hover:text-gray-800 transition" title="モデレーターメニュー">
              <Wrench size={20} />
            </button>
          )}

          {/* ★修正2: ここで本物の通知ベル（黒文字・ゴミ箱付き）を呼び出す！ */}
          <NotificationBell />

          {/* ★修正3: 人のマークを /settings へのリンクにする */}
          <Link 
            href="/settings"
            className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition"
            title="アカウント設定"
          >
            <User size={18} />
          </Link>

          {/* ログイン画面へのリンク */}
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