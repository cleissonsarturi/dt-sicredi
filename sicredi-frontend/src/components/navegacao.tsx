"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", rotulo: "Dashboard", ativo: (p: string) => p === "/" },
  {
    href: "/solicitacoes",
    rotulo: "Solicitações",
    ativo: (p: string) =>
      p.startsWith("/solicitacoes") && p !== "/solicitacoes/nova",
  },
  {
    href: "/solicitacoes/nova",
    rotulo: "Nova solicitação",
    ativo: (p: string) => p === "/solicitacoes/nova",
  },
];

export function Navegacao() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="Principal">
      {LINKS.map(({ href, rotulo, ativo }) => {
        const atual = ativo(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={atual ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
              atual
                ? "bg-white/15 text-white"
                : "text-marca-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
