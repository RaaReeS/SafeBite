import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Misma letra que la app. next/font la descarga al compilar y la sirve la propia
// web: el navegador no hace peticiones a Google.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SafeBite",
  description: "Cartas con información de alérgenos declarada por cada establecimiento.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-fg">{children}</body>
    </html>
  );
}
