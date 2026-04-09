import "./globals.css";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";

const heading = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });

export const metadata = {
  title: "Prosperous Data Hub",
  description: "Ghana VTU internet data bundle platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body style={{ fontFamily: "var(--font-body)" }}>{children}</body>
    </html>
  );
}
