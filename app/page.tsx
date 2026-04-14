"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import QuestionGridItem from "@/components/board/QuestionGridItem";
import PostModal from "@/components/board/PostModal";
import { Pencil, Loader2 } from "lucide-react";
import TutorialModal from "@/components/board/TutorialModal";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [questions, setQuestions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // ★追加

  // 未登録ユーザーを弾く ＆ チュートリアル表示判定
  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // 未ログインは一旦そのまま

      // チュートリアル判定
      const hasSeenTutorial = localStorage.getItem("tutorial_seen");
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }

      // プロフィール確認
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/setup");
      }
    };
    checkProfile();
  }, [router]);

  const closeTutorial = () => {
    localStorage.setItem("tutorial_seen", "true");
    setShowTutorial(false);
  };

  // データを取得する関数
  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("questions")
      .select(`
        id, content, created_at, is_anonymous,
        answers(content, created_at),
        question_tags(tags(name))
      `)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching questions:", error);
    } else {
      const formattedData = data.map((q: any) => ({
        ...q,
        latestAnswer: q.answers.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]?.content
      }));
      setQuestions(formattedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // ★追加：検索キーワードで質問を絞り込む
  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery) return true;
    const matchContent = q.content.includes(searchQuery);
    const matchTag = q.question_tags?.some((qt: any) => qt.tags?.name?.includes(searchQuery.replace(/[#＃]/g, "")));
    return matchContent || matchTag;
  });

  return (
    <div className="space-y-8 relative">
      <section className="bg-white px-6 py-10 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center">
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight mb-4">
          右下のボタンから質問してみよう！
        </h1>
        <p className="text-xs md:text-sm text-red-500 font-bold bg-red-50 px-4 py-2 rounded-full mb-6">
          ※快適な使用のため、悪口、誹謗中傷、卑猥な言葉などはやめよう :)
        </p>
        <div className="space-y-3">
          <p className="text-base md:text-lg text-gray-700 font-medium">
            先生は見てないから自由に質問してOK！<br className="md:hidden" />匿名でも質問できるよ！
          </p>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed max-w-2xl mx-auto">
            例：「授業の内容がわからない」「サークルに入るか迷ってる」<br className="hidden md:block" />「学食のおすすめは？」「テスト対策を教えて！」など
          </p>
        </div>
      </section>

      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-700">最新の質問</h2>
          
          {/* ★追加：検索窓 */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="質問やタグを検索..." 
              className="w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <button onClick={fetchQuestions} className="text-sm text-blue-600 hover:underline shrink-0 font-bold">
              更新する
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* ★ questions ではなく filteredQuestions をマップする */}
            {filteredQuestions.map((q) => (
              <QuestionGridItem
                key={q.id}
                id={q.id}
                question={q.content}
                latestAnswer={q.latestAnswer}
                tags={q.question_tags?.map((qt: any) => qt.tags?.name).filter(Boolean) || []} // ★タグを渡すように修正
              />
            ))}
          </div>
        )}

        {/* ★ 検索結果がゼロの時のメッセージ */}
        {!loading && filteredQuestions.length === 0 && (
          <p className="text-center text-gray-400 py-20 font-bold">
            {searchQuery ? "見つかりませんでした。別のキーワードを試してください。" : "まだ質問がありません。最初の質問を投稿しよう！"}
          </p>
        )}
      </section>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 h-16 w-16 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 transition-all flex items-center justify-center z-40"
      >
        <Pencil size={24} />
      </button>
      
      <PostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchQuestions} 
      />
      <TutorialModal 
        isOpen={showTutorial} 
        onClose={closeTutorial} 
      />
    </div>
  );
}