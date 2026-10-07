import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="cartao mx-auto max-w-lg p-8 text-center">
      <p className="text-sm font-semibold text-marca-700">404</p>
      <h1 className="mt-1 text-lg font-semibold text-slate-900">
        Página não encontrada
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        A solicitação pode ter sido excluída ou o endereço está incorreto.
      </p>
      <Link href="/solicitacoes" className="botao-primario mt-6">
        Ir para solicitações
      </Link>
    </div>
  );
}
