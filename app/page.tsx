"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import QuestionGridItem from "@/components/board/QuestionGridItem";
import PostModal from "@/components/board/PostModal";
import { Pencil, Loader2 } from "lucide-react";

// ① システムの裏側(node_modules)からツールを引っ張ってくる
import { useRouter } from "next/navigation";

export default function Home() {
  // ② 引っ張ってきたツールを「router」として使うよ、と宣言する（★ここが抜けていたのがエラーの原因です！）
  const router = useRouter();

  const [questions, setQuestions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 未登録ユーザーを弾く処理
  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // 未ログインは一旦そのまま

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        // ③ ここで router を使って画面移動する
        router.push("/setup");
      }
    };
    checkProfile();
  }, [router]); // ← ②がないと、ここで「routerって何？」と怒られる

// ... (この下は fetchQuestions など、元のコードが続きます)

  // データを取得する関数
  const fetchQuestions = async () => {
    setLoading(true);
    // 質問一覧と、各質問に紐づく最新の回答を1件だけ取得
    const { data, error } = await supabase
      .from("questions")
      .select(`
        id, content, created_at, is_anonymous,
        answers(content, created_at),
        question_tags(tags(name))
      `)
      .eq("is_hidden", false) // ★ これを追加
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching questions:", error);
    } else {
      // 各質問に対して、回答を最新順にソートして1つだけ残す処理
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

  return (
    <div className="space-y-8 relative">
      {/* 案内メッセージエリア */}
      <section className="bg-white px-6 py-10 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center">
        {/* メインタイトル */}
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight mb-4">
          右下のボタンから質問してみよう！
        </h1>
        
        {/* 注意書き（少し控えめに） */}
        <p className="text-xs md:text-sm text-red-500 font-bold bg-red-50 px-4 py-2 rounded-full mb-6">
          ※快適な使用のため、悪口、誹謗中傷、卑猥な言葉などはやめよう :)
        </p>
        
        {/* サブメッセージ（少し大きめ＆行間広め） */}
        <div className="space-y-3">
          <p className="text-base md:text-lg text-gray-700 font-medium">
            先生は見てないから自由に質問してOK！<br className="md:hidden" />匿名でも質問できるよ！
          </p>
          
          {/* 例文（薄く、小さく） */}
          <p className="text-xs text-gray-400 mt-4 leading-relaxed max-w-2xl mx-auto">
            例：「授業の内容がわからない」「サークルに入るか迷ってる」<br className="hidden md:block" />「学食のおすすめは？」「テスト対策を教えて！」など
          </p>
        </div>
      </section>

      {/* 質問グリッド表示エリア */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-700">最新の質問</h2>
          <button 
            onClick={fetchQuestions} 
            className="text-sm text-blue-600 hover:underline"
          >
            更新する
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {questions.map((q) => (
              <QuestionGridItem
                key={q.id}
                id={q.id}
                question={q.content}
                latestAnswer={q.latestAnswer}
                tags={[]} // タグ機能は後ほど実装
              />
            ))}
          </div>
        )}

        {!loading && questions.length === 0 && (
          <p className="text-center text-gray-400 py-20">まだ質問がありません。最初の質問を投稿しよう！</p>
        )}
      </section>

      {/* 投稿用ボタン (FAB) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        // ★修正: bottom-20 md:bottom-6 に変更（スマホの時は少し上に浮かす）
        className="fixed bottom-20 md:bottom-6 right-6 h-16 w-16 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 transition-all flex items-center justify-center z-40"
      >
        <Pencil size={24} />
      </button>
      
      {/* 質問投稿モーダル */}
      <PostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchQuestions} // 投稿成功時に再読み込み
      />
    </div>
  );
}