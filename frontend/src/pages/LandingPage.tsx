import {
  ArrowRight,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { LinkButton } from "../components/ui/Button";

const features = [
  {
    icon: HeartHandshake,
    title: "Cuidado humanizado",
    text: "Um ambiente pensado para acolher familiares e transformar rotina de cuidado em um processo mais leve.",
  },
  {
    icon: Sparkles,
    title: "Rotina mais tranquila",
    text: "Agenda assistiva, registros e indicadores para reduzir esquecimentos e apoiar decisões no dia a dia.",
  },
  {
    icon: ShieldCheck,
    title: "Privacidade em primeiro lugar",
    text: "Dados tratados com responsabilidade, com foco em minimização e boas práticas de segurança.",
  },
];

export function LandingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <section className="relative overflow-hidden rounded-[2rem] border border-amber-200/80 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 p-8 shadow-[0_30px_120px_-40px_rgba(146,64,14,0.55)] theme-dark:border-slate-700 theme-dark:from-slate-900 theme-dark:via-slate-900 theme-dark:to-slate-800 theme-dark:shadow-[0_30px_120px_-40px_rgba(2,6,23,0.95)] sm:p-12 lg:p-14">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-rose-300/20 blur-3xl" />

        <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
          <div className="space-y-6">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-amber-800 theme-dark:text-amber-300">
              Plataforma de apoio ao cuidador
            </p>
            <h1 className="text-4xl leading-tight text-slate-900 theme-dark:text-slate-100 sm:text-5xl sm:leading-tight">
              Um lugar acolhedor, seguro e claro para cuidar de quem você ama.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-700 theme-dark:text-slate-300 sm:text-lg sm:leading-relaxed">
              Reunimos informação confiável, agenda assistiva e acompanhamento
              clínico em uma experiência acolhedora, feita para famílias que
              convivem com Alzheimer.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 sm:gap-5">
              <LinkButton to="/auth" variant="secondary" size="lg">
                Entrar na plataforma
                <ArrowRight size={16} />
              </LinkButton>
              <LinkButton to="/auth" variant="outline" size="lg">
                Criar conta de cuidador
              </LinkButton>
            </div>
          </div>

          <article className="rounded-3xl border border-amber-200/80 bg-white/80 p-6 shadow-xl shadow-amber-200/40 backdrop-blur theme-dark:border-slate-700 theme-dark:bg-slate-900/80 theme-dark:shadow-slate-900/40 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700 theme-dark:text-amber-300">
              O que você encontra aqui
            </p>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed text-slate-700 theme-dark:text-slate-300">
              <li>Dashboard com evolução clínica e comportamental.</li>
              <li>Agenda de medicamentos com rotina estruturada.</li>
              <li>Registro contínuo de sintomas para acompanhamento.</li>
              <li>Acesso rápido para familiares e cuidadores.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-3 lg:mt-12 lg:gap-6">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-[0_20px_50px_-30px_rgba(30,41,59,0.45)] theme-dark:border-slate-700 theme-dark:bg-slate-900/80"
          >
            <feature.icon
              className="text-amber-700 theme-dark:text-amber-300"
              size={20}
            />
            <h2 className="mt-4 text-2xl text-slate-900 theme-dark:text-slate-100">
              {feature.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 theme-dark:text-slate-300">
              {feature.text}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
