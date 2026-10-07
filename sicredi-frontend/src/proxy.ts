import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, sessaoAtiva } from "@/lib/token";

/**
 * Checagem otimista: sem sessão válida no cookie, redireciona para o login
 * antes de renderizar a página. A proteção real está na API, que recusa
 * qualquer requisição sem um token válido.
 */
export function proxy(request: NextRequest) {
  if (sessaoAtiva(request.cookies.get(COOKIE_SESSAO)?.value)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Tudo, exceto o login, a limpeza de sessão e os arquivos estáticos.
  matcher: [
    "/((?!login|sessao-expirada|_next/static|_next/image|favicon.ico).*)",
  ],
};
