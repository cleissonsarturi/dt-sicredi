import type { ReactNode } from "react";

export function CabecalhoPagina({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: ReactNode;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {titulo}
        </h1>
        {descricao && <p className="mt-1 text-sm text-slate-600">{descricao}</p>}
      </div>
      {acoes && <div className="flex gap-2">{acoes}</div>}
    </div>
  );
}
