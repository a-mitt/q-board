"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, User, Bell, Mail,Trash2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // フォーム用State
  const [nickname, setNickname] = useState("");
  const [course, setCourse] = useState("");
  const [settings, setSettings] = useState<any>({ notifications: { onAnswer: true, onReaction: true } });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        setNickname(data.nickname || "");
        setCourse(data.course || "");
        if (data.settings) setSettings(data.settings);
      }
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // プロフィール情報と通知設定をまとめて保存
    const { error } = await supabase.from("profiles").update({
      nickname,
      course,
      settings
    }).eq("id", currentUser.id);

    if (error) alert("エラー: " + error.message);
    else alert("設定を保存しました。");
    
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = confirm("本当に退会しますか？\n投稿した質問や回答などのデータはすべて削除され、元に戻せません。");
    if (!confirmDelete) return;

    setSaving(true);
    // 1. プロフィールデータの削除（SQLの cascade 設定により紐づく投稿も消える設定の場合）
    const { error } = await supabase.from("profiles").delete().eq("id", currentUser.id);

    if (error) {
      alert("退会処理中にエラーが発生しました: " + error.message);
      setSaving(false);
    } else {
      // 2. ログアウトさせてログイン画面へ
      await supabase.auth.signOut();
      alert("退会処理が完了しました。ご利用ありがとうございました。");
      router.push("/login");
    }
  };

  const handleLogout = async () => {
    if (!confirm("ログアウトしますか？")) return;
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">アカウント設定</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition"
        >
          <LogOut size={16} /> ログアウト
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleUpdateProfile} className="divide-y divide-gray-100">
          
          {/* 基本情報セクション */}
          <div className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
              <User size={18} className="text-gray-400"/> プロフィール情報
            </h2>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">メールアドレス</label>
              <input type="email" disabled value={currentUser?.email} className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm" />
              <p className="mt-2 text-[11px] text-gray-400 leading-relaxed">
                ※ 原則としてメールアドレスの変更はできません。変更が必要な場合はアカウントを作り直すか、
                <a href="https://docs.google.com/forms/..." target="_blank" className="text-blue-500 underline">こちらのフォーム</a> 
                よりお問い合わせください。
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">学籍番号（変更不可）</label>
              <input type="text" disabled value={profile?.student_id} className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ニックネーム</label>
              <input 
                type="text" 
                value={nickname} 
                onChange={(e) => setNickname(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">履修コース/専攻</label>
              <input 
                type="text" 
                value={course} 
                onChange={(e) => setCourse(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 text-sm" 
              />
            </div>
          </div>

          {/* 通知設定セクション */}
          <div className="p-6 space-y-4 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Bell size={18} className="text-gray-400"/> 通知設定
            </h2>
            
            <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition shadow-sm">
              <span className="text-sm font-bold text-gray-700">回答・レスがついた時に通知する</span>
              <input 
                type="checkbox" 
                checked={settings.notifications?.onAnswer || false}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, onAnswer: e.target.checked } })}
                className="w-5 h-5 accent-gray-900 cursor-pointer" 
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition shadow-sm">
              <span className="text-sm font-bold text-gray-700">リアクションされた時に通知する</span>
              <input 
                type="checkbox" 
                checked={settings.notifications?.onReaction || false}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, onReaction: e.target.checked } })}
                className="w-5 h-5 accent-gray-900 cursor-pointer" 
              />
            </label>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-gray-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg disabled:opacity-50"
            >
              {saving ? "保存中..." : "設定を保存する"}
            </button>
          </div>
          <div className="p-6 bg-red-50 border-t border-red-100 flex flex-col items-center gap-3">
            <p className="text-xs text-red-600 font-bold">一度退会するとデータは復旧できません</p>
            <button 
              type="button"
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 px-8 py-3 text-sm font-bold text-gray-700 bg-red-200 hover:bg-red-500 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              <Trash2 size={18} /> 掲示板から退会する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}