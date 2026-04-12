"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, User, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import ReactionButtons from "@/components/board/ReactionButtons";
import TagEditor from "@/components/board/TagEditor";
// ★修正1: 通知関数をしっかりインポート
import { sendNotification } from "@/lib/utils/notifications";

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // データ取得関数
  const fetchData = async () => {
    setLoading(true);
    
    const { data: qData, error: qError } = await supabase
      .from("questions")
      .select(`
        *,
        profiles (
          nickname,
          course
        ),
        question_tags (
          tags (
            id,
            name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (qError) {
      console.error("Supabase Error:", qError.message);
      router.push("/");
      return;
    }
    setQuestion(qData);

    const { data: aData } = await supabase
      .from("answers")
      .select("*, profiles(nickname, course)")
      .eq("question_id", id)
      .order("created_at", { ascending: true });

    setAnswers(aData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // 回答投稿処理
  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("ログインが必要です");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("answers").insert({
      question_id: id,
      user_id: user.id,
      content: newAnswer,
      is_anonymous: isAnonymous,
    });

    if (!error) {
      // ★修正2: setContent ではなく setNewAnswer
      setNewAnswer("");
      fetchData(); // リロードして最新化
      
      // 通知を飛ばす処理
      if (question?.user_id) {
        await sendNotification(
          question.user_id,
          'answer',
          `あなたの質問「${question.title}」に回答がつきました！`,
          `/questions/${id}`
        );
      }
    } else {
      alert("エラー: " + error.message);
    }
    setSubmitting(false);
  }; // ★修正3: ここに「閉じカッコ」が必要でした！！

  // questionがまだ読み込めていない時のエラー回避
  if (loading || !question) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 戻るボタン */}
      <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition text-sm mb-4">
        <ArrowLeft size={18} />
        一覧に戻る
      </Link>

      {/* 質問本文エリア */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl font-black text-blue-500 font-serif">Q.</span>
            <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-800">
                {question.is_anonymous ? "匿名希望さん" : question.profiles?.nickname || "名無しさん"}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
                {!question.is_anonymous && question.profiles?.course && (
                <span className="bg-gray-100 px-1.5 py-0.5 rounded mr-2">{question.profiles.course}</span>
                )}
                {new Date(question.created_at).toLocaleDateString()}
            </span>
            </div>
          </div>
          <TagEditor 
            questionId={question.id} 
            initialTags={question.question_tags} 
            onUpdate={fetchData} 
            />
          <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
            {question.content}
          </p>
          <ReactionButtons targetId={question.id} type="question" />
        </div>
      </section>

      {/* 回答一覧エリア */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
          回答 {answers.length} 件
        </h2>
        
        {answers.map((ans) => (
          <div key={ans.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-black text-red-400 font-serif">A.</span>
              <span className="text-xs font-bold text-gray-600">
                {ans.is_anonymous ? "匿名希望さん" : ans.profiles?.nickname || "名無しさん"}
              </span>
              <span className="text-[10px] text-gray-400">
                {new Date(ans.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{ans.content}</p>
            <ReactionButtons targetId={ans.id} type="answer" />
          </div>
        ))}
      </section>

      {/* 回答投稿フォーム */}
      <section className="bg-white p-6 rounded-2xl shadow-md border-2 border-blue-100">
        <form onSubmit={handlePostAnswer} className="space-y-4">
          <textarea
            required
            placeholder="回答を入力して先輩・後輩を助けよう！"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            className="w-full h-32 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition ${
                isAnonymous ? "bg-gray-100 text-gray-600" : "bg-blue-50 border-blue-200 text-blue-600"
              }`}
            >
              {isAnonymous ? <Lock size={14} /> : <User size={14} />}
              {isAnonymous ? "匿名で回答" : "記名で回答"}
            </button>
            <button
              type="submit"
              disabled={submitting || !newAnswer.trim()}
              className="bg-blue-600 text-white px-8 py-2 rounded-full font-bold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? "送信中..." : <><Send size={18} /> 回答する</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}