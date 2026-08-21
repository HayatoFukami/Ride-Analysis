import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Strava Personal Dashboard",
  description: "自分のStravaアクティビティをもっと自由に、スマートに分析するパーソナルダッシュボード",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full bg-[#F7F7F8] text-slate-900 antialiased selection:bg-[#FC5200]/20 selection:text-[#FC5200]">
        {children}
      </body>
    </html>
  );
}
