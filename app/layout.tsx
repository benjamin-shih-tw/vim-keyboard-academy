import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vim Keyboard Academy｜互動式 Vim 與競賽程式教學",
  description: "用你的 GitHub Dark Vim UI，逐鍵學會純鍵盤編輯、CPH Modern、Competitive Companion 與 C++ 競賽工作流。",
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "Vim Keyboard Academy", description: "用鍵盤，把 Vim 練成肌肉記憶。", images: ["/og.png"], type: "website" },
  twitter: { card: "summary_large_image", title: "Vim Keyboard Academy", description: "用鍵盤，把 Vim 練成肌肉記憶。", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
