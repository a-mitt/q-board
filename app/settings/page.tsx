"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  User, Bug, MessageSquare, ExternalLink, LogOut, Loader2, 
  ChevronRight, Bell, Lock, Trash2, Edit3, X, Check, Smile, Sparkles
} from "lucide-react";
import TutorialModal from "@/components/board/TutorialModal";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // 編集モーダル用State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newGrade, setNewGrade] = useState(""); // 1. 学年用のStateを追加

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    
    const defaultSettings = {
      notifications: { onReaction: true, onAnswer: true, onReply: true }
    };
    
    const currentProfile = { 
      ...data, 
      email: user.email,
      settings: data.settings || defaultSettings 
    };

    setProfile(currentProfile);
    // 初期値をセット
    setNewNickname(data.nickname || "");
    setNewCourse(data.course || "");
    setNewEmoji(data.avatar_emoji || "");
    setNewGrade(data.grade || ""); // 2. 学年の初期値をセット
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [router]);

  // プロフィール一括更新
  const handleUpdateProfile = async () => {
    setUpdating(true);
    // 3. 学年も含めてまとめて更新
    const { error } = await supabase
      .from("profiles")
      .update({ 
        nickname: newNickname,
        course: newCourse,
        avatar_emoji: newEmoji,
        grade: newGrade // 追加
      })
      .eq("id", profile.id);

    if (error) {
      alert("更新に失敗しました");
    } else {
      setProfile({ 
        ...profile, 
        nickname: newNickname, 
        course: newCourse, 
        avatar_emoji: newEmoji,
        grade: newGrade // 画面の表示用も更新
      });
      setIsEditModalOpen(false);
    }
    setUpdating(false);
  };

  const toggleNotification = async (key: string) => {
    const newSettings = { ...profile.settings };
    newSettings.notifications[key] = !newSettings.notifications[key];
    await supabase.from("profiles").update({ settings: newSettings }).eq("id", profile.id);
    setProfile({ ...profile, settings: newSettings });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-2xl mx-auto pb-32 space-y-6">
      <div className="flex items-center gap-2 p-4 pb-0">
        <User className="text-gray-800" size={24} />
        <h1 className="text-xl font-black text-gray-800">アカウント設定</h1>
      </div>

      {/* プロフィール表示セクション */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mx-4 md:mx-0">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {/* アイコン表示：絵文字があれば絵文字、なければ名前の1文字目 */}
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl shadow-inner border border-blue-100">
              {profile?.avatar_emoji ? profile.avatar_emoji : (profile?.nickname?.charAt(0) || "？")}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile?.nickname}</h2>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsEditModalOpen(true)} 
            className="flex items-center gap-1 px-3 py-2 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold text-xs"
          >
            <Edit3 size={16} /> 編集
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl text-sm font-medium text-gray-600 space-y-3">
          <div className="flex justify-between items-center">
            <span>学籍番号</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{profile?.student_id}</span>
              <a href="https://forms.gle/wiSYmpgZ6VeVXDZU6" target="_blank" className="text-[10px] bg-white px-2 py-1 rounded border text-blue-500 hover:bg-blue-50">変更申請</a>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span>学年</span>
            <span className="font-bold text-gray-900">{profile?.grade || "未設定"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>学科・コース</span>
            <span className="font-bold text-gray-900">{profile?.course}</span>
          </div>
        </div>
      </section>

      {/* 通知設定セクション（復活） */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm mx-4 md:mx-0 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={18} className="text-blue-500" />
          <h3 className="font-bold text-gray-800">通知設定</h3>
        </div>
        {["onReaction", "onAnswer", "onReply"].map((key) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-sm text-gray-700 font-medium">
              {key === "onReaction" ? "リアクションがついた時" : key === "onAnswer" ? "回答がついた時" : "返信がついた時"}
            </span>
            <button 
              onClick={() => toggleNotification(key)}
              className={`w-12 h-6 rounded-full relative transition-colors ${profile.settings.notifications[key] ? "bg-blue-500" : "bg-gray-200"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.settings.notifications[key] ? "left-7" : "left-1"}`} />
            </button>
          </div>
        ))}
      </section>

      {/* アプリの使い方案内 */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm mx-4 md:mx-0 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-yellow-500" />
          <h3 className="font-bold text-gray-800">アプリの使い方</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          質問掲示板と交流スレッドの違いや、匿名機能の使い方などを確認できます。
        </p>
        <button 
          onClick={() => setIsTutorialOpen(true)}
          className="w-full bg-blue-50 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-100 transition text-sm"
        >
          チュートリアルをもう一度見る
        </button>
      </section>

      {/* 外部リンク・パスワード変更など */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm mx-4 md:mx-0 overflow-hidden divide-y divide-gray-100 text-sm font-bold">
        <a href="https://forms.gle/GwDNMrTy6i1L3XSy6" target="_blank" className="flex items-center justify-between p-4 hover:bg-gray-50 group">
          <div className="flex items-center gap-3 text-gray-700"><Bug size={18} className="text-red-500" />不具合報告</div>
          <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-500" />
        </a>
        <a href="https://forms.gle/rJMGVW6i8A1iY6TH8" target="_blank" className="flex items-center justify-between p-4 hover:bg-gray-50 group">
          <div className="flex items-center gap-3 text-gray-700"><MessageSquare size={18} className="text-blue-500" />感想・意見</div>
          <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-500" />
        </a>
        <button onClick={() => alert("パスワード変更メールを送信します")} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left">
          <div className="flex items-center gap-3 text-gray-700"><Lock size={18} className="text-gray-400" />パスワード変更</div>
          <ChevronRight size={14} className="text-gray-300" />
        </button>
      </section>

      {/* 危険ゾーン */}
      <div className="px-4 md:px-0 space-y-3 pt-4 pb-10">
        <button onClick={() => { if(confirm("ログアウトしますか？")) supabase.auth.signOut().then(() => router.push("/")) }} className="w-full bg-white border-2 border-gray-100 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-50 transition flex justify-center items-center gap-2">
          <LogOut size={18} /> ログアウト
        </button>
        <button onClick={() => alert("退会申請を受け付けます")} className="w-full bg-red-50 text-red-500 font-bold py-3 rounded-xl hover:bg-red-100 transition flex justify-center items-center gap-2">
          <Trash2 size={18} /> 掲示板を退会する
        </button>
      </div>

      {/* 編集ポップアップ（一括修正） */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-gray-800">プロフィール編集</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={20} className="text-gray-400" /></button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">学年（任意）</label>
                <select 
                  value={newGrade} 
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800"
                >
                  <option value="">未設定</option>
                  <option value="1年">1年</option>
                  <option value="2年">2年</option>
                  <option value="3年">3年</option>
                  <option value="4年">4年</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">アイコン設定：好きな絵文字 (Icon)</label>
                <div className="relative">
                  <Smile className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text" 
                    value={newEmoji} 
                    onChange={(e) => setNewEmoji(e.target.value)}
                    placeholder="🔥 や 🐣 など"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">ニックネーム</label>
                <input 
                  type="text" 
                  value={newNickname} 
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">学科・コース</label>
                <input 
                  type="text" 
                  value={newCourse} 
                  onChange={(e) => setNewCourse(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800"
                />
              </div>

              <button 
                onClick={handleUpdateProfile}
                disabled={updating}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {updating ? <Loader2 className="animate-spin" size={20} /> : <><Check size={20}/> 変更を保存する</>}
              </button>
              
            </div>
          </div>
        </div>
      )}
      <TutorialModal 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
      />
    </div>
  );
}