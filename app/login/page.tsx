"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // ★修正: ログイン後は /setup ではなく / に飛ばす（ルートで振り分けるため）
        emailRedirectTo: `${window.location.origin}/`, 
      },
    });

    if (error) {
      setMessage("エラーが発生しました: " + error.message);
    } else {
      setMessage("入力されたメールアドレスにログインリンクを送信しました。メールボックスを確認してください！");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">ログイン / 登録</h1>
        <p className="text-sm text-gray-600 mt-2">
          学校発行のメールアドレス（推奨）を入力してください
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.ac.jp"
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "送信中..." : "ログインリンクを送信"}
        </button>

        {message && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg">
            {message}
          </div>
        )}
      </form>
    </div>
  );
}