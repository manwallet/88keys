import type { Metadata } from "next";
import "./globals.css";
import ErrorSuppressor from "@/components/ErrorSuppressor";

export const metadata: Metadata = {
  title: "88Keys - 钢琴学习助手",
  description: "优雅地管理你的钢琴曲库，追踪学习进度，获取 AI 练习建议",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body
        className="antialiased"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        <ErrorSuppressor />
        {children}
      </body>
    </html>
  );
}
