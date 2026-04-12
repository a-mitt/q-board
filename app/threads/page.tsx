"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  MessageSquare, Plus, Loader2, Users, Clock, 
  Search, Filter, TrendingUp // ★この3つを忘れず追加！
} from "lucide-react";
import CreateThreadModal from "@/components/board/CreateThreadModal";

export default function ThreadsPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchThreads = async () => {
    setLoading(true);
    // スレッド情報と、作成者のプロフィール、さらに書き込み数（thread_posts）を取得
    const { data, error } = await supabase
      .from("threads")
      .select(`
        *,
        profiles (nickname),
        thread_posts (id)
      `)
      .eq("is_hidden", false) // ★ これを追加
      .order("created_at", { ascending: false });

    if (!error && data) {
      setThreads(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchThreads();
  }, []);

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
      {/* スマホ用検索・フィルタ */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="スレッドを検索..." 
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex-1 py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 flex items-center justify-center gap-1">
            <Filter size={14} /> 最新順
          </button>
          <button className="flex-1 py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 flex items-center justify-center gap-1">
            <TrendingUp size={14} /> 人気順
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {threads.map((thread) => (
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
          {threads.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400 font-bold">
              まだスレッドがありません。最初のスレッドを立ててみましょう！
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