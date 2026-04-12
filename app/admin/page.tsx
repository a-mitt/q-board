"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ShieldAlert, EyeOff, Trash2, CheckCircle, 
  Users, MessageSquare, AlertTriangle, Mail, Fingerprint, Edit3, HelpCircle
} from "lucide-react";

export default function AdminPage() {
  const [myRole, setMyRole] = useState<string>("student");
  // ★ "questions" タブを追加
  const [activeTab, setActiveTab] = useState<"questions" | "threads" | "users" | "reports">("questions");
  
  const [questions, setQuestions] = useState<any[]>([]); // ★ 質問一覧用
  const [threads, setThreads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: myProf } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
    if (myProf) setMyRole(myProf.role);

    if (myProf?.role === "admin" || myProf?.role === "moderator") {
      // 質問取得
      const { data: qData } = await supabase.from("questions").select("*").order("created_at", { ascending: false });
      if (qData) setQuestions(qData);

      // スレッド取得
      const { data: tData } = await supabase.from("threads").select("*").order("created_at", { ascending: false });
      if (tData) setThreads(tData);
      
      // 通報取得
      const { data: rData } = await supabase.from("reports").select("*, profiles!reporter_id(nickname)").order("created_at", { ascending: false });
      if (rData) setReports(rData);

      // ユーザー取得
      if (myProf.role === "admin") {
        const { data: uData } = await supabase.from("admin_user_view").select("*").order("student_id", { ascending: true });
        if (uData) setUsers(uData);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- 管理関数 ---
  const handleUpdateUser = async (userId: string, updates: any) => {
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (error) alert(error.message); else fetchData();
  };

  const handleEmailChange = async (userId: string, currentEmail: string) => {
    const newEmail = prompt(`${currentEmail} から変更する新しいメアドを入力`, currentEmail);
    if (!newEmail || newEmail === currentEmail) return;
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch("/api/admin/update-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newEmail, adminUserId: user?.id }),
    });
    const result = await res.json();
    if (result.success) { alert("変更しました！"); fetchData(); } else { alert("失敗: " + result.error); }
  };

// スレッド・質問の非表示
  const handleHide = async (table: "threads" | "questions", id: string, currentHidden: boolean) => {
    const { error } = await supabase.from(table).update({ is_hidden: !currentHidden }).eq("id", id);
    if (error) {
      alert("更新エラー: " + error.message); // ★追加：エラーを見えるようにする
    } else {
      fetchData();
    }
  };

  // ★ スレッド・質問の完全削除
  const handleDelete = async (table: "threads" | "questions", id: string) => {
    if (!confirm("本当に完全に削除しますか？（復元できません）")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      alert("削除エラー: " + error.message); // ★追加：エラーを見えるようにする
    } else {
      fetchData();
    }
  };


  if (myRole === "student") return <div className="p-10 text-center font-bold">権限がありません</div>;

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      {/* タブ */}
      <div className="flex bg-gray-100 p-1 rounded-2xl mb-6 overflow-x-auto">
        <button onClick={() => setActiveTab("questions")} className={`flex-1 min-w-[80px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${activeTab === "questions" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>
          <HelpCircle size={14} /> 質問
        </button>
        <button onClick={() => setActiveTab("threads")} className={`flex-1 min-w-[80px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${activeTab === "threads" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>
          <MessageSquare size={14} /> スレッド
        </button>
        {myRole === "admin" && <button onClick={() => setActiveTab("users")} className={`flex-1 min-w-[80px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${activeTab === "users" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>
          <Users size={14} /> ユーザー
        </button>}
        <button onClick={() => setActiveTab("reports")} className={`flex-1 min-w-[80px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${activeTab === "reports" ? "bg-white shadow text-red-600" : "text-gray-500"}`}>
          <AlertTriangle size={14} /> 通報({reports.length})
        </button>
      </div>

      {activeTab === "users" && (
        <div className="grid gap-4">
          {/* ...ユーザー管理のコードはそのまま... */}
          {users.map((u) => (
            <div key={u.id} className="bg-white p-4 rounded-2xl border shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-gray-800 text-lg">{u.nickname}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Fingerprint size={12}/> {u.student_id}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12}/> {u.email}</p>
                </div>
                <select value={u.role} onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })} className="text-xs font-bold border rounded p-1">
                  <option value="student">Student</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <button onClick={() => handleEmailChange(u.id, u.email)} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">メアド変更</button>
                <button onClick={() => { const n = prompt("名前", u.nickname); if(n) handleUpdateUser(u.id, {nickname: n})}} className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold">名前変更</button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* ★ 質問管理タブの中身 */}
      {activeTab === "questions" && (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className={`p-4 bg-white rounded-xl border ${q.is_hidden ? "bg-gray-50 opacity-50" : ""}`}>
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-gray-800 line-clamp-2 flex-1">{q.content}</p>
                <div className="flex gap-1 ml-4 shrink-0">
                  <button onClick={() => handleHide("questions", q.id, q.is_hidden)} className="p-2 hover:bg-gray-100 rounded-lg" title={q.is_hidden ? "公開に戻す" : "非表示にする"}>
                    {q.is_hidden ? <CheckCircle className="text-green-500" size={18} /> : <EyeOff className="text-gray-400" size={18} />}
                  </button>
                  <button onClick={() => handleDelete("questions", q.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg" title="強制削除">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-gray-400">作成日: {new Date(q.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* スレッド管理タブの中身 */}
      {activeTab === "threads" && (
        <div className="space-y-3">
          {threads.map((t) => (
            <div key={t.id} className={`p-4 bg-white rounded-xl border ${t.is_hidden ? "bg-gray-50 opacity-50" : ""}`}>
               <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-gray-800">{t.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{t.content}</p>
                </div>
                <div className="flex gap-1 ml-4 shrink-0">
                  <button onClick={() => handleHide("threads", t.id, t.is_hidden)} className="p-2 hover:bg-gray-100 rounded-lg" title={t.is_hidden ? "公開に戻す" : "非表示にする"}>
                    {t.is_hidden ? <CheckCircle className="text-green-500" size={18} /> : <EyeOff className="text-gray-400" size={18} />}
                  </button>
                  <button onClick={() => handleDelete("threads", t.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg" title="強制削除">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-gray-400">作成日: {new Date(t.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* 通報管理タブ */}
      {activeTab === "reports" && (
        <div className="space-y-4">
            {reports.length === 0 ? (
            <p className="text-center py-20 text-gray-400">通報はありません</p>
            ) : (
            reports.map((r) => (
                <div key={r.id} className="p-4 bg-white border-2 border-red-50 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-600 rounded">
                    {r.target_type.toUpperCase()}への通報
                    </span>
                    <span className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm font-bold text-gray-800 mb-1">理由: {r.reason}</p>
                <p className="text-xs text-gray-500 mb-3">通報者: {r.profiles?.nickname || "不明"}</p>
                </div>
            ))
            )}
        </div>
        )}
    </div>
  );
}