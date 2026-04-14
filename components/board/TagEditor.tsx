"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X } from "lucide-react";

type Props = {
  targetId: string;
  targetType: "question" | "thread";
  initialTags: any[];
  onUpdate: () => void;
  currentUser: any;
  myRole: string;
};

export default function TagEditor({ targetId, targetType, initialTags, onUpdate, currentUser, myRole }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim() && currentUser) {
      const tagName = newTag.trim().replace(/[#＃]/g, ""); // #を自動除去
      
      // 1. タグ自体を登録（既にあれば取得）
      const { data: tData } = await supabase.from("tags").upsert({ name: tagName }, { onConflict: "name" }).select().single();
      
      if (tData) {
        // 2. 中間テーブルに紐付け（user_idも記録）
        const tableName = targetType === "question" ? "question_tags" : "thread_tags";
        const columnName = targetType === "question" ? "question_id" : "thread_id";
        
        await supabase.from(tableName).insert({ 
          [columnName]: targetId, 
          tag_id: tData.id,
          user_id: currentUser.id 
        });
      }
      setNewTag("");
      setIsAdding(false);
      onUpdate();
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!confirm("このタグを削除しますか？")) return;
    
    const tableName = targetType === "question" ? "question_tags" : "thread_tags";
    const columnName = targetType === "question" ? "question_id" : "thread_id";
    
    await supabase.from(tableName).delete().match({ 
      [columnName]: targetId, 
      tag_id: tagId 
    });
    onUpdate();
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      {initialTags?.map((qt: any, i: number) => {
        if (!qt.tags?.name) return null;
        
        // 削除できる条件：自分が追加したタグ or 管理者/モデレーター
        const canDelete = currentUser?.id === qt.user_id || myRole === "admin" || myRole === "moderator";
        
        return (
          <span key={i} className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold border border-blue-100">
            #{qt.tags.name}
            {canDelete && (
              <button onClick={() => handleRemoveTag(qt.tags.id)} className="hover:text-red-500 text-blue-300 ml-0.5 transition-colors">
                <X size={12} />
              </button>
            )}
          </span>
        );
      })}
      
      {isAdding ? (
        <input
          autoFocus
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleAddTag}
          onBlur={() => setIsAdding(false)}
          placeholder="タグ名 + Enter"
          className="text-[10px] border-2 border-blue-300 rounded-md px-2 py-1 outline-none text-gray-800 w-28 font-bold"
        />
      ) : (
        <button 
          onClick={() => setIsAdding(true)}
          className="text-[10px] border border-dashed border-gray-300 text-gray-400 px-2 py-1 rounded-md hover:border-blue-400 hover:text-blue-500 transition flex items-center gap-1 font-bold"
        >
          <Plus size={12} /> タグ追加
        </button>
      )}
    </div>
  );
}