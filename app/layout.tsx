import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata = {
  title: "Tổ 2 | Tôi là Lũ Lụt — Địa lí 12 KNTT",
  description: "Bài thuyết trình tương tác Tôi là Lũ Lụt — Địa lí 12 Kết nối tri thức với cuộc sống, Tổ 2.",
  icons: { icon: "/logo-to2.png" }
};
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
