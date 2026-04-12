import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '学生質問掲示板',
    short_name: '掲示板',
    description: '学内の学生交流・質問掲示板',
    start_url: '/',
    display: 'standalone', // これが「ブラウザのURLバーを消して全画面にする」魔法の呪文です
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/icon.png', // 後でここにアイコン画像を置きます
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}