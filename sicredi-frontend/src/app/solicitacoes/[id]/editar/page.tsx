import Link from "next/link";
import { AlertaErro } from "@/components/alertas";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { SolicitacaoForm } from "@/components/solicitacao-form";
import { buscarSolicitacaoOu404 } from "@/lib/api";
import { ROTULO_STATUS, STATUS_FINAIS } from "@/lib/types";
import { atualizarSolicitacao } from "../../actions";

export const metadata = { title: "Editar solicitação" };

export default async function EditarSolicitacaoPage({
  params,
}: PageProps<"/solicitacoes/[id]/editar">) {
  const { id } = await params;
  const solicitacao = await buscarSolicitacaoOu404(id);

  const finalizada = STATUS_FINAIS.includes(solicitacao.status);

  return (
    <div className="mx-auto max-w-3xl">
      <CabecalhoPagina titulo="Editar solicitação" descricao={solicitacao.titulo} />
      <div className="cartao p-6">
        {finalizada ? (
          <div className="space-y-4">
            <AlertaErro
              titulo="Edição indisponível"
              mensagens={[
                `Solicitações com status ${ROTULO_STATUS[solicitacao.status]} não podem ser editadas.`,
              ]}
            />
            <Link href={`/solicitacoes/${id}`} className="botao-secundario">
              Voltar
            </Link>
          </div>
        ) : (
          <SolicitacaoForm
            acao={atualizarSolicitacao.bind(null, id)}
            inicial={solicitacao}
            textoBotao="Salvar alterações"
            cancelarHref={`/solicitacoes/${id}`}
          />
        )}
      </div>
    </div>
  );
}
