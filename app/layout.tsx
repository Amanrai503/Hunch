import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { getSession } from "@/lib/auth/session";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hunch — Steam Recommendations, Explained",
  description:
    "Discover your next favorite Steam game with explainable, filterable picks based on your real library and play habits.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink font-body">
        <TopNav user={session} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
