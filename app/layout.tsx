import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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
      <body className={`${plusJakartaSans.className} min-h-screen flex flex-col bg-[#120f0e] text-[#1B1716]`}>
        <div className="flex-1 flex justify-center items-start sm:py-6">
          {children}
        </div>
        <footer className="w-full bg-[#120f0e] text-white/50 py-6 px-4 border-t border-white/10 mt-auto">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-medium tracking-wide">
            <a href="/legal#terms" className="hover:text-white transition-colors">Terms & Conditions</a>
            <a href="/legal#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/legal#cancellation" className="hover:text-white transition-colors">Cancellation & Refund</a>
            <a href="/legal#shipping" className="hover:text-white transition-colors">Shipping & Delivery</a>
            <a href="/legal#contact" className="hover:text-white transition-colors">Contact Us</a>
          </div>
          <div className="text-center text-[10px] opacity-40 mt-3">
            &copy; {new Date().getFullYear()} ThePrintr. All rights reserved.
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
