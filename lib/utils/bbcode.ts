export const parseBBCode = (text: string) => {
  if (!text) return "";
  
  // 1. まずHTMLタグを無害化（XSS対策）
  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  const sizes: Record<string, string> = { small: "0.75em", large: "1.5em", huge: "2em" };
  const colors: Record<string, string> = { 
    blue: "#3b82f6", red: "#ef4444", green: "#22c55e", 
    yellow: "#eab308", orange: "#f97316", purple: "#a855f7" 
  };

  // 2. 独自タグをHTMLに変換（最大3階層のネストに対応）
  for (let i = 0; i < 3; i++) {
    html = html
      .replace(/\[color=([a-z]+)\]([\s\S]*?)\[\/color\]/gi, (match, color, content) => {
        return colors[color] ? `<span style="color: ${colors[color]}; font-weight: bold;">${content}</span>` : match;
      })
      .replace(/\[size=([a-z]+)\]([\s\S]*?)\[\/size\]/gi, (match, size, content) => {
        return sizes[size] ? `<span style="font-size: ${sizes[size]}; line-height: 1.2;">${content}</span>` : match;
      });
  }
  return html.replace(/\n/g, "<br />");
};