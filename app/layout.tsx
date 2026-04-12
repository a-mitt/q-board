// app/layout.tsx の上の方

import type { Metadata, Viewport } from "next"; // ★ Viewport を追加
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

const inter = Inter({ subsets: ["latin"] });

// ★修正：iPhone用の設定を追加
export const metadata: Metadata = {
  title: "先輩に質問！　　質問掲示板",
  description: "学内の学生交流・質問掲示板",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "掲示板",
  },
};

// ★追加：スマホのステータスバー（時計や電池の帯）の背景色を設定
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // 画面のズームを固定してアプリっぽくする
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 min-h-screen pb-16 md:pb-0"> 
        {/* ★ pb-16 を body に追加して、ボトムナビの下にコンテンツが隠れないようにする */}
        
        <Header />
        <main className="container mx-auto p-4">
          {children}
        </main>

        <BottomNav /> {/* ★ ここに追加！ */}
      </body>
    </html>
  );
}