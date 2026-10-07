import {
  ROTULO_PRIORIDADE,
  ROTULO_STATUS,
  type Prioridade,
  type Status,
} from "@/lib/types";

const CORES_STATUS: Record<Status, string> = {
  ABERTA: "bg-sky-50 text-sky-700 ring-sky-600/20",
  EM_ANALISE: "bg-amber-50 text-amber-800 ring-amber-600/20",
  APROVADA: "bg-marca-50 text-marca-700 ring-marca-600/20",
  REJEITADA: "bg-red-50 text-red-700 ring-red-600/20",
};

const CORES_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: "bg-slate-100 text-slate-600 ring-slate-500/20",
  MEDIA: "bg-orange-50 text-orange-700 ring-orange-600/20",
  ALTA: "bg-red-50 text-red-700 ring-red-600/20",
};

const BASE =
  "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`${BASE} ${CORES_STATUS[status]}`}>
      {ROTULO_STATUS[status]}
    </span>
  );
}

export function PrioridadeBadge({ prioridade }: { prioridade: Prioridade }) {
  return (
    <span className={`${BASE} ${CORES_PRIORIDADE[prioridade]}`}>
      {ROTULO_PRIORIDADE[prioridade]}
    </span>
  );
}
