import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "PlanerSeman | Gestão de Prazos e Atividades - Fibrasa",
  description: "Plataforma executiva de acompanhamento de atividades, responsabilidades e cobrança de prazos para manutenção industrial.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased selection:bg-[#147846] selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
