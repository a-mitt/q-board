"use client";

import { useState, KeyboardEvent } from "react";
import { supabase } from "@/lib/supabase";
import { X, Lock, Globe, Tag as TagIcon ,Check} from "lucide-react";

type Props = { isOpen: boolean; onClose: () => void; onSuccess: () => void; };

// --- ★修正：コンポーネントの外に定義 ---
const RECOMMENDED_TAGS = ["履修", "単位", "学食", "サークル", "テスト", "バイト"];

export default function PostModal({ isOpen, onClose, onSuccess }: Props) {
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tagList, setTagList] = useState<string[]>([]); // タグを配列で管理
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showGrade, setShowGrade] = useState(true);

  if (!isOpen) return null;

  // タグを追加する関数
  const addTag = () => {
    const trimmed = tagInput.trim().replace(/[#]/g, ""); // #は自動除去
    if (trimmed && !tagList.includes(trimmed)) {
      setTagList([...tagList, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setTagList(tagList.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインしてください");
      setLoading(false); // ★ここを追加！ アラートを出した後にロード状態をOFFに戻す！
      return;
    }

    // 1. 質問を保存
    const { data: qData, error: qError } = await supabase
    .from("questions")
    .insert({ 
      user_id: user.id, 
      title: content.slice(0, 20), 
      content, 
      is_anonymous: isAnonymous,
      show_grade: showGrade, // ★追加
      is_hidden: false 
    })
    .select().single();

    if (qError) {
      alert(qError.message);
      setLoading(false);
      return;
    }

    // 2. タグを保存
    for (const name of tagList) {
      const { data: tData } = await supabase.from("tags").upsert({ name }, { onConflict: "name" }).select().single();
      if (tData) await supabase.from("question_tags").insert({ question_id: qData.id, tag_id: tData.id });
    }

    setContent("");
    setTagList([]);
    onSuccess();
    onClose();
    setLoading(false);
  };
  {/* よく使われるタグの定義（コンポーネントの外か中でOK） */}
    const RECOMMENDED_TAGS = ["授業", "履修", "単位", "学食", "サークル", "テスト", "バイト"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-gray-800">質問を投稿</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
            {/* text-gray-500 を text-gray-800 に変更 */}
            <X size={20} className="text-gray-800" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="質問内容..."
            className="w-full h-40 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
          />
          {/* タグ入力エリア */}
          <div className="space-y-2">
            {/* 1. 選択済みのタグ */}
            <div className="flex flex-wrap gap-2">
              {tagList.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                  #{tag}
                  <button type="button" onClick={() => removeTag(i)} className="hover:text-red-500"><X size={14} /></button>
                </span>
              ))}
            </div>

            {/* 2. ★修正：おすすめタグを独立させて上に配置 */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] text-gray-400 font-bold">おすすめ:</span>
              {RECOMMENDED_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (!tagList.includes(tag)) setTagList([...tagList, tag]);
                  }}
                  className="text-[10px] bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 px-2 py-1 rounded border border-gray-100 transition font-bold"
                >
                  +{tag}
                </button>
              ))}
            </div>

            {/* 3. ★修正：入力欄とアイコンだけのグループにする */}
            <div className="relative">
              <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="タグを入力してEnter（例：履修）"
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button 
              type="button" 
              onClick={() => setIsAnonymous(!isAnonymous)} 
              className="flex items-center gap-2 text-sm text-gray-700 font-bold"
            >
              {isAnonymous ? <Lock size={16} /> : <Globe size={16} />}
              {isAnonymous ? "匿名で投稿" : "記名で投稿"}
            </button>
            <div className="flex gap-4 items-center">
            <button type="button" onClick={() => setIsAnonymous(!isAnonymous)} className="...">
              {isAnonymous ? <Lock size={16} /> : <Globe size={16} />}
              {isAnonymous ? "匿名投稿" : "記名投稿"}
            </button>
            {/* ★ 学年表示スイッチを追加 */}
              <button 
                type="button" 
                onClick={() => setShowGrade(!showGrade)} 
                className={`flex items-center gap-2 text-sm font-bold transition ${showGrade ? "text-blue-600" : "text-gray-400"}`}
              >
                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${showGrade ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                  {showGrade && <Check size={12} className="text-white" />}
                </div>
                学年を表示
              </button>
            </div>
            <button disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold">
              {loading ? "投稿中..." : "質問する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}