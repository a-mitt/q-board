import { supabase } from "@/lib/supabase";

export const sendNotification = async (targetUserId: string, type: string, message: string, linkTo: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === targetUserId) return; // 自分への通知は無視

  // 1. 相手の通知設定を取得
  const { data: profile } = await supabase.from('profiles').select('settings').eq('id', targetUserId).single();
  const prefs = profile?.settings?.notifications;

  // 2. 設定に応じてスキップ
  if (type === 'answer' && prefs?.onAnswer === false) return;
  if (type === 'reaction' && prefs?.onReaction === false) return;

  // 3. DBに通知を保存
  await supabase.from('notifications').insert({
    user_id: targetUserId,
    type,
    message,
    link_to: linkTo,
  });

  // 4. もしメール設定がONなら、ここでメール送信APIを叩く（後述）
  if (prefs?.emailEnabled) {
    console.log("メール送信処理へ（Resend等の設定が必要）");
  }
};