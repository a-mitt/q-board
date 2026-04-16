"use client";

import { useEffect, useState, useRef, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Send, Lock, User, Trash2, EyeOff, RefreshCcw, 
  MoreHorizontal, Reply, AlertTriangle, CornerDownRight, X, 
  Copy
} from "lucide-react";
import ReactionButtons from "@/components/board/ReactionButtons";
import TagEditor from "@/components/board/TagEditor";
import { sendNotification } from "@/lib/utils/notifications";
import { parseBBCode } from "@/lib/utils/bbcode";

export default function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- 状態管理 ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myRole, setMyRole] = useState<string>("student");
  const [thread, setThread] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  
  const [content, setContent] = useState(""); // レス本文
  const [customName, setCustomName] = useState(""); // 名無し変更用
  const [isAnonymous, setIsAnonymous] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openThreadMenu, setOpenThreadMenu] = useState(false); // ★追加：スレッド本体のメニュー用

  // ★ 装飾タグの挿入
  const insertTag = (tag: string, value: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);
    
    const openTag = `[${tag}=${value}]`;
    const closeTag = `[/${tag}]`;
    
    setContent(before + openTag + selectedText + closeTag + after);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + (selectedText ? openTag.length + selectedText.length + closeTag.length : openTag.length),
        start + (selectedText ? openTag.length + selectedText.length + closeTag.length : openTag.length)
      );
    }, 0);
  };

  // --- ユーティリティ ---
  const generateDailyId = (userId: string, dateString: string) => {
    if (!userId) return "???";
    const str = userId + dateString;
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
    return Math.abs(hash).toString(36).substring(0, 8).toUpperCase();
  };

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

    const { data: tData, error: tError } = await supabase.from("threads").select("*, profiles(nickname, avatar_emoji), thread_tags(user_id, tags(id, name))").eq("id", id).single();
    if (tError) { router.push("/threads"); return; }
    setThread(tData);

    let query = supabase.from("thread_posts").select(`
      *, 
      profiles(nickname, avatar_emoji),
      reply_to:reply_to_id(post_number, content, is_anonymous, is_anonymous, profiles(nickname))
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
  // --- アクション ---
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ★ 修正1：未ログイン状態なら警告を出してログイン画面へ飛ばす
    if (!currentUser) {
      alert("セッションが切れました。再度ログインしてください。");
      router.push("/login");
      return;
    }
    
    if (!content.trim()) return;

    setSubmitting(true);
    const nextPostNumber = posts.length > 0 ? posts[posts.length - 1].post_number + 1 : 1;

    const { data: postData, error } = await supabase.from("thread_posts").insert({
      thread_id: id,
      user_id: currentUser.id,
      post_number: nextPostNumber,
      content: content,
      is_anonymous: isAnonymous,
      custom_name: isAnonymous && customName.trim() ? customName.trim() : null,
      reply_to_id: replyTarget?.id || null
    }).select().single();

    // ★ 修正2：エラーがあればアラートを出すように変更（原因がわかるようにする）
    if (error) {
      alert("投稿に失敗しました。\n理由: " + error.message);
    } else { 
      setContent(""); 
      setReplyTarget(null);
      fetchThreadData();

      if (thread?.creator_id) {
        await sendNotification(
          thread.creator_id,
          'answer',
          `スレ「${thread.title}」にレスがありました（>>${nextPostNumber}）`,
          `/threads/${id}#post-${nextPostNumber}`
        );
      }
    }
    setSubmitting(false);
  };

  const handleUpdateStatus = async (postId: string, newStatus: string) => {
    if (!confirm(`この投稿を${newStatus === "hidden" ? "非表示" : "公開"}にしますか？`)) return;
    const { error } = await supabase.from("thread_posts").update({ status: newStatus }).eq("id", postId);
    if (!error) fetchThreadData();
    setOpenMenuId(null);
  };

  const handleHardDelete = async (postId: string) => {
    if (!confirm("完全に削除しますか？（元に戻せません）")) return;
    const { error } = await supabase.from("thread_posts").delete().eq("id", postId);
    if (error) {
      alert("削除できませんでした。\n理由: " + error.message);
    } else {
      setOpenMenuId(null);
      fetchThreadData();
    }
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("コピーしました");
    setOpenMenuId(null);
  };

  // ★ 追加：スレッドの通報処理
  const handleReportThread = async () => {
    const reason = prompt("このスレッドを通報する理由を入力してください：");
    if (!reason) return;
    await supabase.from("reports").insert({
      reporter_id: currentUser?.id,
      target_type: 'thread',
      target_id: thread.id,
      reason: reason
    });
    alert("通レッドを通報しました。");
    setOpenThreadMenu(false);
  };

  // ★ 追加：スレッドの削除処理（スレ主・管理者用）
  const handleDeleteThread = async () => {
    if (!confirm("このスレッドを完全に削除しますか？\n（書き込まれたレスもすべて消去され、元に戻せません）")) return;
    
    // スレッドに紐づくタグとレスを先に削除（外部キー制約エラー回避のため）
    await supabase.from("thread_tags").delete().eq("thread_id", thread.id);
    await supabase.from("thread_posts").delete().eq("thread_id", thread.id);
    
    const { error } = await supabase.from("threads").delete().eq("id", thread.id);
    
    if (error) {
      alert("削除できませんでした。\n理由: " + error.message);
    } else {
      alert("スレッドを削除しました。");
      router.push("/threads");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-64">
      <Link href="/threads" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition text-sm font-bold">
        <ArrowLeft size={18} /> スレッド一覧へ
      </Link>

      {/* ★ 修正：タイトル部分にメニューを追加 */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">{thread?.title}</h1>
          
          <div className="relative shrink-0">
            <button onClick={() => setOpenThreadMenu(!openThreadMenu)} className="p-2 text-gray-400 hover:text-gray-600 transition rounded-full hover:bg-gray-50">
              <MoreHorizontal size={24} />
            </button>
            
            {openThreadMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden font-bold">
                {/* 自分が立てたスレでなければ通報を出せる */}
                {currentUser?.id !== thread?.creator_id && (
                  <button 
                    onClick={handleReportThread}
                    className="w-full px-4 py-3 text-left text-xs hover:bg-red-50 flex items-center gap-2 text-red-500"
                  >
                    <AlertTriangle size={14} /> スレッドを通報する
                  </button>
                )}
                
                {/* スレ主 または 管理者の場合は削除できる */}
                {(currentUser?.id === thread?.creator_id || myRole === "admin" || myRole === "moderator") && (
                  <button 
                    onClick={handleDeleteThread}
                    className="w-full px-4 py-3 text-left text-xs hover:bg-red-600 hover:text-white flex items-center gap-2 text-red-600 border-t border-gray-50 transition-colors"
                  >
                    <Trash2 size={14} /> スレッドを削除する
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {thread && (
          <div className="mt-4">
            <TagEditor 
              targetId={thread.id} 
              targetType="thread" 
              initialTags={thread.thread_tags || []} 
              onUpdate={fetchThreadData} 
              currentUser={currentUser} 
              myRole={myRole} 
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {posts.map((post) => {
          const dateStr = new Date(post.created_at).toISOString().split('T')[0];
          const dailyId = generateDailyId(post.user_id, dateStr);
          const name = post.custom_name || (post.is_anonymous ? (thread?.default_name || "名無しの新入生") : post.profiles?.nickname || "名無しさん");
          const isHidden = post.status === "hidden";

          return (
            <div key={post.id} id={`post-${post.post_number}`} className={`p-6 relative group transition-colors duration-500 ${isHidden ? 'bg-gray-50 opacity-60' : ''}`}>
              
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

                <div className="relative">
                  <button onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} className="p-1 text-gray-300 hover:text-gray-600 transition">
                    <MoreHorizontal size={18} />
                  </button>
                  
                  {openMenuId === post.id && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden font-bold">
                      <button 
                        onClick={() => { setReplyTarget(post); setOpenMenuId(null); textareaRef.current?.focus(); }}
                        className="w-full px-4 py-2.5 text-left text-[11px] hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                      >
                        <Reply size={14} /> 返信する
                      </button>
                      <button onClick={() => handleCopy(post.content)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-600 text-[11px]"><Copy size={14}/>コピー</button>
                      {currentUser?.id !== post.user_id && (
                        <button 
                          onClick={() => handleReport(post.id)}
                          className="w-full px-4 py-2.5 text-left text-[11px] hover:bg-red-50 flex items-center gap-2 text-red-500 border-t border-gray-50"
                        >
                          <AlertTriangle size={14} /> 通報する
                        </button>
                      )}
                      {(currentUser?.id === post.user_id || myRole === "admin" || myRole === "moderator") && (
                        <div className="border-t border-gray-100">
                          <button 
                            onClick={() => handleHardDelete(post.id)}
                            className="w-full px-4 py-2.5 text-left text-[11px] hover:bg-red-600 hover:text-white flex items-center gap-2 text-red-600"
                          >
                            <Trash2 size={14} /> 削除する
                          </button>
                        </div>
                      )}
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

              <div className="text-gray-900 leading-relaxed break-words text-[15px] pl-1">
                {isHidden ? (
                  <span className="text-red-500 text-xs font-bold italic">※管理責任により非表示</span>
                ) : (
                  // ★ ここでBBCodeのパーサーを通す
                  <div dangerouslySetInnerHTML={{ 
                    __html: parseBBCode(post.content).replace(/(>>\d+)/g, '<span class="text-blue-600 font-bold hover:underline cursor-pointer">$1</span>') 
                  }} />
                )}
              </div>
              <ReactionButtons targetId={post.id} type="thread_post" />
            </div>
          );
        })}
      </div>

      {/* ★ 固定入力フォーム */}
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

          <form onSubmit={handlePost} className="flex flex-col gap-2">
            
            {/* ★ 装飾ツールバー */}
            <div className="flex gap-3 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto items-center">
              <div className="flex gap-2 border-r border-gray-300 pr-3 shrink-0">
                {[
                  { name: "blue", bg: "bg-blue-500" },
                  { name: "red", bg: "bg-red-500" },
                  { name: "green", bg: "bg-green-500" },
                  { name: "yellow", bg: "bg-yellow-500" },
                  { name: "orange", bg: "bg-orange-500" },
                  { name: "purple", bg: "bg-purple-500" }
                ].map(c => (
                  <button 
                    key={c.name} type="button" onClick={() => insertTag("color", c.name)} 
                    className={`w-5 h-5 rounded-full border border-gray-300 shadow-sm ${c.bg}`} 
                  />
                ))}
              </div>
              <div className="flex gap-1 text-[10px] font-bold text-gray-600 shrink-0">
                <button type="button" onClick={() => insertTag("size", "small")} className="px-2 py-1 bg-white border rounded hover:bg-gray-100">小</button>
                <button type="button" onClick={() => insertTag("size", "large")} className="px-2 py-1 bg-white border rounded hover:bg-gray-100">大</button>
                <button type="button" onClick={() => insertTag("size", "huge")} className="px-2 py-1 bg-white border rounded hover:bg-gray-100">特大</button>
              </div>
            </div>

            <div className="flex gap-3">
              <textarea 
                ref={textareaRef}
                required 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder={replyTarget ? `>>${replyTarget.post_number} への返信を入力...` : "メッセージを入力... ([color=red]赤[/color] などが使えます)"} 
                className={`flex-1 h-20 p-3 bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/50 text-sm resize-none text-gray-900 placeholder-gray-400 ${replyTarget ? "rounded-b-xl border-t-0" : "rounded-xl"}`} 
              />
              <div className="flex flex-col gap-2 shrink-0">
                <button type="submit" disabled={submitting || !content.trim()} className="h-full px-6 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50">
                  {submitting ? "..." : <Send size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setIsAnonymous(!isAnonymous)} className="text-[11px] font-bold flex items-center gap-1 text-gray-500 hover:bg-gray-50 px-2 py-1 rounded transition">
                {isAnonymous ? <Lock size={12}/> : <User size={12}/>} {isAnonymous ? "匿名" : "記名"}
              </button>
              {isAnonymous && (
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="名無しさん（変更可）"
                  maxLength={15}
                  className="w-32 text-[11px] p-1.5 border border-gray-200 rounded outline-none focus:border-blue-500 font-bold text-gray-600 bg-gray-50"
                />
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}