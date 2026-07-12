import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { LinkButton } from "../components/ui/Button";
import { FormInput } from "../components/ui/FormInput";
import { listAlzheimerArticles } from "../services/ehealth";
import type { ArtigoAlzheimer } from "../types/api";

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
  const [articleFilterInput, setArticleFilterInput] = useState("");
  const [articleFilter, setArticleFilter] = useState("");
  const [articles, setArticles] = useState<ArtigoAlzheimer[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setArticleFilter(articleFilterInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [articleFilterInput]);

  useEffect(() => {
    async function loadArticles() {
      setArticlesLoading(true);
      setArticlesError("");

      try {
        const data = await listAlzheimerArticles({
          q: articleFilter || undefined,
          limit: 100,
        });
        setArticles(data);
      } catch {
        setArticlesError(
          "Não foi possível carregar os artigos no momento. Tente novamente em instantes.",
        );
      } finally {
        setArticlesLoading(false);
      }
    }

    void loadArticles();
  }, [articleFilter]);

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

      <Card className="lg:col-span-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700 theme-dark:text-amber-300">
              Biblioteca de apoio
            </p>
            <h3 className="mt-2 text-2xl text-slate-900 theme-dark:text-slate-100 sm:text-3xl">
              Artigos sobre a Doença de Alzheimer
            </h3>
            <p className="mt-2 text-sm text-slate-600 theme-dark:text-slate-300">
              Filtre por palavra-chave e abra a fonte completa clicando no
              título do artigo.
            </p>
          </div>

          <div className="w-full sm:max-w-sm">
            <label
              htmlFor="article-filter"
              className="text-sm font-medium text-slate-700 theme-dark:text-slate-200"
            >
              Filtrar artigos
            </label>
            <FormInput
              id="article-filter"
              type="search"
              placeholder="Ex.: diagnóstico, sintomas, cuidado"
              value={articleFilterInput}
              onChange={(event) => setArticleFilterInput(event.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        {articlesLoading ? (
          <p className="mt-5 text-sm text-slate-600 theme-dark:text-slate-300">
            Carregando artigos...
          </p>
        ) : null}

        {!articlesLoading && articlesError ? (
          <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 theme-dark:border-rose-900/40 theme-dark:bg-rose-900/20 theme-dark:text-rose-200">
            {articlesError}
          </p>
        ) : null}

        {!articlesLoading && !articlesError && articles.length === 0 ? (
          <p className="mt-5 text-sm text-slate-600 theme-dark:text-slate-300">
            Nenhum artigo encontrado para o filtro informado.
          </p>
        ) : null}

        {!articlesLoading && !articlesError && articles.length > 0 ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 theme-dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 text-left theme-dark:divide-slate-700">
              <thead className="bg-slate-50 theme-dark:bg-slate-800/80">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 theme-dark:text-slate-300">
                    Título
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 theme-dark:text-slate-300">
                    Link
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white theme-dark:divide-slate-700 theme-dark:bg-slate-900/70">
                {articles.map((article) => (
                  <tr key={article.id_artigo}>
                    <td className="px-4 py-3 align-top">
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-teal-700 underline decoration-teal-300 underline-offset-4 transition hover:text-teal-900 theme-dark:text-teal-300 theme-dark:decoration-teal-500/60 theme-dark:hover:text-teal-200"
                      >
                        {article.titulo}
                      </a>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600 theme-dark:text-slate-300">
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-slate-600 hover:text-slate-900 theme-dark:text-slate-300 theme-dark:hover:text-slate-100"
                      >
                        {article.link}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
