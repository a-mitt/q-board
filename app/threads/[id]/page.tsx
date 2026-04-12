"use client";

import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Send, Lock, Globe, Trash2, EyeOff, RefreshCcw, 
  MoreHorizontal, Reply, AlertTriangle, CornerDownRight, X 
} from "lucide-react";
import ReactionButtons from "@/components/board/ReactionButtons";
import { sendNotification } from "@/lib/utils/notifications";

export default function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- 状態管理 ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myRole, setMyRole] = useState<string>("student");
  const [thread, setThread] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  
  const [content, setContent] = useState("");
  const [kotehan, setKotehan] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ★ 新機能：返信ターゲットの管理
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // --- ユーティリティ ---
  const generateDailyId = (userId: string, dateString: string) => {
    if (!userId) return "???";
    const str = userId + dateString;
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
    return Math.abs(hash).toString(36).substring(0, 8).toUpperCase();
  };

  // 特定のレス番号にスクロール
  const scrollToPost = (num: number) => {
    const el = document.getElementById(`post-${num}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-blue-50");
      setTimeout(() => el.classList.remove("bg-blue-50"), 2000);
    }
  };

  // --- データ取得 ---
  const fetchThreadData = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setMyRole(profile?.role || "student");
    }

    const { data: tData, error: tError } = await supabase.from("threads").select("*").eq("id", id).single();
    if (tError) { router.push("/threads"); return; }
    setThread(tData);

    // ★ 返信元の情報（reply_to）も一緒に取得するように変更
    let query = supabase.from("thread_posts").select(`
      *, 
      profiles(nickname),
      reply_to:reply_to_id(post_number, content, profiles(nickname))
    `).eq("thread_id", id).order("post_number", { ascending: true });
    
    if (myRole === "student") {
      query = query.eq("status", "published");
    } else {
      query = query.in("status", ["published", "hidden"]);
    }

    const { data: pData } = await query;
    setPosts(pData || []);
    setLoading(false);
  };

  useEffect(() => { fetchThreadData(); }, [id, myRole]);

  // --- アクション ---
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
      custom_name: isAnonymous && kotehan.trim() !== "" ? kotehan.trim() : null,
      reply_to_id: replyTarget?.id || null // ★返信先IDを紐付け
    });

    if (!error) { 
      setContent(""); 
      setReplyTarget(null);
      fetchThreadData();

      if (thread?.creator_id) {
        await sendNotification(
          thread.creator_id,
          'answer',
          `スレ「${thread.title}」にレスがありました（>>${nextNumber}）`,
          `/threads/${id}#post-${nextNumber}`
        );
      }
    }
    setSubmitting(false);
  };

  // モデレーション
  const handleUpdateStatus = async (postId: string, newStatus: string) => {
    if (!confirm(`この投稿を${newStatus === "hidden" ? "非表示" : "公開"}にしますか？`)) return;
    await supabase.from("thread_posts").update({ status: newStatus }).eq("id", postId);
    setOpenMenuId(null);
    fetchThreadData();
  };

  const handleHardDelete = async (postId: string) => {
    if (!confirm("完全に削除しますか？（元に戻せません）")) return;
    await supabase.from("thread_posts").delete().eq("id", postId);
    setOpenMenuId(null);
    fetchThreadData();
  };

  const handleReport = async (postId: string) => {
    const reason = prompt("通報の理由を入力してください：");
    if (!reason) return;
    await supabase.from("reports").insert({
      reporter_id: currentUser?.id,
      target_type: 'post',
      target_id: postId,
      reason: reason
    });
    alert("通報しました。");
    setOpenMenuId(null);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 bg-gray-900 rounded-xl animate-spin"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-40">
      <Link href="/threads" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition text-sm font-bold">
        <ArrowLeft size={18} /> スレッド一覧へ
      </Link>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">{thread?.title}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        {posts.map((post) => {
          const dateStr = new Date(post.created_at).toISOString().split('T')[0];
          const dailyId = generateDailyId(post.user_id, dateStr);
          const name = post.custom_name || (post.is_anonymous ? (thread?.default_name || "名無しの新入生") : post.profiles?.nickname || "名無しさん");
          const isHidden = post.status === "hidden";

          return (
            <div key={post.id} id={`post-${post.post_number}`} className={`p-6 relative group transition-colors duration-500 ${isHidden ? 'bg-gray-50 opacity-60' : ''}`}>
              
              {/* ★ Discord風：返信元表示 */}
              {post.reply_to && (
                <button 
                  onClick={() => scrollToPost(post.reply_to.post_number)}
                  className="flex items-center gap-1 text-[11px] text-gray-400 mb-2 ml-1 hover:text-blue-500 transition max-w-full"
                >
                  <CornerDownRight size={12} className="shrink-0" />
                  <span className="font-bold shrink-0">@{post.reply_to.post_number}</span>
                  <span className="line-clamp-1 text-left">{post.reply_to.content}</span>
                </button>
              )}

              <div className="flex justify-between items-start mb-2">
                <div className="flex items-end gap-2 font-mono text-xs">
                  <span className="text-gray-500 font-bold">{post.post_number}</span>
                  <span className="text-[#117743] font-bold">{name}</span>
                  <span className="text-gray-400">
                    {new Date(post.created_at).toLocaleString()} ID:{dailyId}
                  </span>
                </div>

                {/* ★ 三点リーダーメニュー */}
                <div className="relative">
                  <button onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} className="p-1 text-gray-300 hover:text-gray-600 transition">
                    <MoreHorizontal size={18} />
                  </button>
                  
                  {/* 三点リーダーメニューの中身 */}
                  {openMenuId === post.id && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 shadow-xl rounded-xl z-30 overflow-hidden font-bold">
                      
                      {/* 1. 返信は全員共通 */}
                      <button 
                        onClick={() => { setReplyTarget(post); setOpenMenuId(null); textareaRef.current?.focus(); }}
                        className="w-full px-4 py-2.5 text-left text-[11px] hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                      >
                        <Reply size={14} /> 返信する
                      </button>

                      {/* 2. 通報は「自分以外」の投稿にだけ出す */}
                      {currentUser?.id !== post.user_id && (
                        <button 
                          onClick={() => handleReport(post.id)}
                          className="w-full px-4 py-2.5 text-left text-[11px] hover:bg-red-50 flex items-center gap-2 text-red-500 border-t border-gray-50"
                        >
                          <AlertTriangle size={14} /> 通報する
                        </button>
                      )}

                      {/* 3. 削除ボタン（自分の投稿、または管理権限がある場合） */}
                      {(currentUser?.id === post.user_id || myRole === "admin" || myRole === "moderator") && (
                        <div className="border-t border-gray-100">
                          <button 
                            onClick={() => handleHardDelete(post.id)}
                            className="w-full px-4 py-2.5 text-left text-[11px] hover:bg-red-600 hover:text-white flex items-center gap-2 text-red-600"
                          >
                            <Trash2 size={14} /> {myRole === "student" ? "投稿を削除する" : "強制削除（管理）"}
                          </button>
                        </div>
                      )}

                      {/* 4. 非表示・復活（管理権限がある場合のみ） */}
                      {(myRole === "moderator" || myRole === "admin") && (
                        <button 
                          onClick={() => handleUpdateStatus(post.id, isHidden ? 'published' : 'hidden')} 
                          className="w-full px-4 py-2.5 text-left text-[11px] hover:bg-gray-50 flex items-center gap-2 text-orange-600 border-t border-gray-100"
                        >
                          {isHidden ? <RefreshCcw size={14}/> : <EyeOff size={14}/>} 
                          {isHidden ? "公開に戻す" : "非表示にする"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px] pl-1">
                {isHidden ? (
                  <span className="text-red-500 text-xs font-bold italic">※管理責任により非表示</span>
                ) : (
                  post.content.split(/(>>\d+)/g).map((part: string, i: number) => {
                    if (part.match(/^>>\d+$/)) {
                      const num = part.replace(">>", "");
                      return <span key={i} onClick={() => scrollToPost(parseInt(num))} className="text-blue-600 font-bold cursor-pointer hover:underline">{part}</span>;
                    }
                    return part;
                  })
                )}
              </div>
              <ReactionButtons targetId={post.id} type="answer" />
            </div>
          );
        })}
      </div>

      {/* ★ 固定入力フォーム（返信プレビュー付き） */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t p-4 z-40">
        <div className="max-w-4xl mx-auto">
          {replyTarget && (
                          <div className="flex justify-between items-center bg-blue-50 border-x border-t border-blue-100 px-4 py-2 rounded-t-xl text-[11px]">
                            <div className="flex items-center gap-2 text-blue-600 font-bold">
                              <Reply size={12} />
                              <span>{">>"}
            {replyTarget.post_number} に返信中</span>
                              <span className="text-blue-400 font-normal line-clamp-1 opacity-70"> - {replyTarget.content}</span>
                            </div>
              <button onClick={() => setReplyTarget(null)} className="text-blue-400 hover:text-blue-600"><X size={14} /></button>
            </div>
          )}
          <form onSubmit={handlePost} className="flex gap-3">
            <textarea 
              ref={textareaRef}
              required 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder={replyTarget ? `>>${replyTarget.post_number} への返信を入力...` : "メッセージを入力..."} 
              className={`flex-1 h-20 p-4 bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/50 text-sm resize-none ${replyTarget ? "rounded-b-xl border-t-0" : "rounded-xl"}`} 
            />
            <div className="flex flex-col gap-2">
              <button type="submit" disabled={submitting || !content.trim()} className="h-full px-6 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50">
                {submitting ? "..." : <Send size={20} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}