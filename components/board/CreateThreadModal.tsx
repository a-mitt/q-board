"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { X, MessageSquare } from "lucide-react";

type Props = { isOpen: boolean; onClose: () => void; onSuccess: () => void; };

export default function CreateThreadModal({ isOpen, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  
  // ★追加：デフォルト名とテキストエリアのRef
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [defaultNameSuffix, setDefaultNameSuffix] = useState("新入生");

  const [tagInput, setTagInput] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const RECOMMENDED_TAGS = ["雑談", "サークル", "相談", "趣味", "授業"];

  // ★追加：タグ挿入関数
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
        start + openTag.length + selectedText.length,
        start + openTag.length + selectedText.length
      );
    }, 0);
  };

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

    // ★修正：入力されたデフォルト名を結合
    const fullName = "名無しの" + (defaultNameSuffix.trim() || "新入生");

    // 1. スレッド（箱）を作成
    const { data: threadData, error: threadError } = await supabase
      .from("threads")
      .insert({
        creator_id: user.id,
        title: title.trim(),
        content: content.trim(),
        is_hidden: false,
        default_name: fullName // ★保存
      })
      .select()
      .single();

    if (threadError) {
      alert("エラー: " + threadError.message);
      setLoading(false);
      return;
    }

    // 2. 最初の書き込みを保存
    const { error: postError } = await supabase
      .from("thread_posts")
      .insert({
        thread_id: threadData.id,
        user_id: user.id,
        content: content.trim(),
        is_anonymous: true,
        post_number: 1,
      });

    if (postError) {
      alert("最初の書き込みの保存に失敗しました: " + postError.message);
      setLoading(false);
      return;
    }

    // タグの保存処理
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
    setDefaultNameSuffix("新入生");
    setTagList([]);
    onSuccess();
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
          <h2 className="font-black text-gray-800 flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-500" /> 新規スレッド作成
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition text-gray-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
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

          {/* ★追加：デフォルト名（名無し）の設定 */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">デフォルトの呼び名</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-3 rounded-xl border border-gray-200 shrink-0">名無しの</span>
              <input
                maxLength={15}
                value={defaultNameSuffix}
                onChange={(e) => setDefaultNameSuffix(e.target.value)}
                placeholder="新入生"
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm font-bold placeholder-gray-300"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">※このスレッドで書き込む人の基本の名前になります。</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">最初の書き込み（必須）</label>
            
            {/* ★追加：装飾ツールバー */}
            <div className="flex gap-3 px-2 py-1.5 bg-gray-50 rounded-t-xl border border-gray-200 border-b-0 overflow-x-auto items-center">
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
                <button type="button" onClick={() => insertTag("size", "small")} className="px-2 py-1 bg-white border rounded hover:bg-gray-100 shadow-sm">小</button>
                <button type="button" onClick={() => insertTag("size", "large")} className="px-2 py-1 bg-white border rounded hover:bg-gray-100 shadow-sm">大</button>
                <button type="button" onClick={() => insertTag("size", "huge")} className="px-2 py-1 bg-white border rounded hover:bg-gray-100 shadow-sm">特大</button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="スレッドの目的や、最初の話題を書いてください。"
              className="w-full h-32 p-3 border border-gray-200 rounded-b-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm placeholder-gray-300 resize-none"
            />
          </div>

          {/* タグ入力エリア */}
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