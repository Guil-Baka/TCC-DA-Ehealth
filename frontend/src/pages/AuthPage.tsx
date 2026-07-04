import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FormField } from "../components/ui/FormField";
import { FormInput } from "../components/ui/FormInput";

export function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        await register({ nome, email, password });
      } else {
        await login({ email, password });
      }
      navigate("/dashboard", { replace: true });
    } catch {
      setError(
        "Não foi possível autenticar. Verifique seus dados e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl gap-8 rounded-3xl border border-teal-200/70 bg-white/80 p-6 shadow-[0_24px_80px_-30px_rgba(13,148,136,0.55)] backdrop-blur theme-dark:border-slate-700 theme-dark:bg-slate-900/80 theme-dark:shadow-[0_24px_80px_-30px_rgba(2,6,23,0.95)] sm:p-10 lg:grid-cols-[1.15fr_1fr]">
        <article className="rounded-3xl bg-gradient-to-br from-teal-700 via-cyan-700 to-sky-800 p-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100">
            Cuidado com presença
          </p>
          <h1 className="mt-3 text-4xl">
            O primeiro passo para cuidar de quem você ama
          </h1>
          <p className="mt-4 text-sm text-cyan-50">
            Aqui você encontra um espaço acolhedor para organizar a rotina,
            respirar com mais tranquilidade e seguir com segurança no cuidado
            diário.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-cyan-100">
            <li>Mais clareza para acompanhar cada dia com carinho.</li>
            <li>Lembretes e registros para aliviar a sobrecarga mental.</li>
            <li>Um apoio simples para você não cuidar sozinho(a).</li>
          </ul>
        </article>

        <Card>
          <div className="mb-5">
            <div className="relative grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1 theme-dark:border-slate-700 theme-dark:bg-slate-800">
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-teal-600 shadow-sm transition-transform duration-200 ${
                  mode === "register" ? "translate-x-full" : "translate-x-0"
                }`}
              />
              <button
                type="button"
                className={`relative z-10 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === "login"
                    ? "text-white"
                    : "text-slate-700 theme-dark:text-slate-300"
                }`}
                onClick={() => setMode("login")}
                aria-pressed={mode === "login"}
              >
                Login
              </button>
              <button
                type="button"
                className={`relative z-10 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === "register"
                    ? "text-white"
                    : "text-slate-700 theme-dark:text-slate-300"
                }`}
                onClick={() => setMode("register")}
                aria-pressed={mode === "register"}
              >
                Cadastro
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === "register" && (
              <FormField label="Nome completo">
                <FormInput
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </FormField>
            )}

            <FormField label="E-mail">
              <FormInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <FormField label="Senha">
              <FormInput
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>

            <Button type="submit" disabled={loading} fullWidth>
              {mode === "register" ? (
                <UserPlus size={16} />
              ) : (
                <LogIn size={16} />
              )}
              {loading
                ? "Processando..."
                : mode === "register"
                  ? "Criar conta"
                  : "Entrar"}
            </Button>
          </form>

          {error && (
            <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 theme-dark:bg-rose-900/20 theme-dark:text-rose-300">
              {error}
            </p>
          )}
        </Card>
      </div>
    </section>
  );
}
