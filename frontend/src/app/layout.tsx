import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InsightGen AI — Agentic AI Data Scientist",
  description: "Transform datasets into verified business intelligence with deterministic execution and generative AI synthesis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
