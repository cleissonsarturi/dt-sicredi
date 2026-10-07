"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { EstadoFormulario } from "@/app/solicitacoes/actions";
import { api, ApiError } from "@/lib/api";
import { COOKIE_SESSAO } from "@/lib/token";

/**
 * Autentica na API e guarda o JWT em cookie httpOnly: o token nunca fica
 * acessível ao JavaScript do navegador e é enviado à API só pelo servidor.
 */
export async function entrar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "");
  const senha = String(formData.get("senha") ?? "");

  try {
    const { accessToken, expiraEm } = await api.login(email, senha);
    (await cookies()).set(COOKIE_SESSAO, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      // Em produção (HTTPS), defina COOKIE_SECURE=true.
      secure: process.env.COOKIE_SECURE === "true",
      path: "/",
      maxAge: expiraEm,
    });
  } catch (erro) {
    if (erro instanceof ApiError) return { mensagens: erro.mensagens };
    throw erro;
  }
  redirect("/");
}

export async function sair(): Promise<void> {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect("/login");
}
