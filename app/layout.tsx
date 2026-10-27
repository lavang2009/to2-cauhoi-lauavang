import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Tổ 2 | Địa lí 12 — Lũ lụt & Lũ quét",
  description: "Bài thuyết trình tương tác Địa lí 12 Kết nối tri thức với cuộc sống, thực hiện bởi Tổ 2.",
  icons: { icon: "/logo-to2.png" }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
