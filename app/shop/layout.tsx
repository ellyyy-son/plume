import type { Metadata } from "next";
import { Cherry_Bomb_One,  Delius_Unicase} from "next/font/google";
import "../globals.css";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "Calendar",
  description: "View your tasks and events!",
};

const cherry = Cherry_Bomb_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-cherry",
});

const delius = Delius_Unicase({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-delius",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <main className="w-full">
        {children}
      </main>
  );
}
