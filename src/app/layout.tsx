import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ManBudget",
  description: "Personal budget — see where your money goes.",
  manifest: "/manifest.webmanifest",
  applicationName: "ManBudget",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ManBudget",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-density="comfortable">
      <body className="mb" data-bg="black">
        {children}
      </body>
    </html>
  );
}
