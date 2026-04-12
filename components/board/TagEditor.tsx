"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X } from "lucide-react";

type Props = {
  questionId: string;
  initialTags: any[];
  onUpdate: () => void;
};

export default function TagEditor({ questionId, initialTags, onUpdate }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      // 1. タグ自体を登録（既にあれば取得）
      const { data: tData } = await supabase.from("tags").upsert({ name: newTag.trim() }, { onConflict: "name" }).select().single();
      if (tData) {
        // 2. 中間テーブルに紐付け
        await supabase.from("question_tags").insert({ question_id: questionId, tag_id: tData.id });
      }
      setNewTag("");
      setIsAdding(false);
      onUpdate();
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      {initialTags?.map((qt: any) => (
        <span key={qt.tags.id} className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
          #{qt.tags.name}
        </span>
      ))}
      
      {isAdding ? (
        <input
          autoFocus
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleAddTag}
          onBlur={() => setIsAdding(false)}
          placeholder="タグを入力..."
          className="text-xs border border-blue-300 rounded-full px-2 py-1 outline-none text-gray-800"
        />
      ) : (
        <button 
          onClick={() => setIsAdding(true)}
          className="text-xs border border-dashed border-gray-300 text-gray-400 px-2 py-1 rounded-full hover:border-blue-400 hover:text-blue-500 transition flex items-center gap-1"
        >
          <Plus size={12} /> タグを追加
        </button>
      )}
    </div>
  );
}