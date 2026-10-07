import Link from "next/link";

interface Props {
  pagina: number;
  totalPaginas: number;
  total: number;
  params: Record<string, string | undefined>;
}

function hrefPagina(params: Props["params"], pagina: number) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  qs.set("pagina", String(pagina));
  return `/solicitacoes?${qs}`;
}

export function Paginacao({ pagina, totalPaginas, total, params }: Props) {
  if (totalPaginas <= 1) {
    return <p className="text-sm text-slate-500">{total} resultado(s)</p>;
  }

  const classe = "botao-secundario px-3 py-1.5";
  const desabilitado = "pointer-events-none opacity-50";

  return (
    <nav
      className="flex items-center justify-between gap-4"
      aria-label="Paginação"
    >
      <p className="text-sm text-slate-500">
        {total} resultado(s) · página {pagina} de {totalPaginas}
      </p>
      <div className="flex gap-2">
        <Link
          href={hrefPagina(params, pagina - 1)}
          aria-disabled={pagina <= 1}
          className={`${classe} ${pagina <= 1 ? desabilitado : ""}`}
        >
          Anterior
        </Link>
        <Link
          href={hrefPagina(params, pagina + 1)}
          aria-disabled={pagina >= totalPaginas}
          className={`${classe} ${pagina >= totalPaginas ? desabilitado : ""}`}
        >
          Próxima
        </Link>
      </div>
    </nav>
  );
}
