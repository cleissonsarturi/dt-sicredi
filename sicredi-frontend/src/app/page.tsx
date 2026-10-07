import Link from "next/link";
import { StatusBadge, PrioridadeBadge } from "@/components/badges";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { api } from "@/lib/api";
import { formatarData, percentual } from "@/lib/format";
import {
  PRIORIDADES,
  ROTULO_PRIORIDADE,
  ROTULO_STATUS,
  STATUS,
  type Status,
} from "@/lib/types";

export const metadata = { title: "Dashboard" };

const COR_BARRA_STATUS: Record<Status, string> = {
  ABERTA: "bg-sky-500",
  EM_ANALISE: "bg-amber-400",
  APROVADA: "bg-marca-500",
  REJEITADA: "bg-red-500",
};

const COR_BARRA_PRIORIDADE = {
  BAIXA: "bg-slate-400",
  MEDIA: "bg-orange-400",
  ALTA: "bg-red-500",
} as const;

function Indicador({
  rotulo,
  valor,
  detalhe,
  destaque,
  href,
}: {
  rotulo: string;
  valor: number;
  detalhe?: string;
  destaque: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`cartao border-l-4 p-5 transition hover:shadow-md ${destaque}`}
    >
      <p className="text-sm font-medium text-slate-500">{rotulo}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-slate-500">{detalhe}</p>}
    </Link>
  );
}

export default async function DashboardPage() {
  const [resumo, recentes] = await Promise.all([
    api.resumoDashboard(),
    api.listarSolicitacoes({ tamanhoPagina: 5 }),
  ]);
  const { total, porStatus, porPrioridade } = resumo;
  const decididas = porStatus.APROVADA + porStatus.REJEITADA;
  const maiorPrioridade = Math.max(1, ...Object.values(porPrioridade));

  return (
    <>
      <CabecalhoPagina
        titulo="Dashboard"
        descricao="Visão geral das solicitações internas"
        acoes={
          <Link href="/solicitacoes/nova" className="botao-primario">
            Nova solicitação
          </Link>
        }
      />

      <section
        aria-label="Indicadores"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Indicador
          rotulo="Total de solicitações"
          valor={total}
          destaque="border-l-marca-700"
          href="/solicitacoes"
        />
        <Indicador
          rotulo="Abertas"
          valor={porStatus.ABERTA}
          detalhe={`+ ${porStatus.EM_ANALISE} em análise`}
          destaque="border-l-sky-500"
          href="/solicitacoes?status=ABERTA"
        />
        <Indicador
          rotulo="Aprovadas"
          valor={porStatus.APROVADA}
          detalhe={`${percentual(porStatus.APROVADA, decididas)}% das decididas`}
          destaque="border-l-marca-500"
          href="/solicitacoes?status=APROVADA"
        />
        <Indicador
          rotulo="Rejeitadas"
          valor={porStatus.REJEITADA}
          detalhe={`${percentual(porStatus.REJEITADA, decididas)}% das decididas`}
          destaque="border-l-red-500"
          href="/solicitacoes?status=REJEITADA"
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="cartao p-5" aria-labelledby="titulo-prioridade">
          <h2 id="titulo-prioridade" className="font-semibold text-slate-900">
            Distribuição por prioridade
          </h2>
          <ul className="mt-4 space-y-4">
            {PRIORIDADES.map((p) => (
              <li key={p}>
                <div className="mb-1 flex justify-between text-sm">
                  <Link
                    href={`/solicitacoes?prioridade=${p}`}
                    className="font-medium text-slate-700 hover:underline"
                  >
                    {ROTULO_PRIORIDADE[p]}
                  </Link>
                  <span className="text-slate-500">
                    {porPrioridade[p]} ({percentual(porPrioridade[p], total)}%)
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${COR_BARRA_PRIORIDADE[p]}`}
                    style={{
                      width: `${(porPrioridade[p] / maiorPrioridade) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="cartao p-5" aria-labelledby="titulo-status">
          <h2 id="titulo-status" className="font-semibold text-slate-900">
            Distribuição por status
          </h2>
          <div
            className="mt-4 flex h-4 overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label={STATUS.map(
              (s) => `${ROTULO_STATUS[s]}: ${porStatus[s]}`,
            ).join(", ")}
          >
            {STATUS.map((s) => (
              <div
                key={s}
                className={COR_BARRA_STATUS[s]}
                style={{ width: `${percentual(porStatus[s], total)}%` }}
              />
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {STATUS.map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`size-3 rounded-sm ${COR_BARRA_STATUS[s]}`}
                />
                <span className="text-slate-700">{ROTULO_STATUS[s]}</span>
                <span className="ml-auto font-medium text-slate-900">
                  {porStatus[s]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="cartao mt-6" aria-labelledby="titulo-recentes">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="titulo-recentes" className="font-semibold text-slate-900">
            Solicitações recentes
          </h2>
          <Link
            href="/solicitacoes"
            className="text-sm font-medium text-marca-700 hover:underline"
          >
            Ver todas
          </Link>
        </div>
        {recentes.dados.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            Nenhuma solicitação cadastrada.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentes.dados.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/solicitacoes/${s.id}`}
                  className="flex flex-col gap-2 px-5 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {s.titulo}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.solicitante} · {s.areaSolicitante} ·{" "}
                      {formatarData(s.dataSolicitacao)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <PrioridadeBadge prioridade={s.prioridade} />
                    <StatusBadge status={s.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
