import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

console.log("[LAYOUT] 📄 App Layout module carregando...");
const layoutStartTime = Date.now();

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

console.log(`[LAYOUT] ✓ Poppins font carregada em ${Date.now() - layoutStartTime}ms`);

export const metadata: Metadata = {
  title: "UAffiliated",
  description: "Affiliate network system for betting houses",
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-poppins" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
