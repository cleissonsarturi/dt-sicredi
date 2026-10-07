"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Status } from "@/lib/types";

/** Estado devolvido aos formulários quando a operação falha. */
export interface EstadoFormulario {
  mensagens: string[];
}

const CAMPOS = [
  "titulo",
  "descricao",
  "solicitante",
  "areaSolicitante",
  "prioridade",
  "dataSolicitacao",
] as const;

function lerSolicitacao(formData: FormData) {
  const dados: Record<string, string> = {};
  for (const campo of CAMPOS) {
    const valor = formData.get(campo);
    if (typeof valor === "string" && valor.trim() !== "") dados[campo] = valor;
  }
  return dados;
}

/**
 * Converte falhas da API em mensagens para o formulário. Erros inesperados
 * são relançados para o error boundary da rota.
 */
function tratarErro(erro: unknown): EstadoFormulario {
  if (erro instanceof ApiError) return { mensagens: erro.mensagens };
  throw erro;
}

function revalidar() {
  // Invalida o cache do roteador em todas as rotas (lista, detalhe e dashboard).
  revalidatePath("/", "layout");
}

export async function criarSolicitacao(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  let id: string;
  try {
    ({ id } = await api.criarSolicitacao(lerSolicitacao(formData)));
  } catch (erro) {
    return tratarErro(erro);
  }
  revalidar();
  redirect(`/solicitacoes/${id}?sucesso=criada`);
}

export async function atualizarSolicitacao(
  id: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    await api.atualizarSolicitacao(id, lerSolicitacao(formData));
  } catch (erro) {
    return tratarErro(erro);
  }
  revalidar();
  redirect(`/solicitacoes/${id}?sucesso=atualizada`);
}

export async function alterarStatus(
  id: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const status = formData.get("status") as Status;
  const comentario = (formData.get("comentario") as string | null)?.trim();
  try {
    await api.alterarStatus(id, status, comentario || undefined);
  } catch (erro) {
    return tratarErro(erro);
  }
  revalidar();
  redirect(`/solicitacoes/${id}?sucesso=status`);
}

export async function excluirSolicitacao(
  id: string,
): Promise<EstadoFormulario> {
  try {
    await api.excluirSolicitacao(id);
  } catch (erro) {
    return tratarErro(erro);
  }
  revalidar();
  redirect("/solicitacoes?sucesso=excluida");
}
