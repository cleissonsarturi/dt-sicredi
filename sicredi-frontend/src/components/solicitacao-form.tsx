"use client";

import Link from "next/link";
import { startTransition, useActionState, type FormEvent } from "react";
import type { EstadoFormulario } from "@/app/solicitacoes/actions";
import { hojeIso } from "@/lib/format";
import {
  PRIORIDADES,
  ROTULO_PRIORIDADE,
  type Solicitacao,
} from "@/lib/types";
import { AlertaErro } from "./alertas";

interface Props {
  acao: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  inicial?: Partial<Solicitacao>;
  textoBotao: string;
  cancelarHref: string;
}

export function SolicitacaoForm({ acao, inicial, textoBotao, cancelarHref }: Props) {
  const [estado, executar, pendente] = useActionState(acao, { mensagens: [] });

  // Envio via onSubmit (e não pela prop `action`) para que o React não limpe
  // os campos quando a API devolver erro de validação.
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    startTransition(() => executar(dados));
  }

  const hoje = hojeIso();

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate={false}>
      <AlertaErro mensagens={estado.mensagens} />

      <div>
        <label htmlFor="titulo" className="rotulo">
          Título *
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          minLength={3}
          maxLength={150}
          defaultValue={inicial?.titulo}
          className="campo"
          placeholder="Resumo da solicitação"
        />
      </div>

      <div>
        <label htmlFor="descricao" className="rotulo">
          Descrição *
        </label>
        <textarea
          id="descricao"
          name="descricao"
          required
          maxLength={5000}
          rows={5}
          defaultValue={inicial?.descricao}
          className="campo"
          placeholder="Detalhe o que precisa ser feito e o motivo"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="solicitante" className="rotulo">
            Solicitante *
          </label>
          <input
            id="solicitante"
            name="solicitante"
            required
            minLength={2}
            maxLength={120}
            defaultValue={inicial?.solicitante}
            className="campo"
          />
        </div>
        <div>
          <label htmlFor="areaSolicitante" className="rotulo">
            Área solicitante *
          </label>
          <input
            id="areaSolicitante"
            name="areaSolicitante"
            required
            minLength={2}
            maxLength={100}
            defaultValue={inicial?.areaSolicitante}
            className="campo"
            placeholder="Ex.: Crédito, Tecnologia"
          />
        </div>
        <div>
          <label htmlFor="prioridade" className="rotulo">
            Prioridade *
          </label>
          <select
            id="prioridade"
            name="prioridade"
            required
            defaultValue={inicial?.prioridade ?? ""}
            className="campo"
          >
            <option value="" disabled>
              Selecione
            </option>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {ROTULO_PRIORIDADE[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dataSolicitacao" className="rotulo">
            Data da solicitação *
          </label>
          <input
            id="dataSolicitacao"
            name="dataSolicitacao"
            type="date"
            required
            max={hoje}
            defaultValue={inicial?.dataSolicitacao ?? hoje}
            className="campo"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Link href={cancelarHref} className="botao-secundario">
          Cancelar
        </Link>
        <button type="submit" disabled={pendente} className="botao-primario">
          {pendente ? "Salvando..." : textoBotao}
        </button>
      </div>
    </form>
  );
}
