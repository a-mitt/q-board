// components/board/QuestionGridItem.tsx
import Link from "next/link";

type Props = {
  id: string;
  question: string;
  latestAnswer?: string;
  tags: string[];
  isAnonymous?: boolean;
};

export default function QuestionGridItem({ id, question, latestAnswer, tags, isAnonymous }: Props) {
  return (
    <Link 
      href={`/questions/${id}`} 
      className="block aspect-square rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition flex flex-col overflow-hidden group"
    >
      {/* Q (上8割エリア) */}
      <div className="flex-[8] p-4 flex flex-col gap-2 overflow-hidden">
        <div className="flex justify-between items-start">
          <span className="text-3xl font-black text-blue-500 font-serif leading-none group-hover:scale-110 transition-transform origin-left">Q.</span>
        </div>
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

      {/* 区切り線 */}
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
  );
}