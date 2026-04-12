"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true); // true=ログイン, false=新規登録
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    if (isLoginMode) {
      // ログイン処理
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert("ログイン失敗: メアドかパスワードが間違っています。");
      } else {
        router.push("/");
      }
    } else {
      // 新規登録処理
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert("登録エラー: " + error.message);
      } else {
        // 登録成功したらプロフィール設定画面へ
        router.push("/setup");
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-bold mb-6">
        <ArrowLeft size={16} /> 掲示板に戻る
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* タブ切り替え */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setIsLoginMode(true)}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${isLoginMode ? "bg-white text-blue-600 border-b-2 border-blue-600" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
          >
            ログイン
          </button>
          <button 
            onClick={() => setIsLoginMode(false)}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${!isLoginMode ? "bg-white text-blue-600 border-b-2 border-blue-600" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={handleAuth} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">メールアドレス</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
                placeholder="example@school.ac.jp"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">パスワード（6文字以上）</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLoginMode ? "ログイン" : "アカウントを作成")}
          </button>
        </form>
      </div>
    </div>
  );
}