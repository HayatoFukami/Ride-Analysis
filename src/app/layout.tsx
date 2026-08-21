import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ride Analysis",
  description:
    "自分のStravaアクティビティをもっと自由に、スマートに分析するパーソナルダッシュボード",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Roboto via Google Fonts stylesheet — no package dependency, with
            local/system fallbacks (incl. Japanese) in the --font-sans stack. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
