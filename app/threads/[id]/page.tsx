"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Lock, Globe, Trash2, EyeOff, RefreshCcw } from "lucide-react";
import ReactionButtons from "@/components/board/ReactionButtons";
import { sendNotification } from "@/lib/utils/notifications"; // ★通知関数をインポート

export default function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // --- 状態管理（State） ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myRole, setMyRole] = useState<string>("student");
  const [thread, setThread] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  
  const [content, setContent] = useState(""); // 書き込み内容
  const [kotehan, setKotehan] = useState(""); // コテハン
  const [isAnonymous, setIsAnonymous] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- ユーティリティ関数 ---
  // ID生成
  const generateDailyId = (userId: string, dateString: string) => {
    if (!userId) return "???";
    const str = userId + dateString;
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
    return Math.abs(hash).toString(36).substring(0, 8).toUpperCase();
  };

  // --- データ取得 ---
  const fetchThreadData = async () => {
    setLoading(true);
    
    // 1. ユーザー情報と権限（Role）を取得
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setMyRole(profile?.role || "student");
    }

    // 2. スレッド情報を取得
    const { data: tData, error: tError } = await supabase.from("threads").select("*").eq("id", id).single();
    if (tError) { router.push("/threads"); return; }
    setThread(tData);

    // 3. レスを取得（削除されていないもの、またはモデレーター以上なら非表示も見る）
    let query = supabase.from("thread_posts").select("*, profiles(nickname)").eq("thread_id", id).order("post_number", { ascending: true });
    
    // 一般生徒なら公開されているものだけ、モデレーターなら非表示も取得（完全削除はそもそもDBから消える想定）
    if (myRole === "student") {
      query = query.eq("status", "published");
    } else {
      query = query.in("status", ["published", "hidden"]);
    }

    const { data: pData } = await query;
    setPosts(pData || []);
    
    setLoading(false);
  };

  useEffect(() => { fetchThreadData(); }, [id, myRole]); // myRoleが変わった時も再取得

  // --- アクション（書き込み） ---
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentUser) return;

    setSubmitting(true);
    const nextNumber = posts.length > 0 ? posts[posts.length - 1].post_number + 1 : 1;

    const { error } = await supabase.from("thread_posts").insert({
      thread_id: id,
      user_id: currentUser.id,
      post_number: nextNumber,
      content: content,
      is_anonymous: isAnonymous,
      custom_name: isAnonymous && kotehan.trim() !== "" ? kotehan.trim() : null
    });

    if (!error) { 
      setContent(""); 
      fetchThreadData(); // リロード

      // ★スレ主に通知を飛ばす
      if (thread?.creator_id) {
        await sendNotification(
          thread.creator_id,
          'answer',
          `スレッド「${thread.title}」に書き込みがありました（>>${nextNumber}）`,
          `/threads/${id}#post-${nextNumber}`
        );
      }
    } else { 
      alert("エラー: " + error.message); 
    }
    setSubmitting(false);
  };

  // --- アクション（モデレーション） ---
  // ステータス変更（非表示・復活）
  const handleUpdateStatus = async (postId: string, newStatus: string) => {
    if (!confirm(`この投稿を${newStatus === "hidden" ? "非表示" : "公開"}にしますか？`)) return;
    await supabase.from("thread_posts").update({ status: newStatus }).eq("id", postId);
    fetchThreadData();
  };

  // 完全削除
  const handleHardDelete = async (postId: string) => {
    if (!confirm("本当にこの投稿を完全に削除しますか？（元に戻せません）")) return;
    await supabase.from("thread_posts").delete().eq("id", postId);
    fetchThreadData();
  };


  // --- UI表示 ---
  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 bg-gray-800 rounded-xl animate-spin opacity-80"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/threads" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition text-sm font-bold">
        <ArrowLeft size={18} /> スレッド一覧へ
      </Link>

      {/* スレッドタイトル */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">{thread?.title}</h1>
      </div>

      {/* レス一覧 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {posts.map((post) => {
            const dateStr = new Date(post.created_at).toISOString().split('T')[0];
            const dailyId = generateDailyId(post.user_id, dateStr);
            const defaultName = thread?.default_name || "名無しの新入生";
            const name = post.custom_name || (post.is_anonymous ? defaultName : post.profiles?.nickname || "名無しさん");
            const isHidden = post.status === "hidden";

            return (
              <div key={post.id} id={`post-${post.post_number}`} className={`p-6 transition-colors duration-700 ${isHidden ? 'bg-gray-100 opacity-60' : 'hover:bg-gray-50/50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-end gap-2 font-mono text-sm">
                    <span className="text-gray-500 font-bold">{post.post_number}</span>
                    <span className="text-gray-400">:</span>
                    <span 
                      onClick={() => {
                        const input = prompt("このスレッドで使う名前（コテハン）を入力：", kotehan);
                        if (input !== null) setKotehan(input);
                      }}
                      className="text-[#117743] font-bold cursor-pointer hover:underline"
                    >
                      {name}
                    </span>
                    <span className="text-gray-400 text-xs ml-2">
                      {new Date(post.created_at).toLocaleString()} ID:{dailyId}
                    </span>
                  </div>

                  {/* ★ モデレーション用ボタン */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* 一般生徒の削除権限（自分の投稿のみ） */}
                    {currentUser?.id === post.user_id && myRole === "student" && (
                      <button onClick={() => handleHardDelete(post.id)} className="text-xs text-red-500 hover:underline">削除</button>
                    )}
                    
                    {/* モデレーター・アドミンの権限 */}
                    {(myRole === "moderator" || myRole === "admin") && (
                      <>
                        {isHidden ? (
                          <button onClick={() => handleUpdateStatus(post.id, 'published')} className="text-xs text-blue-500 flex items-center gap-1"><RefreshCcw size={12}/> 復活</button>
                        ) : (
                          <button onClick={() => handleUpdateStatus(post.id, 'hidden')} className="text-xs text-orange-500 flex items-center gap-1"><EyeOff size={12}/> 非表示</button>
                        )}
                        <button onClick={() => handleHardDelete(post.id)} className="text-xs text-red-600 flex items-center gap-1"><Trash2 size={12}/> 強制削除</button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* 本文（安価対応） */}
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px]">
                  {isHidden ? <span className="text-red-500 font-bold">※この投稿はモデレーターにより非表示にされています</span> : 
                    post.content.split(/(>>\d+)/g).map((part: string, i: number) => {
                      if (part.match(/^>>\d+$/)) {
                        const targetNumber = part.replace(">>", "");
                        return (
                          <span key={i} onClick={() => {
                            const targetEl = document.getElementById(`post-${targetNumber}`);
                            if (targetEl) {
                              targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                              targetEl.classList.add("bg-gray-200");
                              setTimeout(() => targetEl.classList.remove("bg-gray-200"), 1000);
                            }
                          }} className="text-blue-600 font-bold cursor-pointer hover:underline">
                            {part}
                          </span>
                        );
                      }
                      return part;
                    })
                  }
                </p>
                <ReactionButtons targetId={post.id} type="answer" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 書き込みフォーム */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <form onSubmit={handlePost} className="space-y-4">
          <textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="書き込み内容を入力..." className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/50 text-gray-800" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button type="button" onClick={() => setIsAnonymous(!isAnonymous)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${isAnonymous ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-600"}`}>
                {isAnonymous ? <Lock size={16} /> : <Globe size={16} />}
                {isAnonymous ? "匿名" : "記名"}
              </button>
              
              {isAnonymous && (
                <input 
                  type="text" 
                  value={kotehan} 
                  onChange={(e) => setKotehan(e.target.value)} 
                  placeholder={`名前（省略時は ${thread?.default_name || "名無しの新入生"}）`} 
                  className="flex-1 sm:w-48 p-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-200 text-gray-800"
                />
              )}
            </div>
            
            <button type="submit" disabled={submitting || !content.trim()} className="w-full sm:w-auto bg-gray-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? "送信中..." : <><Send size={18} /> 書き込む</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}