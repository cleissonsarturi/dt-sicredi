"use client";

import { useState, useTransition } from "react";
import type { EstadoFormulario } from "@/app/solicitacoes/actions";
import { AlertaErro } from "./alertas";

export function ExcluirButton({ acao }: { acao: () => Promise<EstadoFormulario> }) {
  const [pendente, iniciar] = useTransition();
  const [mensagens, setMensagens] = useState<string[]>([]);

  function excluir() {
    if (!confirm("Excluir esta solicitação? O histórico também será removido.")) return;
    iniciar(async () => {
      const resultado = await acao();
      setMensagens(resultado?.mensagens ?? []);
    });
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={excluir} disabled={pendente} className="botao-secundario text-red-700">
        {pendente ? "Excluindo..." : "Excluir"}
      </button>
      <AlertaErro mensagens={mensagens} />
    </div>
  );
}
