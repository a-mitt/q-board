"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ShieldAlert, EyeOff, Trash2, CheckCircle, 
  Users, MessageSquare, AlertTriangle, Mail, Fingerprint, Edit3, HelpCircle, X, ShieldCheck, Info, Loader2
} from "lucide-react";

export default function AdminPage() {
  const [myRole, setMyRole] = useState<string>("student");
  const [activeTab, setActiveTab] = useState<"questions" | "threads" | "users" | "reports">("questions");
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: myProf } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
    
    if (myProf) {
      setMyRole(myProf.role);
      if (myProf.role !== "student" && !localStorage.getItem("has_seen_mod_guide")) {
        setShowGuide(true);
      }
    }

    if (myProf?.role === "admin" || myProf?.role === "moderator") {
      // 質問
      const { data: qData } = await supabase.from("questions").select("*").order("created_at", { ascending: false });
      if (qData) setQuestions(qData);
      
      // スレッド
      const { data: tData } = await supabase.from("threads").select("*").order("created_at", { ascending: false });
      if (tData) setThreads(tData);
      
      // 通報
      const { data: rData } = await supabase.from("reports").select("*, profiles!reporter_id(nickname)").order("created_at", { ascending: false });
      if (rData) setReports(rData);

      // ★ 修正：ユーザー一覧は Admin（管理者）の時だけ取得する
      if (myProf.role === "admin") {
        const { data: uData } = await supabase.from("admin_user_view").select("*").order("student_id", { ascending: true });
        if (uData) setUsers(uData);
      } else {
        // モデレーターならユーザー配列を空にする
        setUsers([]); 
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCloseGuide = () => {
    setShowGuide(false);
    localStorage.setItem("has_seen_mod_guide", "true");
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (error) alert(error.message); else fetchData();
  };

  const handleHide = async (table: "threads" | "questions", id: string, currentHidden: boolean) => {
    const { error } = await supabase.from(table).update({ is_hidden: !currentHidden }).eq("id", id);
    if (!error) fetchData();
  };

  const handleDelete = async (table: "threads" | "questions", id: string) => {
    if (!confirm("本当に完全に削除しますか？（復元できません）")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  if (myRole === "student") return <div className="p-10 text-center font-bold">権限がありません</div>;

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      {/* モデレーター・ガイド・モーダル */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-xl font-black text-gray-800">モデレーター・ガイド</h2>
              <div className="space-y-4 text-left w-full text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border">
                <div className="flex gap-3">
                  <AlertTriangle className="shrink-0 text-red-500" size={18} />
                  <p><span className="font-bold text-gray-800">「通報」をチェック：</span> 悪口や不適切な投稿が報告されていないか確認してください。</p>
                </div>
                <div className="flex gap-3">
                  <EyeOff className="shrink-0 text-orange-500" size={18} />
                  <p><span className="font-bold text-gray-800">「非表示」にする：</span> 怪しい投稿は一旦「非表示」にしましょう。後で戻せます。</p>
                </div>
                <div className="flex gap-3">
                  <Trash2 className="shrink-0 text-red-400" size={18} />
                  <p><span className="font-bold text-gray-800">「強制削除」：</span> スパム等はゴミ箱ボタンから即時削除できます。</p>
                </div>
              </div>
              <button onClick={handleCloseGuide} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg">
                了解しました！
              </button>
            </div>
          </div>
        </div>
      )}

      {/* タブメニュー */}
      <div className="flex bg-gray-100 p-1 rounded-2xl mb-6 overflow-x-auto">
        <button onClick={() => setActiveTab("questions")} className={`flex-1 min-w-[80px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${activeTab === "questions" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>
          <HelpCircle size={14} /> 質問
        </button>
        <button onClick={() => setActiveTab("threads")} className={`flex-1 min-w-[80px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${activeTab === "threads" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>
          <MessageSquare size={14} /> スレッド
        </button>
        {/* ★ 修正：Adminの時だけ「ユーザー」タブのボタンを表示 */}
        {myRole === "admin" && (
          <button onClick={() => setActiveTab("users")} className={`flex-1 min-w-[80px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${activeTab === "users" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>
            <Users size={14} /> ユーザー
          </button>
        )}
        <button onClick={() => setActiveTab("reports")} className={`flex-1 min-w-[80px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${activeTab === "reports" ? "bg-white shadow text-red-600" : "text-gray-500"}`}>
          <AlertTriangle size={14} /> 通報({reports.length})
        </button>
      </div>
      {/* ★ 修正：表示コンテンツ側も念のため Admin かつ activeTab が users の時だけ出す */}
      {activeTab === "users" && myRole === "admin" && (
        <div className="grid gap-4">
          {/* ユーザー一覧のループ処理... */}
        </div>
      )}

      {/* 1. 質問管理 */}
      {activeTab === "questions" && (
        <div className="space-y-3">
          {questions.length === 0 ? <p className="text-center py-10 text-gray-400">質問はありません</p> : 
          questions.map((q) => (
            <div key={q.id} className={`p-4 bg-white rounded-xl border ${q.is_hidden ? "bg-gray-50 opacity-50" : ""}`}>
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-gray-800 line-clamp-2 flex-1">{q.content}</p>
                <div className="flex gap-1 ml-4 shrink-0">
                  <button onClick={() => handleHide("questions", q.id, q.is_hidden)} className="p-2 hover:bg-gray-100 rounded-lg">
                    {q.is_hidden ? <CheckCircle className="text-green-500" size={18} /> : <EyeOff className="text-gray-400" size={18} />}
                  </button>
                  <button onClick={() => handleDelete("questions", q.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-gray-400">{new Date(q.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* 2. スレッド管理 */}
      {activeTab === "threads" && (
        <div className="space-y-3">
          {threads.length === 0 ? <p className="text-center py-10 text-gray-400">スレッドはありません</p> :
          threads.map((t) => (
            <div key={t.id} className={`p-4 bg-white rounded-xl border ${t.is_hidden ? "bg-gray-50 opacity-50" : ""}`}>
               <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-gray-800">{t.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{t.content}</p>
                </div>
                <div className="flex gap-1 ml-4 shrink-0">
                  <button onClick={() => handleHide("threads", t.id, t.is_hidden)} className="p-2 hover:bg-gray-100 rounded-lg">
                    {t.is_hidden ? <CheckCircle className="text-green-500" size={18} /> : <EyeOff className="text-gray-400" size={18} />}
                  </button>
                  <button onClick={() => handleDelete("threads", t.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* 3. ユーザー管理（Adminのみ） */}
      {activeTab === "users" && myRole === "admin" && (
        <div className="grid gap-4">
          {users.map((u) => (
            <div key={u.id} className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-gray-900 text-lg">{u.nickname}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                      u.role === "admin" ? "bg-red-600 text-white" : 
                      u.role === "moderator" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"
                    }`}>{u.role}</span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Fingerprint size={12}/> {u.student_id}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={12}/> {u.email}</p>
                </div>
                <select 
                  value={u.role} 
                  onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })} 
                  className={`text-xs font-black border-2 rounded-xl px-3 py-2 outline-none ${
                    u.role === "admin" ? "border-red-600 text-red-600 bg-red-50" : 
                    u.role === "moderator" ? "border-orange-500 text-orange-600 bg-orange-50" : "border-gray-200 text-gray-700"
                  }`}
                >
                  <option value="student">STUDENT</option>
                  <option value="moderator">MODERATOR</option>
                  <option value="admin">ADMIN</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 text-[10px] font-black">
                <button onClick={() => alert("メアド変更画面へ")} className="flex-1 py-2 bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors">メアド変更</button>
                <button onClick={() => { const n = prompt("名前", u.nickname); if(n) handleUpdateUser(u.id, {nickname: n})}} className="flex-1 py-2 bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors">名前変更</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. 通報管理 */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {reports.length === 0 ? <p className="text-center py-20 text-gray-400">通報はありません</p> : 
          reports.map((r) => (
            <div key={r.id} className="p-4 bg-white border-2 border-red-50 rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-600 rounded">{r.target_type.toUpperCase()}への通報</span>
                <span className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm font-bold text-gray-800 mb-1">理由: {r.reason}</p>
              <p className="text-xs text-gray-500">通報者: {r.profiles?.nickname || "不明"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}