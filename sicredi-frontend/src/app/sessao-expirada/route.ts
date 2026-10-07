import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESSAO } from "@/lib/token";

/**
 * Destino quando a API recusa o token (expirado, adulterado ou assinado com
 * outro segredo). Cookies só podem ser apagados em Route Handlers ou Server
 * Functions, por isso a limpeza passa por aqui antes de voltar ao login.
 */
export async function GET() {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect("/login?sessao=expirada");
}
