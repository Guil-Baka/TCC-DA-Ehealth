import { Card } from "../components/ui/Card";
import { LinkButton } from "../components/ui/Button";

const highlights = [
  {
    title: "Informação clara e acessível",
    text: "Conteúdo direcionado para familiares sobre sintomas, evolução e manejo cotidiano da doença.",
  },
  {
    title: "Gestão assistiva de medicamentos",
    text: "Agenda com horários e dosagens para apoiar adesão terapêutica e reduzir esquecimentos.",
  },
  {
    title: "Acompanhamento clínico contínuo",
    text: "Painel com métricas e gráficos para leitura da evolução cognitiva, comportamental e de humor.",
  },
];

export function HomePage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
      <Card className="bg-white/80 shadow-xl shadow-slate-200/60 theme-dark:bg-slate-900/80 theme-dark:shadow-slate-900/70">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-rose-600 theme-dark:text-rose-300">
          Missão da plataforma
        </p>
        <h2 className="mt-3 text-3xl text-slate-900 theme-dark:text-slate-100 sm:text-4xl">
          Conectar cuidado familiar, educação em saúde e dados para decisão.
        </h2>
        <p className="mt-4 text-slate-600 theme-dark:text-slate-300">
          A Doença de Alzheimer exige suporte multiprofissional e rotina
          estruturada. Esta plataforma foi planejada para facilitar o acesso a
          informações confiáveis, melhorar o controle dos sintomas e apoiar
          cuidadores com ferramentas digitais.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton to="/dashboard" variant="primary">
            Abrir dashboard
          </LinkButton>
          <LinkButton to="/agenda" variant="outline">
            Ir para agenda assistiva
          </LinkButton>
        </div>
      </Card>

      <aside className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-rose-50 to-white p-6 shadow-xl shadow-amber-200/40 theme-dark:border-slate-700 theme-dark:from-slate-900 theme-dark:via-slate-900 theme-dark:to-slate-800 theme-dark:shadow-slate-900/70">
        <h3 className="text-2xl text-slate-900 theme-dark:text-slate-100">
          Diretrizes de privacidade
        </h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-700 theme-dark:text-slate-300">
          <li>
            Coleta apenas dados essenciais para suporte clínico e
            acompanhamento.
          </li>
          <li>
            Visualizações com códigos anônimos para reduzir exposição de
            informações sensíveis.
          </li>
          <li>
            Processos alinhados com princípios de minimização e segurança
            previstos na LGPD.
          </li>
        </ul>
      </aside>

      <div className="grid gap-4 lg:col-span-2 md:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item.title} className="rounded-2xl p-5">
            <h3 className="text-xl text-slate-900 theme-dark:text-slate-100">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 theme-dark:text-slate-300">
              {item.text}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
