"use client";

import { useEffect } from "react";

/**
 * Error boundary das rotas. Em produção o Next.js não repassa a mensagem de
 * erros do servidor ao navegador, por isso o texto é genérico.
 */
export default function ErroPagina({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="cartao mx-auto max-w-lg p-8 text-center">
      <h1 className="text-lg font-semibold text-slate-900">
        Não foi possível carregar esta página
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        O serviço pode estar temporariamente indisponível. Verifique se a API
        está em execução e tente novamente.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-slate-400">
          Código: {error.digest}
        </p>
      )}
      <button type="button" onClick={() => retry()} className="botao-primario mt-6">
        Tentar novamente
      </button>
    </div>
  );
}
