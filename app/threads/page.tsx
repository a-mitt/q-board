"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  MessageSquare, Plus, Loader2, Users, Clock, 
  Search, Filter, TrendingUp 
} from "lucide-react";
import CreateThreadModal from "@/components/board/CreateThreadModal";

export default function ThreadsPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ★ 新規追加：検索キーワードとソート順のState
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "popular">("latest");

  const fetchThreads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("threads")
      .select(`
        *,
        profiles (nickname),
        thread_posts (id)
      `)
      .or('is_hidden.eq.false,is_hidden.is.null') // 非表示設定の対応
      .order("created_at", { ascending: false });

    if (!error && data) {
      setThreads(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  // ★ 新規追加：取得したスレッドを「検索」と「ソート」で絞り込む処理
  const filteredThreads = threads
    .filter((t) => 
      // タイトルか本文に検索キーワードが含まれているかチェック
      t.title.includes(searchQuery) || (t.content && t.content.includes(searchQuery))
    )
    .sort((a, b) => {
      // ソート処理
      if (sortOrder === "latest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        // 人気順（レス数が多い順）
        const aCount = a.thread_posts?.length || 0;
        const bCount = b.thread_posts?.length || 0;
        return bCount - aCount;
      }
    });

  return (
    <div className="space-y-6 relative pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-md text-white">
        <h1 className="text-2xl font-black mb-2 flex items-center gap-2">
          <MessageSquare size={24} /> 交流スレッド
        </h1>
        <p className="text-blue-100 text-sm font-medium">
          サークル募集、趣味の話、授業の愚痴など、自由に語り合う場所です！
        </p>
      </div>

      {/* 検索・フィルタエリア */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // ★ 入力をStateに反映
            placeholder="スレッドを検索..." 
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
        <div className="flex gap-2">
          {/* ★ 最新順ボタン */}
          <button 
            onClick={() => setSortOrder("latest")}
            className={`flex-1 py-2 px-3 border rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${sortOrder === "latest" ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-gray-200 text-gray-600"}`}
          >
            <Filter size={14} /> 最新順
          </button>
          {/* ★ 人気順ボタン */}
          <button 
            onClick={() => setSortOrder("popular")}
            className={`flex-1 py-2 px-3 border rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${sortOrder === "popular" ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-gray-200 text-gray-600"}`}
          >
            <TrendingUp size={14} /> 人気順
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* ★ threads.map ではなく filteredThreads.map に変更 */}
          {filteredThreads.map((thread) => (
            <Link 
              key={thread.id} 
              href={`/threads/${thread.id}`}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group block"
            >
              <h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                {thread.title}
              </h2>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {thread.content}
              </p>
              
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                    <Users size={12} /> {thread.profiles?.nickname || "名無しさん"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} /> {thread.thread_posts?.length || 0} レス
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {new Date(thread.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
          {/* ★ 検索結果がゼロの時のメッセージ */}
          {filteredThreads.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400 font-bold">
              見つかりませんでした。別のキーワードで検索してみてください。
            </div>
          )}
        </div>
      )}

      {/* スレッド作成ボタン (FAB) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 h-16 w-16 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center z-40"
      >
        <Plus size={28} />
      </button>

      <CreateThreadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchThreads} 
      />
    </div>
  );
}