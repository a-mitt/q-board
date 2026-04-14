"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Megaphone, ShieldAlert } from "lucide-react"; // アイコンをインポート


type Props = {
  id: string;
  question: string;
  latestAnswer?: string;
  tags: string[];
  isAnonymous?: boolean;
};

export default function QuestionGridItem({ id, question, latestAnswer, tags, isAnonymous }: Props) {
  const [myRole, setMyRole] = useState<string>("student");

  // 1. 自分の権限を確認する
  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (data) setMyRole(data.role);
      }
    };
    getRole();
  }, []);

  // 2. 通報処理
  const handleReport = async (e: React.MouseEvent) => {
    e.preventDefault(); // リンクへの遷移を止める
    const reason = prompt("通報の理由を入力してください（誹謗中傷、不適切な内容など）");
    if (!reason) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("reports").insert({
      reporter_id: user?.id,
      target_id: id,
      target_type: 'question', // 質問への通報
      reason: reason
    });

    if (!error) alert("管理者に通報しました。");
  };

  // 3. Modメニュー（非表示処理）
  const openModMenu = async (e: React.MouseEvent) => {
    e.preventDefault(); // リンクへの遷移を止める
    const firstCheck = confirm(`【管理操作】\nこの質問を非表示にしますか？`);
    if (firstCheck) {
      const secondCheck = confirm("本当によろしいですか？（学生には見えなくなります）");
      if (secondCheck) {
        const { error } = await supabase.from("questions").update({ is_hidden: true }).eq("id", id);
        if (!error) {
          alert("非表示にしました。");
          window.location.reload(); // 反映のためにリロード
        }
      }
    }
  };
  

  return (
    <div className="relative group">
      {/* 管理・通報ボタンエリア（カードの上に重ねる） */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={handleReport}
          className="p-1.5 bg-white/80 backdrop-blur shadow-sm rounded-full text-gray-400 hover:text-red-500 transition"
          title="通報"
        >
          <Megaphone size={14} />
        </button>

        {(myRole === 'admin' || myRole === 'moderator') && (
          <button 
            onClick={openModMenu}
            className="p-1.5 bg-green-500 text-white shadow-sm rounded-full hover:bg-green-600 transition"
            title="管理"
          >
            <ShieldAlert size={14} />
          </button>
        )}
      </div>

      <Link 
        href={`/questions/${id}`} 
        className="block aspect-square rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition flex flex-col overflow-hidden"
      >
        {/* Q (上8割エリア) */}
        <div className="flex-[8] p-4 flex flex-col gap-2 overflow-hidden">
          <span className="text-3xl font-black text-blue-500 font-serif leading-none">Q.</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((tag, i) => (
              <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-bold">
                #{tag}
              </span>
            ))}
          </div>
          <h3 className="text-gray-800 font-bold text-sm sm:text-base line-clamp-5 mt-1 leading-relaxed">
            {question}
          </h3>
        </div>

        <div className="h-[1px] w-full bg-gray-100"></div>

        {/* A (下2割エリア) */}
        <div className="flex-[2] bg-gray-50 px-4 py-2 flex items-center">
          <div className="flex items-center gap-2 overflow-hidden w-full">
            <span className="text-lg font-black text-red-400 font-serif leading-none">A.</span>
            <p className="text-xs text-gray-600 line-clamp-2 flex-1 leading-tight">
              {latestAnswer || "まだ回答はありません"}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}