"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, MessageSquare } from "lucide-react";

type Props = { isOpen: boolean; onClose: () => void; onSuccess: () => void; };

export default function CreateThreadModal({ isOpen, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインしてください");
      setLoading(false);
      return;
    }

    // 1. スレッド（箱）を作成し、作られた箱のID（threadData）を受け取る
    const { data: threadData, error: threadError } = await supabase
      .from("threads")
      .insert({
        creator_id: user.id,
        title: title.trim(),
        content: content.trim(),
      })
      .select()
      .single();

    if (threadError) {
      alert("エラー: " + threadError.message);
      setLoading(false);
      return;
    }

    // 2. ★修正：post_number: 1（レス番） を追加して確実に保存する！
    const { error: postError } = await supabase
      .from("thread_posts")
      .insert({
        thread_id: threadData.id,
        user_id: user.id,
        content: content.trim(),
        is_anonymous: true,
        post_number: 1, // ← ★ココを追加！最初の書き込みなので「1」番を指定します
      });

    if (postError) {
      alert("最初の書き込みの保存に失敗しました: " + postError.message);
      setLoading(false);
      return;
    }
    
    setTitle("");
    setContent("");
    onSuccess();
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-black text-gray-800 flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-500" /> 新規スレッド作成
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition text-gray-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">スレッドのタイトル（必須）</label>
            <input
              required
              maxLength={50}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：おすすめの学食メニュー語ろう！"
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm font-bold placeholder-gray-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">最初の書き込み（必須）</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="スレッドの目的や、最初の話題を書いてください。"
              className="w-full h-32 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm placeholder-gray-300"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button 
              disabled={loading || !title.trim() || !content.trim()} 
              className="bg-blue-600 text-white px-8 py-2.5 rounded-full font-bold shadow-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "作成中..." : "スレッドを立てる"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}