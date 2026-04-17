"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // 画面の表示切り替え（loading: ロード中 / auth: メアド入力 / setup: プロフ入力）
  const [view, setView] = useState<"loading" | "auth" | "setup">("loading");
  
  // --- Auth（認証）用State ---
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // --- Profile（プロフ設定）用State ---
  const [studentId, setStudentId] = useState("");
  const [nickname, setNickname] = useState("");
  const [course, setCourse] = useState("");
  const [grade, setGrade] = useState(""); 
  const [saving, setSaving] = useState(false);

  // 1. ページを開いた時のチェック
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setView("auth"); // 未ログインならメアド/パスワード画面へ
        return;
      }

      // 既にプロフィールが存在するかチェック
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();

      if (profile) {
        router.push("/"); // プロフもあればトップへ
      } else {
        setView("setup"); // ログイン済みだけどプロフが無いなら初期設定画面へ
      }
    };
    checkUser();
  }, [router]);

  // 2. ログイン / 新規登録の処理
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    if (isLoginMode) {
      // ログイン
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("ログイン失敗: " + error.message);
      else window.location.reload(); // 成功したら画面をリロードしてチェックを再実行
    } else {
      // 新規登録
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("登録失敗: " + error.message);
      else {
        alert("登録成功！続けてプロフィールを設定してください。");
        window.location.reload();
      }
    }
    setAuthLoading(false);
  };

  // ★ パスワード再設定メール送信機能
  const handleForgotPassword = async () => {
    const email = prompt("登録したメールアドレスを入力してください：");
    if (!email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // 再設定後のリダイレクト先を /settings に設定（ログイン状態で遷移します）
      redirectTo: `${window.location.origin}/settings`,
    });

    if (error) {
      alert("エラー: " + error.message);
    } else {
      alert("パスワード再設定用のメールを送信しました。メール内のリンクをクリックして、設定画面からパスワードを変更してください。");
    }
  };

  // 3. プロフィール保存の処理（いただいたコードをそのまま活用！）
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ユーザーエラーです。最初からやり直してください。");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id, 
      student_id: studentId,
      nickname: nickname,
      course: course,
      grade: grade,
      role: 'student', 
    });

    if (error) {
      if (error.code === "23505" && error.message.includes("student_id")) {
        alert("エラー: この学籍番号は既に登録されています。");
      } else {
        alert("保存エラー: " + error.message);
      }
      setSaving(false);
    } else {
      alert("プロフィールを登録しました！");
      router.push("/"); 
    }
  };

  // --- 画面の表示 ---

  if (view === "loading") {
    return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  }

  // 【ステップ1】 メアドとパスワードの入力画面
  if (view === "auth") {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isLoginMode ? "ログイン" : "新規アカウント登録"}
        </h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" placeholder="example@tid.ac.jp" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" placeholder="6文字以上" />
          </div>
          <button type="submit" disabled={authLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {authLoading ? "処理中..." : (isLoginMode ? "ログイン" : "登録する")}
          </button>
          {/* ★ 追加：パスワードを忘れた場合のリンク */}
          <button 
            type="button" 
            onClick={handleForgotPassword}
            className="w-full text-xs text-gray-400 hover:text-blue-500 font-bold transition pt-2"
          >
            パスワードを忘れた場合はこちら
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-sm text-blue-600 hover:underline font-bold">
            {isLoginMode ? "アカウントを持っていませんか？新規登録へ" : "既にアカウントをお持ちですか？ログインへ"}
          </button>
        </div>
      </div>
    );
  }

  // 【ステップ2】 初期プロフィールの設定画面（いただいたコードのUI）
  if (view === "setup") {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">初期プロフィール設定</h1>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">学籍番号 <span className="text-red-500 text-xs font-bold">必須・一度登録すると変更できません</span></label>
            <input type="text" required value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" placeholder="例: 24A1234" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ニックネーム <span className="text-gray-500 text-xs">スレッド等で表示されます</span></label>
            <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" placeholder="例: 名無しの新入生" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">学年 <span className="text-gray-500 text-xs">任意</span></label>
            <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white">
              <option value="">選択してください</option>
              <option value="1年">1年</option>
              <option value="2年">2年</option>
              <option value="3年">3年</option>
              <option value="4年">4年</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">履修コース/専攻 <span className="text-gray-500 text-xs">任意</span></label>
            <input type="text" value={course} onChange={e => setCourse(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" placeholder="例: SEコース" />
          </div>
          <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 mt-4">
            {saving ? "保存中..." : "登録して掲示板へ"}
          </button>
        </form>
      </div>
    );
  }

  return null;
}