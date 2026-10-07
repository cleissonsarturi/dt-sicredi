import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { SolicitacaoForm } from "@/components/solicitacao-form";
import { usuarioDaSessao } from "@/lib/sessao";
import { criarSolicitacao } from "../actions";

export const metadata = { title: "Nova solicitação" };

export default async function NovaSolicitacaoPage() {
  const usuario = await usuarioDaSessao();

  return (
    <div className="mx-auto max-w-3xl">
      <CabecalhoPagina
        titulo="Nova solicitação"
        descricao="A solicitação será registrada com status Aberta."
      />
      <div className="cartao p-6">
        <SolicitacaoForm
          acao={criarSolicitacao}
          inicial={{ solicitante: usuario?.nome }}
          textoBotao="Cadastrar solicitação"
          cancelarHref="/solicitacoes"
        />
      </div>
    </div>
  );
}
