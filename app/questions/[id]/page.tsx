"use client";

import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Send, User, Lock, Loader2, MoreHorizontal, 
  Reply, AlertTriangle, Copy, X, CornerDownRight 
} from "lucide-react";
import ReactionButtons from "@/components/board/ReactionButtons";
import TagEditor from "@/components/board/TagEditor";
import { sendNotification } from "@/lib/utils/notifications";

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [replyTarget, setReplyTarget] = useState<any>(null); // 返信先
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    const { data: qData } = await supabase.from("questions").select("*, profiles(*)").eq("id", id).single();
    if (qData) setQuestion(qData);

    const { data: aData } = await supabase
      .from("answers")
      .select(`
        *, 
        profiles(nickname, course, settings),
        reply_to:reply_to_id(post_number, content, profiles(nickname))
      `)
      .eq("question_id", id)
      .order("created_at", { ascending: true });

    setAnswers(aData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push("/login"); // ゲストならログインへ
      return;
    }
    if (!newAnswer.trim()) return;

    setSubmitting(true);
    const { data: answerData, error } = await supabase.from("answers").insert({
      question_id: id,
      user_id: currentUser.id,
      content: newAnswer,
      is_anonymous: isAnonymous,
      reply_to_id: replyTarget?.id || null
    }).select().single();

    if (!error) {
      setNewAnswer("");
      setReplyTarget(null);
      fetchData();

      // 通知処理
      if (replyTarget) {
        // 返信相手への通知
        const targetSettings = replyTarget.profiles?.settings?.notifications;
        if (targetSettings?.onReply !== false) {
          await sendNotification(replyTarget.user_id, 'answer', `あなたの回答に返信がつきました`, `/questions/${id}`);
        }
      } else if (question?.user_id) {
        // 質問主への通知
        const ownerSettings = question.profiles?.settings?.notifications;
        if (ownerSettings?.onAnswer !== false) {
          await sendNotification(question.user_id, 'answer', `質問に回答がつきました`, `/questions/${id}`);
        }
      }
    }
    setSubmitting(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("コピーしました");
    setOpenMenuId(null);
  };

  if (loading || !question) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-32">
      <Link href="/" className="flex items-center gap-2 text-gray-500 text-sm"><ArrowLeft size={18} /> 一覧に戻る</Link>

      {/* 質問本文 */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl font-black text-blue-500">Q.</span>
          <div>
            <p className="text-sm font-bold">{question.is_anonymous ? "匿名さん" : question.profiles?.nickname}</p>
            <p className="text-[10px] text-gray-400">{new Date(question.created_at).toLocaleString()}</p>
          </div>
        </div>
        <p className="text-gray-800 text-lg whitespace-pre-wrap mb-4">{question.content}</p>
        <ReactionButtons targetId={question.id} type="question" />
      </section>

      {/* 回答一覧 */}
      <div className="space-y-4">
        {answers.map((ans) => (
          <div key={ans.id} className="bg-gray-50 p-5 rounded-xl border relative group">
            {ans.reply_to && (
              <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2">
                <CornerDownRight size={12} /> ↳ {ans.reply_to.profiles?.nickname || "匿名"}さんの回答へ返信
              </div>
            )}
            <div className="flex justify-between">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-black text-red-400">A.</span>
                <span className="text-xs font-bold text-gray-600">{ans.is_anonymous ? "匿名さん" : ans.profiles?.nickname}</span>
              </div>
              
              {/* 三点リーダー */}
              <div className="relative">
                <button onClick={() => setOpenMenuId(openMenuId === ans.id ? null : ans.id)} className="p-1 text-gray-400"><MoreHorizontal size={18} /></button>
                {openMenuId === ans.id && (
                  <div className="absolute right-0 top-8 w-32 bg-white border shadow-lg rounded-xl z-10 overflow-hidden text-xs font-bold">
                    <button onClick={() => { setReplyTarget(ans); setOpenMenuId(null); textareaRef.current?.focus(); }} className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-2"><Reply size={14}/>返信する</button>
                    <button onClick={() => handleCopy(ans.content)} className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-2"><Copy size={14}/>コピー</button>
                    <button className="w-full p-3 text-left text-red-500 hover:bg-red-50 flex items-center gap-2"><AlertTriangle size={14}/>通報</button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-700">{ans.content}</p>
            <ReactionButtons targetId={ans.id} type="answer" />
          </div>
        ))}
      </div>

      {/* 回答フォーム */}
      <section className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-auto md:w-[768px] mx-auto bg-white p-4 rounded-2xl shadow-xl border-2 border-blue-100 z-30">
        {!currentUser && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
            <button onClick={() => router.push("/login")} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg">ログインして回答する</button>
          </div>
        )}
        <form onSubmit={handlePostAnswer}>
          {replyTarget && (
            <div className="flex justify-between items-center bg-blue-50 p-2 mb-2 rounded-lg text-[11px] text-blue-600 font-bold">
              <span>↳ {replyTarget.is_anonymous ? "匿名" : replyTarget.profiles?.nickname}さんへの返信</span>
              <button onClick={() => setReplyTarget(null)}><X size={14} /></button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            required
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            className="w-full h-20 p-3 bg-gray-50 border rounded-xl mb-3 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={replyTarget ? "返信を入力..." : "回答を入力..."}
          />
          <div className="flex justify-between">
            <button type="button" onClick={() => setIsAnonymous(!isAnonymous)} className="text-xs font-bold flex items-center gap-1 text-gray-500">
              {isAnonymous ? <Lock size={14}/> : <User size={14}/>} {isAnonymous ? "匿名" : "記名"}
            </button>
            <button type="submit" disabled={submitting || !newAnswer.trim()} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2">
              <Send size={16}/> {submitting ? "送信中" : "回答する"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}