"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, MessageSquare, Heart, AlertCircle, Trash2 } from "lucide-react";
import Link from "next/link";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const channel = supabase.channel('realtime:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  // ★追加：過去のテスト通知（ゴミデータ）を全部消す機能
  const clearNotifications = async () => {
    if (!confirm("通知履歴をすべて削除しますか？")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').delete().eq('user_id', user.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'answer': return <MessageSquare size={14} className="text-blue-500" />;
      case 'reaction': return <Heart size={14} className="text-pink-500" />;
      default: return <AlertCircle size={14} className="text-yellow-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAsRead(); }}
        className="relative p-2 text-gray-500 hover:text-gray-800 transition rounded-full hover:bg-gray-100"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
            {/* ★修正: 「お知らせ」の文字色を text-black にしてクッキリ表示 */}
            <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="text-sm font-black text-black">お知らせ</span>
              {/* ゴミ箱ボタン */}
              {notifications.length > 0 && (
                <button onClick={clearNotifications} className="text-gray-400 hover:text-red-500 transition">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs font-bold text-gray-400">通知はありません</div>
              ) : (
                notifications.map(n => (
                  <Link 
                    key={n.id} 
                    href={n.link_to || "#"} 
                    onClick={() => setIsOpen(false)}
                    className={`block p-4 transition-colors hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50/20' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 bg-white p-1.5 rounded-full shadow-sm border border-gray-200 h-fit">
                        {getIcon(n.type)}
                      </div>
                      <div className="space-y-1">
                        {/* ★修正: 通知文の文字色もハッキリさせる */}
                        <p className={`text-sm ${!n.is_read ? 'font-black text-gray-900' : 'font-medium text-gray-700'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}