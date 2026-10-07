"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { EstadoFormulario } from "@/app/solicitacoes/actions";
import type { Status } from "@/lib/types";
import { AlertaErro } from "./alertas";

interface Props {
  status: Status;
  acao: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
}

/**
 * Painel de análise e decisão. Espelha as regras do back-end (que é quem as
 * garante): ABERTA pode ir para análise; ABERTA e EM_ANALISE podem ser
 * aprovadas ou rejeitadas, sempre com comentário.
 */
export function AlterarStatusForm({ status, acao }: Props) {
  const [estado, executar, pendente] = useActionState(acao, { mensagens: [] });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const submitter = (evento.nativeEvent as SubmitEvent).submitter;
    const dados = new FormData(evento.currentTarget, submitter);
    startTransition(() => executar(dados));
  }

  return (
    <div className="space-y-4">
      <AlertaErro mensagens={estado.mensagens} />

      {status === "ABERTA" && (
        <form onSubmit={enviar} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Sinalize que a solicitação está sendo avaliada.
          </p>
          <button
            type="submit"
            name="status"
            value="EM_ANALISE"
            disabled={pendente}
            className="botao-secundario"
          >
            Iniciar análise
          </button>
        </form>
      )}

      <form onSubmit={enviar} className="space-y-3">
        <div>
          <label htmlFor="comentario" className="rotulo">
            Comentário da decisão *
          </label>
          <textarea
            id="comentario"
            name="comentario"
            required
            minLength={5}
            maxLength={2000}
            rows={3}
            className="campo"
            placeholder="Justifique a aprovação ou rejeição"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="submit"
            name="status"
            value="REJEITADA"
            disabled={pendente}
            className="botao-perigo"
          >
            Rejeitar
          </button>
          <button
            type="submit"
            name="status"
            value="APROVADA"
            disabled={pendente}
            className="botao-primario"
          >
            Aprovar
          </button>
        </div>
      </form>
    </div>
  );
}
