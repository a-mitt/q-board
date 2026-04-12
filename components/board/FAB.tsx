// components/board/FAB.tsx
import { Pencil } from "lucide-react";

export default function FAB() {
  return (
    <button 
      className="fixed bottom-6 right-6 md:bottom-10 md:right-10 h-16 w-16 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 transition-all flex items-center justify-center z-40"
      title="質問を投稿する"
    >
      <Pencil size={24} />
    </button>
  );
}