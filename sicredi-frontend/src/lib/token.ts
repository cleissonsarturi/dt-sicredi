/** Nome do cookie httpOnly que guarda o JWT emitido pela API. */
export const COOKIE_SESSAO = "sessao";

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
}

/**
 * Lê o payload do JWT sem verificar a assinatura. Serve só para exibição e
 * para a checagem otimista do proxy: quem valida o token de fato é a API, a
 * cada requisição.
 */
export function lerToken(
  token: string | undefined,
): (UsuarioSessao & { expiraEm: number }) | null {
  const payload = token?.split(".")[1];
  if (!payload) return null;
  try {
    const dados = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { sub?: string; nome?: string; email?: string; exp?: number };
    if (!dados.sub || !dados.exp) return null;
    return {
      id: dados.sub,
      nome: dados.nome ?? "",
      email: dados.email ?? "",
      expiraEm: dados.exp * 1000,
    };
  } catch {
    return null;
  }
}

/** Token presente e ainda dentro da validade. */
export function sessaoAtiva(token: string | undefined): boolean {
  const dados = lerToken(token);
  return dados !== null && dados.expiraEm > Date.now();
}
