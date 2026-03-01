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
    <html lang="en">
       <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cherry+Bomb+One&family=Delius+Unicase:wght@400;700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
      </head>
      <body
        className={`${cherry.variable} ${delius.variable} flex flex-row antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
