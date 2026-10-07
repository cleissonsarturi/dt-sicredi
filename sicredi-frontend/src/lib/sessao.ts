import "server-only";
import { cookies } from "next/headers";
import { COOKIE_SESSAO, lerToken, type UsuarioSessao } from "./token";

export async function obterToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_SESSAO)?.value;
}

/** Usuário logado (para exibição) ou null se não houver sessão válida. */
export async function usuarioDaSessao(): Promise<UsuarioSessao | null> {
  const dados = lerToken(await obterToken());
  if (!dados || dados.expiraEm <= Date.now()) return null;
  return { id: dados.id, nome: dados.nome, email: dados.email };
}
