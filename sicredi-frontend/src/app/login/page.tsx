import { AlertaSucesso } from "@/components/alertas";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { sessao } = await searchParams;

  return (
    <div className="mx-auto max-w-sm space-y-4 pt-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Entrar
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Acesse com seu e-mail e senha para gerenciar as solicitações.
        </p>
      </div>
      {sessao === "expirada" && (
        <AlertaSucesso mensagem="Sua sessão expirou. Entre novamente." />
      )}
      <div className="cartao p-6">
        <LoginForm />
      </div>
    </div>
  );
}
