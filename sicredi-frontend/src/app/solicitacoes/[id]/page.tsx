import Link from "next/link";
import { AlertaSucesso } from "@/components/alertas";
import { AlterarStatusForm } from "@/components/alterar-status-form";
import { PrioridadeBadge, StatusBadge } from "@/components/badges";
import { ExcluirButton } from "@/components/excluir-button";
import { api, buscarSolicitacaoOu404 } from "@/lib/api";
import { formatarData, formatarDataHora } from "@/lib/format";
import {
  ROTULO_STATUS,
  STATUS_FINAIS,
  type EventoIntegracao,
} from "@/lib/types";
import { alterarStatus, excluirSolicitacao } from "../actions";

export const metadata = { title: "Detalhes da solicitação" };

const MENSAGENS_SUCESSO: Record<string, string> = {
  criada: "Solicitação cadastrada com sucesso.",
  atualizada: "Alterações salvas com sucesso.",
  status: "Status atualizado com sucesso.",
};

const ROTULO_INTEGRACAO: Record<EventoIntegracao["status"], string> = {
  PENDENTE: "Pendente",
  ENVIADO: "Enviado",
  FALHA: "Falha",
};

const COR_INTEGRACAO: Record<EventoIntegracao["status"], string> = {
  PENDENTE: "text-amber-700",
  ENVIADO: "text-marca-700",
  FALHA: "text-red-700",
};

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {rotulo}
      </dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default async function SolicitacaoPage({
  params,
  searchParams,
}: PageProps<"/solicitacoes/[id]">) {
  const { id } = await params;
  const { sucesso } = await searchParams;
  const solicitacao = await buscarSolicitacaoOu404(id);
  // Falha ao consultar integrações não deve impedir a exibição da solicitação.
  const integracoes = await api.listarIntegracoes(id).catch(() => null);

  const finalizada = STATUS_FINAIS.includes(solicitacao.status);
  const historico = [...(solicitacao.historico ?? [])].reverse();
  const mensagemSucesso =
    typeof sucesso === "string" ? MENSAGENS_SUCESSO[sucesso] : undefined;

  return (
    <div className="space-y-6">
      <Link
        href="/solicitacoes"
        className="text-sm font-medium text-marca-700 hover:underline"
      >
        ← Voltar para solicitações
      </Link>

      {mensagemSucesso && <AlertaSucesso mensagem={mensagemSucesso} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="cartao p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                  <StatusBadge status={solicitacao.status} />
                  <PrioridadeBadge prioridade={solicitacao.prioridade} />
                </div>
                <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900">
                  {solicitacao.titulo}
                </h1>
              </div>
              <div className="flex shrink-0 items-start gap-2">
                {!finalizada && (
                  <Link
                    href={`/solicitacoes/${id}/editar`}
                    className="botao-secundario"
                  >
                    Editar
                  </Link>
                )}
                <ExcluirButton acao={excluirSolicitacao.bind(null, id)} />
              </div>
            </div>

            <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <Campo rotulo="Solicitante">{solicitacao.solicitante}</Campo>
              <Campo rotulo="Área">{solicitacao.areaSolicitante}</Campo>
              <Campo rotulo="Data da solicitação">
                {formatarData(solicitacao.dataSolicitacao)}
              </Campo>
              <Campo rotulo="Última atualização">
                {formatarDataHora(solicitacao.atualizadoEm)}
              </Campo>
            </dl>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Descrição
              </h2>
              <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-slate-800">
                {solicitacao.descricao}
              </p>
            </div>
          </section>

          <section className="cartao p-6" aria-labelledby="titulo-analise">
            <h2 id="titulo-analise" className="mb-4 font-semibold text-slate-900">
              Análise e decisão
            </h2>
            {finalizada ? (
              <p className="text-sm text-slate-600">
                Esta solicitação foi{" "}
                <strong>{ROTULO_STATUS[solicitacao.status].toLowerCase()}</strong>{" "}
                e não aceita novas alterações de status.
              </p>
            ) : (
              <AlterarStatusForm
                status={solicitacao.status}
                acao={alterarStatus.bind(null, id)}
              />
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="cartao p-6" aria-labelledby="titulo-historico">
            <h2 id="titulo-historico" className="mb-4 font-semibold text-slate-900">
              Histórico
            </h2>
            <ol className="relative space-y-5 border-l border-slate-200 pl-5">
              {historico.map((h) => (
                <li key={h.id} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[26px] top-1 size-3 rounded-full border-2 border-white bg-marca-500 ring-1 ring-slate-200"
                  />
                  <p className="text-sm font-medium text-slate-900">
                    {h.statusAnterior
                      ? `${ROTULO_STATUS[h.statusAnterior]} → ${ROTULO_STATUS[h.statusNovo]}`
                      : "Solicitação registrada"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatarDataHora(h.criadoEm)}
                    {h.usuario && ` · por ${h.usuario.nome}`}
                  </p>
                  {h.comentario && (
                    <p className="mt-1 whitespace-pre-line break-words rounded-md bg-slate-50 p-2 text-sm text-slate-700">
                      {h.comentario}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {integracoes && integracoes.length > 0 && (
            <section className="cartao p-6" aria-labelledby="titulo-integracao">
              <h2 id="titulo-integracao" className="font-semibold text-slate-900">
                Integração com sistema externo
              </h2>
              <p className="mb-4 mt-1 text-xs text-slate-500">
                Notificação enviada de forma assíncrona após a aprovação.
              </p>
              <ul className="space-y-3 text-sm">
                {integracoes.map((e) => (
                  <li key={e.id} className="rounded-md border border-slate-100 p-3">
                    <p className={`font-medium ${COR_INTEGRACAO[e.status]}`}>
                      {ROTULO_INTEGRACAO[e.status]}
                      <span className="font-normal text-slate-500">
                        {" "}
                        · {e.tentativas} tentativa(s)
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {e.enviadoEm
                        ? `Entregue em ${formatarDataHora(e.enviadoEm)}`
                        : `Próxima tentativa: ${formatarDataHora(e.proximaTentativaEm)}`}
                    </p>
                    {e.ultimoErro && (
                      <p className="mt-1 text-xs text-red-700">{e.ultimoErro}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
