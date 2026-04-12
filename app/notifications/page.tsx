"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Bell, Clock, ChevronRight, Loader2 } from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 最新の通知を50件取得
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, [router]);

  // 通知をクリックした時の処理（既読にしてリンクへ飛ぶ）
  const handleNotificationClick = async (id: string, link: string | null, isRead: boolean) => {
    // まだ未読なら既読（true）に更新
    if (!isRead) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    }
    // リンク先が設定されていれば飛ぶ
    if (link) {
      router.push(link);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-2 p-4 mb-2">
        <Bell className="text-blue-600" size={24} />
        <h1 className="text-xl font-black text-gray-800">通知</h1>
      </div>

      <div className="space-y-1">
        {notifications.map((n) => (
          <div 
            key={n.id} 
            onClick={() => handleNotificationClick(n.id, n.link, n.is_read)}
            className={`flex items-center justify-between p-4 bg-white border-b border-gray-100 cursor-pointer active:bg-gray-50 transition-colors ${!n.is_read ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""}`}
          >
            <div className="flex-1">
              <p className={`text-sm ${!n.is_read ? "font-bold text-gray-900" : "text-gray-600"}`}>
                {n.message}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                <Clock size={10} />
                <span>{new Date(n.created_at).toLocaleString()}</span>
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