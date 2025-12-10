import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AIRobotButton from "@/components/AIRobotButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 사이트 URL (환경 변수 또는 기본값)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://myplanet.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "My Planet - 나만의 여행 지도",
  description: "3D 지구본과 보드게임 스타일로 방문한 국가를 시각화하고 기록하는 인터랙티브 웹 애플리케이션",
  openGraph: {
    title: "My Planet - 나만의 여행 지도",
    description: "3D 지구본과 보드게임 스타일로 방문한 국가를 시각화하고 기록하는 인터랙티브 웹 애플리케이션",
    type: "website",
    url: siteUrl,
    images: [
      {
        url: "/og-image.png", // 공유용 이미지
        width: 1200,
        height: 630,
        alt: "My Planet - 나만의 여행 지도",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Planet - 나만의 여행 지도",
    description: "3D 지구본과 보드게임 스타일로 방문한 국가를 시각화하고 기록하는 인터랙티브 웹 애플리케이션",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <AIRobotButton />
      </body>
    </html>
  );
}
