export function AlertaErro({
  mensagens,
  titulo = "Não foi possível concluir a operação",
}: {
  mensagens: string[];
  titulo?: string;
}) {
  if (mensagens.length === 0) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <p className="font-semibold">{titulo}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {mensagens.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

export function AlertaSucesso({ mensagem }: { mensagem: string }) {
  return (
    <div
      role="status"
      className="rounded-md border border-marca-100 bg-marca-50 px-4 py-3 text-sm font-medium text-marca-700"
    >
      {mensagem}
    </div>
  );
}
