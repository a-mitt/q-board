import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// サーバー側だけで使う最強のクライアントを作成
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, newEmail, adminUserId } = await request.json();

    // 1. 実行者が本当にadminか、サーバー側で最終チェック（セキュリティ）
    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", adminUserId)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    // 2. メアドを書き換える (Auth管理画面の操作をAPIで実行)
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: newEmail,
      email_confirm: true, // 自動で「確認済み」にする
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}