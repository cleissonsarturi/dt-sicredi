import Link from "next/link";
import { AlertaSucesso } from "@/components/alertas";
import { PrioridadeBadge, StatusBadge } from "@/components/badges";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { Paginacao } from "@/components/paginacao";
import { api } from "@/lib/api";
import { formatarData } from "@/lib/format";
import {
  PRIORIDADES,
  ROTULO_PRIORIDADE,
  ROTULO_STATUS,
  STATUS,
  type Prioridade,
  type Status,
} from "@/lib/types";

export const metadata = { title: "Solicitações" };

const TAMANHO_PAGINA = 10;

/** Lê um parâmetro da URL, aceitando apenas valores do domínio esperado. */
function valorPermitido<T extends string>(
  valor: string | string[] | undefined,
  permitidos: readonly T[],
): T | undefined {
  return typeof valor === "string" && permitidos.includes(valor as T)
    ? (valor as T)
    : undefined;
}

export default async function SolicitacoesPage({
  searchParams,
}: PageProps<"/solicitacoes">) {
  const params = await searchParams;
  const busca = typeof params.busca === "string" ? params.busca.trim() : "";
  const status = valorPermitido<Status>(params.status, STATUS);
  const prioridade = valorPermitido<Prioridade>(params.prioridade, PRIORIDADES);
  const ordem = valorPermitido(params.ordem, ["asc", "desc"] as const) ?? "desc";
  const pagina = Math.max(1, Number(params.pagina) || 1);

  const { dados, paginacao } = await api.listarSolicitacoes({
    busca: busca || undefined,
    status,
    prioridade,
    ordem,
    pagina,
    tamanhoPagina: TAMANHO_PAGINA,
  });

  const filtrando = Boolean(busca || status || prioridade);

  return (
    <>
      <CabecalhoPagina
        titulo="Solicitações"
        descricao="Consulte, filtre e acompanhe as solicitações registradas"
        acoes={
          <Link href="/solicitacoes/nova" className="botao-primario">
            Nova solicitação
          </Link>
        }
      />

      {params.sucesso === "excluida" && (
        <div className="mb-4">
          <AlertaSucesso mensagem="Solicitação excluída com sucesso." />
        </div>
      )}

      <form
        method="get"
        className="cartao mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
        role="search"
      >
        <div>
          <label htmlFor="busca" className="rotulo">
            Pesquisar
          </label>
          <input
            id="busca"
            name="busca"
            type="search"
            defaultValue={busca}
            maxLength={100}
            placeholder="Título, descrição, solicitante ou área"
            className="campo"
          />
        </div>
        <div>
          <label htmlFor="status" className="rotulo">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="campo"
          >
            <option value="">Todos</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {ROTULO_STATUS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="prioridade" className="rotulo">
            Prioridade
          </label>
          <select
            id="prioridade"
            name="prioridade"
            defaultValue={prioridade ?? ""}
            className="campo"
          >
            <option value="">Todas</option>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {ROTULO_PRIORIDADE[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ordem" className="rotulo">
            Ordenar por data
          </label>
          <select id="ordem" name="ordem" defaultValue={ordem} className="campo">
            <option value="desc">Mais recentes</option>
            <option value="asc">Mais antigas</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="botao-primario w-full lg:w-auto">
            Filtrar
          </button>
          {filtrando && (
            <Link href="/solicitacoes" className="botao-secundario">
              Limpar
            </Link>
          )}
        </div>
      </form>

      <div className="cartao overflow-hidden">
        {dados.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-slate-700">
              Nenhuma solicitação encontrada
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {filtrando
                ? "Ajuste os filtros ou limpe a pesquisa."
                : "Cadastre a primeira solicitação para começar."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Solicitação
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Área
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Prioridade
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dados.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="max-w-md px-4 py-3">
                      <Link
                        href={`/solicitacoes/${s.id}`}
                        className="font-medium text-slate-900 hover:text-marca-700 hover:underline"
                      >
                        {s.titulo}
                      </Link>
                      <p className="text-xs text-slate-500">{s.solicitante}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.areaSolicitante}
                    </td>
                    <td className="px-4 py-3">
                      <PrioridadeBadge prioridade={s.prioridade} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatarData(s.dataSolicitacao)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4">
        <Paginacao
          pagina={paginacao.pagina}
          totalPaginas={paginacao.totalPaginas}
          total={paginacao.total}
          params={{ busca, status, prioridade, ordem }}
        />
      </div>
    </>
  );
}
