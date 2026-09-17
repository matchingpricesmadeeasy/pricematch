import "../styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PriceMatch – Matching Prices Made Easy",
  description: "Compare the same product across supported retailers, including shipping, price history, watchlists, and price-drop alerts.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
