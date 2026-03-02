import type { Metadata } from "next";
import { Cherry_Bomb_One,  Delius_Unicase} from "next/font/google";


export const metadata: Metadata = {
  title: "Signup",
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


export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
      <main>{children}</main>
  );
}
