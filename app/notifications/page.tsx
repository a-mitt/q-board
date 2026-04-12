"use client";

import { Bell, Clock, ChevronRight } from "lucide-react";

export default function NotificationsPage() {
  // 本来はSupabaseから取得しますが、まずは表示確認用のダミーデータです
  const notifications = [
    { id: 1, title: "あなたの投稿に「いいね」がつきました", time: "5分前", read: false },
    { id: 2, title: "スレッド「学食のおすすめ」に新しい書き込みがあります", time: "1時間前", read: true },
    { id: 3, title: "プロフィールが承認されました", time: "昨日", read: true },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-2 p-4 mb-2">
        <Bell className="text-blue-600" size={24} />
        <h1 className="text-xl font-black text-gray-800">通知</h1>
      </div>

      <div className="space-y-1">
        {notifications.map((n) => (
          <div 
            key={n.id} 
            className={`flex items-center justify-between p-4 bg-white border-b border-gray-100 active:bg-gray-50 transition-colors ${!n.read ? "border-l-4 border-l-blue-500" : ""}`}
          >
            <div className="flex-1">
              <p className={`text-sm ${!n.read ? "font-bold text-gray-900" : "text-gray-600"}`}>
                {n.title}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                <Clock size={10} />
                <span>{n.time}</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Bell size={48} className="mb-2 opacity-20" />
          <p className="font-bold">通知はまだありません</p>
        </div>
      )}
    </div>
  );
}