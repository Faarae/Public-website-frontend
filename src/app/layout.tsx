import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "d Zain al Mansion | Kemewahan dalam Ketenangan",
  description: "Arsitektur mewah dan ketenangan privat tropis di d Zain al Mansion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="bg-background text-on-background selection:bg-primary-fixed-dim selection:text-on-primary-fixed overflow-x-hidden font-body-md">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
