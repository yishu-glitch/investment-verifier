import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "证研 · 投资命题验证工作台",
  description: "结合真实财务数据与披露材料验证投资命题，形成可追溯判断。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
