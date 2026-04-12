"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { sendNotification } from "@/lib/utils/notifications";
import {
  ThumbsUp, Heart, Sparkles, Smile,
  Frown, PartyPopper, Flame, Zap, Ghost,
  SmilePlus
} from "lucide-react";

type Props = {
  targetId: string;
  type: "question" | "answer" | "thread_post";
};

// ★ ここで使いたいLucideアイコンとIDを定義します
const ALL_REACTIONS = [
  { id: "thumbs_up", Icon: ThumbsUp, label: "いいね" },
  { id: "thanks", Icon: Heart, label: "感謝" },
  { id: "clap", Icon: Sparkles, label: "拍手" },
  { id: "smile", Icon: Smile, label: "スマイル" },
  { id: "sad", Icon: Frown, label: "悲しい" },
  { id: "wow", Icon: PartyPopper, label: "おお〜" },
  { id: "angry", Icon: Flame, label: "怒り" },
  { id: "surprise", Icon: Zap, label: "びっくり" },
  { id: "scary", Icon: Ghost, label: "怖い" },
];

// 常に表に出しておくメインの4つのID
const PRIMARY_IDS = ["thumbs_up", "thanks", "clap", "smile"];

export default function ReactionButtons({ targetId, type }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myReactions, setMyReactions] = useState<string[]>([]);
  
  // ポップアップの開閉状態と、外側クリック検知用
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // ポップアップの外側をクリックしたら閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchReactions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const column = type === "question" ? "question_id" : type === "answer" ? "answer_id" : "thread_post_id";

      const { data, error } = await supabase
        .from("reactions")
        .select("*")
        .eq(column, targetId);

      if (error || !data) return;

      const newCounts: Record<string, number> = {};
      const mine: string[] = [];

      data.forEach((r: any) => {
        // DBの emoji カラムには今後 "thumbs_up" などのIDが保存されます
        newCounts[r.emoji] = (newCounts[r.emoji] || 0) + 1;
        if (user && r.user_id === user.id) mine.push(r.emoji);
      });

      setCounts(newCounts);
      setMyReactions(mine);
    };

    fetchReactions();
  }, [targetId, type]);

  const handleReact = async (reactionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインが必要です");
      return;
    }

    const column = type === "question" ? "question_id" : type === "answer" ? "answer_id" : "thread_post_id";
    const isMine = myReactions.includes(reactionId);

    // 画面を先に更新してサクサク感を出す
    setCounts(prev => ({ ...prev, [reactionId]: (prev[reactionId] || 0) + (isMine ? -1 : 1) }));
    setMyReactions(prev => isMine ? prev.filter(e => e !== reactionId) : [...prev, reactionId]);
    
    // リアクションしたらポップアップを閉じる
    setIsPopoverOpen(false);

    if (isMine) {
      // 取り消し
      await supabase.from("reactions").delete().match({ [column]: targetId, user_id: user.id, emoji: reactionId });
    } else {
      // 追加
      await supabase.from("reactions").insert({ [column]: targetId, user_id: user.id, emoji: reactionId });

      // 通知を飛ばす
      let tableName = type === "question" ? "questions" : type === "answer" ? "answers" : "thread_posts";
      const { data: targetData } = await supabase.from(tableName).select("user_id").eq("id", targetId).single();

      if (targetData?.user_id) {
        const reactionObj = ALL_REACTIONS.find(r => r.id === reactionId);
        await sendNotification(
          targetData.user_id,
          "reaction",
          `あなたの投稿に「${reactionObj?.label || 'リアクション'}」がつきました`,
          "#"
        );
      }
    }
  };

  // ★Slack方式: 基本の4つ ＋ 誰かがすでに押しているリアクションだけを画面に並べる
  const activeReactionIds = Object.keys(counts).filter(id => counts[id] > 0);
  const visibleIds = Array.from(new Set([...PRIMARY_IDS, ...activeReactionIds]));
  const visibleReactions = ALL_REACTIONS.filter(r => visibleIds.includes(r.id));

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-4 relative" ref={popoverRef}>
      
      {/* 画面に出ているボタン群 */}
      {visibleReactions.map(({ id, Icon }) => {
        const isMine = myReactions.includes(id);
        const count = counts[id] || 0;
        return (
          <button
            key={id}
            onClick={() => handleReact(id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-all duration-200
              ${isMine
                ? "bg-blue-50 border-blue-300 text-blue-600 shadow-sm" // 自分が押した時の色
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100" // 通常時
              }`}
          >
            {/* 自分が押したものは、アイコンの中身を薄い青色で塗りつぶす（オシャレ！） */}
            <Icon size={16} className={isMine ? "fill-blue-100" : ""} />
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}

      {/* 追加ポップアップを開くボタン (SmilePlus) */}
      <button
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        className="flex items-center justify-center h-7 w-7 rounded-full bg-white border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition shadow-sm"
        title="リアクションを追加"
      >
        <SmilePlus size={16} />
      </button>

      {/* ポップアップメニュー */}
      {isPopoverOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-64 bg-white border border-gray-200 shadow-xl rounded-xl p-2 z-50 flex flex-wrap gap-1">
          <div className="w-full px-2 pb-1 mb-1 border-b border-gray-100 text-[10px] font-bold text-gray-400">
            リアクションを選択
          </div>
          {ALL_REACTIONS.map(({ id, Icon, label }) => {
            const isMine = myReactions.includes(id);
            return (
              <button
                key={id}
                onClick={() => handleReact(id)}
                title={label}
                className={`p-2 rounded-lg transition-all hover:scale-110 flex items-center justify-center
                  ${isMine ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
              >
                <Icon size={20} className={isMine ? "fill-blue-100" : ""} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}