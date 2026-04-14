"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [nickname, setNickname] = useState("");
  const [course, setCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // emailやpasswordの並びにこれを追加
  const [grade, setGrade] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login"); // 未ログインならログイン画面へ
        return;
      }

      // ★ 既にプロフィールが存在するかチェック
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profile) {
        // 既にプロフィールがあるなら、設定画面を見せずにホームへ飛ばす！
        router.push("/");
      } else {
        setLoading(false); // プロフィールが無い場合のみ、入力画面を表示
      }
    };
    checkUser();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // ★修正ポイント1: 保存する直前に、ログイン中のユーザー情報を確実に取得する
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("ユーザー情報が見つかりません。一度戻ってログインし直してください。");
      setSaving(false);
      return;
    }

    // Supabaseの profiles テーブルにデータを保存
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, // ★修正ポイント2: userId ではなく、いま取得した確実な user.id を直接入れる！
      student_id: studentId,
      nickname: nickname,
      course: course,
      role: 'student', 
    });

    if (error) {
      if (error.code === "23505" && error.message.includes("student_id")) {
        alert("エラー: この学籍番号は既に登録されています。別の番号を入力してください。");
      } else {
        alert("保存中にエラーが発生しました: " + error.message);
      }
      setSaving(false);
    } else {
      alert("プロフィールを登録しました！掲示板へ移動します。");
      router.push("/"); 
    }
  };

  if (loading) return <div className="text-center mt-20 text-gray-500">読み込み中...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">初期プロフィール設定</h1>
      <form onSubmit={handleSave} className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            学籍番号 <span className="text-red-500 text-xs font-bold">必須・一度登録すると変更できません</span>
          </label>
          <input 
            type="text" 
            required 
            value={studentId} 
            onChange={e => setStudentId(e.target.value)} 
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 text-gray-800" 
            placeholder="例: 24A1234" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ニックネーム <span className="text-gray-500 text-xs">スレッド等で表示されます</span>
          </label>
          <input 
            type="text" 
            value={nickname} 
            onChange={e => setNickname(e.target.value)} 
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 text-gray-800"
            placeholder="例: 名無しの新入生" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            履修コース/専攻 <span className="text-gray-500 text-xs">任意</span>
          </label>
          <input 
            type="text" 
            value={course} 
            onChange={e => setCourse(e.target.value)} 
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 text-gray-800"
            placeholder="例: SEコース"
          />
        </div>

        <button 
          type="submit" 
          disabled={saving} 
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 mt-4"
        >
          {saving ? "保存中..." : "登録して掲示板へ"}
        </button>
      </form>
    </div>
  );
}