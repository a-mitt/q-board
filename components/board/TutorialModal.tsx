"use client";

import { X, HelpCircle, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function TutorialModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        
        {/* ヘッダー画像風の装飾 */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles size={60} /></div>
          <h2 className="text-2xl font-black text-white relative z-10">ようこそ Q-BOARD へ！</h2>
          <p className="text-blue-100 text-sm mt-1 relative z-10 font-bold">5月末までの限定オープン！</p>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm font-bold text-gray-600 text-center">
            このアプリの主な機能をご紹介します。
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">1. 質問掲示板</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  履修やテスト、学生生活の悩みを先輩に直接質問できます。右下のボタンから気軽に投稿してみましょう！
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">2. 交流スレッド</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  サークル仲間を募集したり、趣味について同級生と語り合えるDiscord風の掲示板です。
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">3. 安心の匿名機能</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  すべての投稿で「匿名」や「学年非表示」を選ぶことができます。身バレを気にせず自由に活用してください！
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl hover:bg-gray-800 transition-all shadow-lg"
          >
            はじめる！
          </button>
        </div>
      </div>
    </div>
  );
}