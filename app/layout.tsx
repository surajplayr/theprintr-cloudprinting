import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Printr - Self-Service Cloud Print",
  description: "Self-Service Cloud Print",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.className} min-h-screen flex justify-center items-start sm:py-6 bg-[#120f0e] text-[#1B1716]`}>
        {children}
      </body>
    </html>
  );
}
