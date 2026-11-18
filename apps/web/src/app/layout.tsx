import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { APPEARANCE_BOOT_SCRIPT } from "@/lib/appearance";
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
    // suppressHydrationWarning: el script del <head> pone data-theme antes de React.
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-fg">{children}</body>
    </html>
  );
}
