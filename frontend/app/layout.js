import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Prosperous Data Hub",
  description: "Ghana VTU internet data bundle platform",
  icons: {
    icon: "/ProsperousLogo.png",
    apple: "/ProsperousLogo.png"
  },
  openGraph: {
    title: "Prosperous Data Hub",
    description: "Ghana VTU internet data bundle platform",
    images: ["/ProsperousLogo.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Prosperous Data Hub",
    description: "Ghana VTU internet data bundle platform",
    images: ["/ProsperousLogo.png"]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "var(--font-body)" }}>{children}</body>
    </html>
  );
}
