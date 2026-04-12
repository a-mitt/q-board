"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('settings').eq('id', user.id).single();
        // 初期設定がない場合のフォールバック
        setSettings(data?.settings || { notifications: { onAnswer: true, onReaction: true, emailEnabled: false } });
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const updateNotificationSetting = async (key: string, value: boolean) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, [key]: value }
    };
    setSettings(newSettings); // 画面の表示を先に更新
    await supabase.from('profiles').update({ settings: newSettings }).eq('id', user.id);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (!user) return <div className="text-center py-20">ログインしてください</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-gray-800">設定</h1>
      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-600">通知設定</h2>
        </div>
        <div className="p-4 space-y-2">
          {/* 回答通知トグル */}
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
            <span className="text-sm font-bold text-gray-700">回答がついた時に通知</span>
            <input 
              type="checkbox" 
              checked={settings?.notifications?.onAnswer}
              onChange={(e) => updateNotificationSetting('onAnswer', e.target.checked)}
              className="w-5 h-5 accent-gray-900 cursor-pointer" 
            />
          </label>
          
          {/* リアクション通知トグル */}
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
            <span className="text-sm font-bold text-gray-700">リアクションがついた時に通知</span>
            <input 
              type="checkbox" 
              checked={settings?.notifications?.onReaction}
              onChange={(e) => updateNotificationSetting('onReaction', e.target.checked)}
              className="w-5 h-5 accent-gray-900 cursor-pointer" 
            />
          </label>
        </div>
      </div>
    </div>
  );
}