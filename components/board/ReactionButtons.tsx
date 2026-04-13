"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { sendNotification } from "@/lib/utils/notifications";
import {
  // 基本・表情
  ThumbsUp, Heart, Sparkles, Smile, Frown, PartyPopper, Flame, Zap, Ghost, Angry, Meh,
  // ジェスチャー・人
  HandMetal, HandHeart, Handshake, Eye, Crown, Award,
  // ツール・IT
  CodeXml, Laptop, Lightbulb, Settings, Search, Save, Power, Mail, MessageCircle,
  // ライフスタイル・場所
  Gamepad2, Gem, Music4, School, ShoppingCart, Sofa, MapPin, Umbrella,
  // 動物・自然
  Rat, Snail, Turtle, PawPrint, Sun, Moon, Star,
  // 食べ物・その他
  Banana, Popsicle, Sword, Skull,
  // インターフェース
  Check, Hourglass, Parentheses, Pointer, Repeat, Scissors, SkipForward,
  // ステータス
  TriangleAlert, TrendingUp, TrendingDown, SmilePlus
} from "lucide-react";

type Props = {
  targetId: string;
  type: "question" | "answer" | "thread_post";
};

// 全リアクションの定義
const ALL_REACTIONS = [
  { id: "thumbs_up", Icon: ThumbsUp, label: "いいね" },
  { id: "thanks", Icon: Heart, label: "感謝" },
  { id: "clap", Icon: Sparkles, label: "拍手" },
  { id: "smile", Icon: Smile, label: "スマイル" },
  { id: "sad", Icon: Frown, label: "悲しい" },
  { id: "wow", Icon: PartyPopper, label: "すごい" },
  { id: "surprise", Icon: Zap, label: "びっくり" },
  { id: "scary", Icon: Ghost, label: "怖い" },
  { id: "angry", Icon: Angry, label: "おこ" },
  { id: "flame", Icon: Flame, label: "やばい" },
  { id: "annoyed", Icon: Meh, label: "ヌーン" },
  { id: "award", Icon: Award, label: "授賞" },
  { id: "banana", Icon: Banana, label: "ばなな" },
  { id: "check", Icon: Check, label: "チェック" },
  { id: "code", Icon: CodeXml, label: "コード" },
  { id: "crown", Icon: Crown, label: "王冠" },
  { id: "eye", Icon: Eye, label: "みてる" },
  { id: "gamepad", Icon: Gamepad2, label: "ゲーム" },
  { id: "gem", Icon: Gem, label: "宝石" },
  { id: "handmetal", Icon: HandMetal, label: "メタル" },
  { id: "handheart", Icon: HandHeart, label: "愛" },
  { id: "handshake", Icon: Handshake, label: "握手" },
  { id: "hourglass", Icon: Hourglass, label: "砂時計" },
  { id: "laptop", Icon: Laptop, label: "ノートPC" },
  { id: "lightbulb", Icon: Lightbulb, label: "ひらめき" },
  { id: "mail", Icon: Mail, label: "メール" },
  { id: "map_pin", Icon: MapPin, label: "場所" },
  { id: "message", Icon: MessageCircle, label: "チャット" },
  { id: "moon", Icon: Moon, label: "月" },
  { id: "music", Icon: Music4, label: "音楽" },
  { id: "parentheses", Icon: Parentheses, label: "かっこ" },
  { id: "paw_print", Icon: PawPrint, label: "足跡" },
  { id: "pointer", Icon: Pointer, label: "指" },
  { id: "power", Icon: Power, label: "電源" },
  { id: "popsicle", Icon: Popsicle, label: "アイス" },
  { id: "rat", Icon: Rat, label: "ねずみ" },
  { id: "repeat", Icon: Repeat, label: "リピート" },
  { id: "save", Icon: Save, label: "保存" },
  { id: "search", Icon: Search, label: "検索" },
  { id: "scissors", Icon: Scissors, label: "はさみ" },
  { id: "school", Icon: School, label: "学校" },
  { id: "settings", Icon: Settings, label: "設定" },
  { id: "shopping_cart", Icon: ShoppingCart, label: "買い物" },
  { id: "skull", Icon: Skull, label: "ドクロ" },
  { id: "skip_forward", Icon: SkipForward, label: "次へ" },
  { id: "snail", Icon: Snail, label: "かたつむり" },
  { id: "sofa", Icon: Sofa, label: "ソファ" },
  { id: "star", Icon: Star, label: "星" },
  { id: "sun", Icon: Sun, label: "太陽" },
  { id: "sword", Icon: Sword, label: "剣" },
  { id: "triangle_alert", Icon: TriangleAlert, label: "警告" },
  { id: "umbrella", Icon: Umbrella, label: "傘" },
  { id: "turtle", Icon: Turtle, label: "かめ" },
  { id: "trending_up", Icon: TrendingUp, label: "上昇" },
  { id: "trending_down", Icon: TrendingDown, label: "下降" },
];

const PRIMARY_IDS = ["thumbs_up", "thanks", "clap", "smile"];

export default function ReactionButtons({ targetId, type }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myReactions, setMyReactions] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

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

    setCounts(prev => ({ ...prev, [reactionId]: (prev[reactionId] || 0) + (isMine ? -1 : 1) }));
    setMyReactions(prev => isMine ? prev.filter(e => e !== reactionId) : [...prev, reactionId]);
    setIsPopoverOpen(false);

    if (isMine) {
      await supabase.from("reactions").delete().match({ [column]: targetId, user_id: user.id, emoji: reactionId });
    } else {
      await supabase.from("reactions").insert({ [column]: targetId, user_id: user.id, emoji: reactionId });

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

  const activeReactionIds = Object.keys(counts).filter(id => counts[id] > 0);
  const visibleIds = Array.from(new Set([...PRIMARY_IDS, ...activeReactionIds]));
  const visibleReactions = ALL_REACTIONS.filter(r => visibleIds.includes(r.id));

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-4 relative" ref={popoverRef}>
      {visibleReactions.map(({ id, Icon }) => {
        const isMine = myReactions.includes(id);
        const count = counts[id] || 0;
        return (
          <button
            key={id}
            onClick={() => handleReact(id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-all duration-200
              ${isMine ? "bg-blue-50 border-blue-300 text-blue-600 shadow-sm" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100"}`}
          >
            <Icon size={16} className={isMine ? "fill-blue-100" : ""} />
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}

      <button
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        className="flex items-center justify-center h-7 w-7 rounded-full bg-white border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition shadow-sm"
      >
        <SmilePlus size={16} />
      </button>

      {isPopoverOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-64 max-h-48 overflow-y-auto bg-white border border-gray-200 shadow-xl rounded-xl p-2 z-50 flex flex-wrap gap-1">
          <div className="w-full px-2 pb-1 mb-1 border-b border-gray-100 text-[10px] font-bold text-gray-400 sticky top-0 bg-white">
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