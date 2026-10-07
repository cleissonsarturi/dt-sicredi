import "server-only";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { obterToken } from "./sessao";
import type {
  EventoIntegracao,
  FiltrosSolicitacoes,
  Paginado,
  RespostaLogin,
  ResumoDashboard,
  Solicitacao,
  Status,
} from "./types";

/**
 * Cliente da API NestJS. Executa somente no servidor (Server Components e
 * Server Actions): a URL da API não é exposta ao navegador e não há CORS.
 */
const API_URL = process.env.API_URL;

/** Erro retornado pela API, já no envelope padronizado do back-end. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly mensagens: string[],
  ) {
    super(mensagens.join("; "));
    this.name = "ApiError";
  }
}

async function request<T>(
  caminho: string,
  init?: RequestInit,
  { autenticado = true } = {},
): Promise<T> {
  // Dados sempre lidos no momento da requisição (nunca no build).
  await connection();

  const token = autenticado ? await obterToken() : undefined;
  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...init?.headers,
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiError(503, [
      "Não foi possível conectar à API. Verifique se o back-end está em execução.",
    ]);
  }

  // Token ausente, expirado ou revogado: volta para o login.
  if (resposta.status === 401 && autenticado) redirect("/sessao-expirada");
  if (resposta.status === 204) return undefined as T;

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const mensagens: string[] = corpo?.mensagens ?? [
      `Erro inesperado (HTTP ${resposta.status})`,
    ];
    throw new ApiError(resposta.status, mensagens);
  }
  return corpo as T;
}

function querystring(filtros: FiltrosSolicitacoes): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== "") params.set(chave, String(valor));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  login: (email: string, senha: string) =>
    request<RespostaLogin>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, senha }) },
      { autenticado: false },
    ),

  listarSolicitacoes: (filtros: FiltrosSolicitacoes = {}) =>
    request<Paginado<Solicitacao>>(`/solicitacoes${querystring(filtros)}`),

  buscarSolicitacao: (id: string) =>
    request<Solicitacao>(`/solicitacoes/${encodeURIComponent(id)}`),

  criarSolicitacao: (dados: Record<string, unknown>) =>
    request<Solicitacao>("/solicitacoes", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  atualizarSolicitacao: (id: string, dados: Record<string, unknown>) =>
    request<Solicitacao>(`/solicitacoes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),

  alterarStatus: (id: string, status: Status, comentario?: string) =>
    request<Solicitacao>(`/solicitacoes/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, comentario }),
    }),

  excluirSolicitacao: (id: string) =>
    request<void>(`/solicitacoes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  listarIntegracoes: (id: string) =>
    request<EventoIntegracao[]>(
      `/solicitacoes/${encodeURIComponent(id)}/integracoes`,
    ),

  resumoDashboard: () => request<ResumoDashboard>("/dashboard/resumo"),
};

/** Busca a solicitação ou renderiza a página 404 (id inexistente ou inválido). */
export async function buscarSolicitacaoOu404(id: string): Promise<Solicitacao> {
  try {
    return await api.buscarSolicitacao(id);
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.status)) notFound();
    throw erro;
  }
}
