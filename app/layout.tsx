import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const font = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = { title: "print&pop · gestión", description: "Costos, stock y catálogo" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={font.variable}>
      <body>
        <nav className="nav">
          <Link href="/" className="logo">print&amp;pop</Link>
          <Link href="/" className="link">Panel</Link>
          <Link href="/productos" className="link">Productos</Link>
          <Link href="/materiales" className="link">Materiales</Link>
          <Link href="/ventas" className="link">Ventas</Link>
          <Link href="/costos" className="link">Calculadora</Link>
          <Link href="/catalogo" className="link">Catálogo</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
