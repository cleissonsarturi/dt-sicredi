import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Navegacao } from "@/components/navegacao";
import { usuarioDaSessao } from "@/lib/sessao";
import { sair } from "./login/actions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Solicitações Internas",
    template: "%s · Solicitações Internas",
  },
  description: "Protótipo para gestão de solicitações internas",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const usuario = await usuarioDaSessao();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="bg-marca-700 shadow">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-2 text-white">
              <span
                aria-hidden
                className="grid size-8 place-items-center rounded-md bg-marca-500 text-sm font-bold"
              >
                SI
              </span>
              <span className="font-semibold tracking-tight">
                Solicitações Internas
              </span>
            </Link>
            {usuario && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Navegacao />
                <form
                  action={sair}
                  className="flex items-center gap-3 border-white/20 sm:border-l sm:pl-3"
                >
                  <span className="text-sm text-marca-100" title={usuario.email}>
                    {usuario.nome}
                  </span>
                  <button
                    type="submit"
                    className="rounded-md px-3 py-2 text-sm font-medium text-marca-100 transition hover:bg-white/10 hover:text-white"
                  >
                    Sair
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          Protótipo · Desafio técnico de Desenvolvimento de Sistemas
        </footer>
      </body>
    </html>
  );
}
