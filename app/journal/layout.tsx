import type { Metadata } from "next";
import { Cherry_Bomb_One,  Delius_Unicase} from "next/font/google";
import "../globals.css";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "Write Entry",
  description: "Write your journal entries here!",
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
        <main> {children} </main> 
  );
}
