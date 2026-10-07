"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { entrar } from "@/app/login/actions";
import { AlertaErro } from "./alertas";

export function LoginForm() {
  const [estado, executar, pendente] = useActionState(entrar, { mensagens: [] });

  // Envio via onSubmit para manter o e-mail digitado quando o login falhar.
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    startTransition(() => executar(dados));
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <AlertaErro mensagens={estado.mensagens} titulo="Não foi possível entrar" />

      <div>
        <label htmlFor="email" className="rotulo">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="campo"
        />
      </div>

      <div>
        <label htmlFor="senha" className="rotulo">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          className="campo"
        />
      </div>

      <button type="submit" disabled={pendente} className="botao-primario w-full">
        {pendente ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
