"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, MessageSquare } from "lucide-react";


type Props = { isOpen: boolean; onClose: () => void; onSuccess: () => void; };

export default function CreateThreadModal({ isOpen, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  // ★追加：タグ用のStateと関数
  const [tagInput, setTagInput] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const RECOMMENDED_TAGS = ["雑談", "サークル", "相談", "趣味", "授業"];

  const addTag = () => {
    const trimmed = tagInput.trim().replace(/[#＃]/g, "");
    if (trimmed && !tagList.includes(trimmed)) {
      setTagList([...tagList, trimmed]);
      setTagInput("");
    }
  };
  const removeTag = (index: number) => setTagList(tagList.filter((_, i) => i !== index));
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(); }
  };

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
        is_hidden: false,
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

    // ★追加：タグの保存処理
    for (const name of tagList) {
      const { data: tData } = await supabase.from("tags").upsert({ name }, { onConflict: "name" }).select().single();
      if (tData) {
        await supabase.from("thread_tags").insert({ 
          thread_id: threadData.id, 
          tag_id: tData.id,
          user_id: user.id 
        });
      }
    }
    
    setTitle("");
    setContent("");
    setTagList([]);
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

          {/* ★追加：タグ入力エリア */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 mb-1">タグ（任意）</label>
            <div className="flex flex-wrap gap-2">
              {tagList.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                  #{tag}
                  <button type="button" onClick={() => removeTag(i)} className="hover:text-red-500"><X size={14} /></button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] text-gray-400 font-bold">おすすめ:</span>
              {RECOMMENDED_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => { if (!tagList.includes(tag)) setTagList([...tagList, tag]); }}
                  className="text-[10px] bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 px-2 py-1 rounded border border-gray-100 transition font-bold"
                >
                  +{tag}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="タグ名を入力してEnter"
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm placeholder-gray-300"
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