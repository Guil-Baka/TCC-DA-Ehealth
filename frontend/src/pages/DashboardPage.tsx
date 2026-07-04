import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { anonymizePacienteId } from "../utils/anonymize";
import { listAgendas, listPacientes, listRegistros } from "../services/ehealth";

type ReportMode = "geral" | "paciente";

function splitSymptoms(value: string) {
  return value
    .split(/[;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getLocalDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalDateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const moodPalette = [
  "#0f766e",
  "#f97316",
  "#f43f5e",
  "#1d4ed8",
  "#7c3aed",
  "#65a30d",
];

const symptomPalette = ["#0f766e", "#0ea5e9", "#f97316"];
const symptomCategoryColor: Record<string, string> = {
  Cognitivo: "#0f766e",
  Comportamental: "#0ea5e9",
  Funcional: "#f97316",
};

export function DashboardPage() {
  const dashboardRef = useRef<HTMLElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [reportMode, setReportMode] = useState<ReportMode>("geral");
  const [selectedPacienteId, setSelectedPacienteId] = useState<number>(0);
  const [pacientes, setPacientes] = useState<
    { id_paciente: number; iniciais: string }[]
  >([]);
  const [agendas, setAgendas] = useState<{ id_paciente: number }[]>([]);
  const [registros, setRegistros] = useState<
    {
      id_paciente: number;
      data_registro: string;
      sintomas_cognitivos: string;
      sintomas_comportamentais: string;
      sintomas_motores: string;
      nivel_humor: string;
    }[]
  >([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [pacientes, agenda, registros] = await Promise.all([
          listPacientes(),
          listAgendas(),
          listRegistros(),
        ]);

        setPacientes(pacientes);
        setAgendas(agenda);
        setRegistros(registros);
        if (pacientes.length) {
          setSelectedPacienteId(pacientes[0].id_paciente);
        }
      } catch {
        setError(
          "Não foi possível carregar os dados do dashboard. Verifique a conexão com a API.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const selectedPaciente = useMemo(
    () => pacientes.find((item) => item.id_paciente === selectedPacienteId),
    [pacientes, selectedPacienteId],
  );

  const filteredRegistros = useMemo(() => {
    if (reportMode === "geral") return registros;
    return registros.filter((item) => item.id_paciente === selectedPacienteId);
  }, [registros, reportMode, selectedPacienteId]);

  const filteredAgendas = useMemo(() => {
    if (reportMode === "geral") return agendas;
    return agendas.filter((item) => item.id_paciente === selectedPacienteId);
  }, [agendas, reportMode, selectedPacienteId]);

  const stats = useMemo(
    () => ({
      pacientes:
        reportMode === "geral" ? pacientes.length : selectedPaciente ? 1 : 0,
      agenda: filteredAgendas.length,
      registros: filteredRegistros.length,
    }),
    [
      filteredAgendas.length,
      filteredRegistros.length,
      pacientes.length,
      reportMode,
      selectedPaciente,
    ],
  );

  const moodData = useMemo(() => {
    const moodCounter = filteredRegistros.reduce<Record<string, number>>(
      (acc, item) => {
        const key = item.nivel_humor.trim().toLowerCase() || "não informado";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {},
    );

    return Object.entries(moodCounter)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRegistros]);

  const registroPorData = useMemo(() => {
    const byDayCounter = filteredRegistros.reduce<Record<string, number>>(
      (acc, item) => {
        const key = getLocalDateKey(item.data_registro);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {},
    );

    return Object.entries(byDayCounter)
      .map(([isoDate, total]) => {
        const date = new Date(`${isoDate}T00:00:00`);
        return {
          isoDate,
          data: date.toLocaleDateString("pt-BR"),
          total,
        };
      })
      .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
      .slice(-14)
      .map(({ data, total }) => ({ data, total }));
  }, [filteredRegistros]);

  const symptomTypeData = useMemo(() => {
    const cognitivos = filteredRegistros.reduce(
      (acc, item) => acc + splitSymptoms(item.sintomas_cognitivos).length,
      0,
    );
    const comportamentais = filteredRegistros.reduce(
      (acc, item) => acc + splitSymptoms(item.sintomas_comportamentais).length,
      0,
    );
    const funcionais = filteredRegistros.reduce(
      (acc, item) => acc + splitSymptoms(item.sintomas_motores).length,
      0,
    );

    return [
      { tipo: "Cognitivos", total: cognitivos },
      { tipo: "Comportamentais", total: comportamentais },
      { tipo: "Funcionais", total: funcionais },
    ];
  }, [filteredRegistros]);

  const topSymptomsData = useMemo(() => {
    const counter: Record<
      string,
      { sintoma: string; total: number; categoria: string }
    > = {};

    const include = (items: string[], categoria: string) => {
      items.forEach((sintoma) => {
        const normalized = sintoma.trim();
        if (!normalized) return;
        const key = `${categoria}:${normalized.toLowerCase()}`;
        if (!counter[key]) {
          counter[key] = { sintoma: normalized, total: 0, categoria };
        }
        counter[key].total += 1;
      });
    };

    filteredRegistros.forEach((registro) => {
      include(splitSymptoms(registro.sintomas_cognitivos), "Cognitivo");
      include(
        splitSymptoms(registro.sintomas_comportamentais),
        "Comportamental",
      );
      include(splitSymptoms(registro.sintomas_motores), "Funcional");
    });

    return Object.values(counter)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredRegistros]);

  const adesao = useMemo(() => {
    if (!stats.pacientes) return 0;
    return Math.round((stats.agenda / stats.pacientes) * 100);
  }, [stats]);

  const scopeLabel =
    reportMode === "geral"
      ? "Visão geral"
      : selectedPaciente
        ? `${selectedPaciente.iniciais} (${anonymizePacienteId(selectedPaciente.id_paciente)})`
        : "Paciente";

  async function onExportPdf() {
    if (!dashboardRef.current) return;

    setExportingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const date = getLocalDateStamp();
      const scopeName =
        reportMode === "geral"
          ? "geral"
          : `paciente-${selectedPacienteId || "selecionado"}`;

      pdf.save(`dashboard-${scopeName}-${date}.pdf`);
    } catch {
      setError("Não foi possível exportar o dashboard em PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void onExportPdf()}
          disabled={exportingPdf || loading}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exportingPdf ? "Gerando PDF..." : "Exportar dashboard em PDF"}
        </button>
      </div>

      <section ref={dashboardRef} className="space-y-6">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm theme-dark:border-slate-700 theme-dark:bg-slate-900">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="block text-sm font-medium text-slate-700 theme-dark:text-slate-200">
              Tipo de relatório
              <select
                value={reportMode}
                onChange={(event) =>
                  setReportMode(event.target.value as ReportMode)
                }
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-teal-500 focus:ring theme-dark:border-slate-600 theme-dark:bg-slate-800 theme-dark:text-slate-100"
              >
                <option value="geral">Relatório geral</option>
                <option value="paciente">Relatório por paciente</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700 theme-dark:text-slate-200">
              Paciente
              <select
                value={selectedPacienteId || ""}
                onChange={(event) =>
                  setSelectedPacienteId(Number(event.target.value))
                }
                disabled={reportMode !== "paciente"}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-teal-500 focus:ring disabled:cursor-not-allowed disabled:opacity-60 theme-dark:border-slate-600 theme-dark:bg-slate-800 theme-dark:text-slate-100"
              >
                {pacientes.map((paciente) => (
                  <option
                    key={paciente.id_paciente}
                    value={paciente.id_paciente}
                  >
                    {paciente.iniciais} (
                    {anonymizePacienteId(paciente.id_paciente)})
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 theme-dark:border-teal-900 theme-dark:bg-teal-950/30 theme-dark:text-teal-200">
              Escopo: {scopeLabel}
            </div>
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Pacientes ativos"
            value={stats.pacientes}
            subtitle={
              reportMode === "geral"
                ? "Cadastros vinculados ao sistema"
                : "Paciente selecionado para análise"
            }
          />
          <MetricCard
            title="Agenda assistiva"
            value={stats.agenda}
            subtitle="Lembretes de medicação no escopo filtrado"
          />
          <MetricCard
            title="Registros de sintomas"
            value={stats.registros}
            subtitle="Entradas clínicas no escopo filtrado"
          />
          <MetricCard
            title="Cobertura de agenda"
            value={`${adesao}%`}
            subtitle="Razão lembretes/paciente"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm theme-dark:border-slate-700 theme-dark:bg-slate-900">
            <h2 className="text-2xl text-slate-900 theme-dark:text-slate-100">
              Evolução de registros (últimos dias)
            </h2>
            <p className="mt-2 text-sm text-slate-600 theme-dark:text-slate-300">
              Visualizacao por data considerando o escopo selecionado.
            </p>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={registroPorData}
                  margin={{ left: 0, right: 18, top: 16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis
                    dataKey="data"
                    tick={{ fill: "#475569", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#475569", fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0f766e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm theme-dark:border-slate-700 theme-dark:bg-slate-900">
            <h2 className="text-2xl text-slate-900 theme-dark:text-slate-100">
              Distribuição de humor
            </h2>
            <p className="mt-2 text-sm text-slate-600 theme-dark:text-slate-300">
              Classificação baseada no campo nível_humor dos registros
              filtrados.
            </p>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moodData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    innerRadius={55}
                  >
                    {moodData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={moodPalette[index % moodPalette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm theme-dark:border-slate-700 theme-dark:bg-slate-900">
            <h2 className="text-2xl text-slate-900 theme-dark:text-slate-100">
              Ocorrência por tipo de sintoma
            </h2>
            <p className="mt-2 text-sm text-slate-600 theme-dark:text-slate-300">
              Soma de sintomas marcados por categoria: cognitivos,
              comportamentais e funcionais.
            </p>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={symptomTypeData}
                  margin={{ left: 0, right: 18, top: 16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis
                    dataKey="tipo"
                    tick={{ fill: "#475569", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#475569", fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {symptomTypeData.map((entry, index) => (
                      <Cell
                        key={entry.tipo}
                        fill={symptomPalette[index % symptomPalette.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm theme-dark:border-slate-700 theme-dark:bg-slate-900">
            <h2 className="text-2xl text-slate-900 theme-dark:text-slate-100">
              Sintomas com maior ocorrência
            </h2>
            <p className="mt-2 text-sm text-slate-600 theme-dark:text-slate-300">
              Ranking dos 10 sintomas mais frequentes no escopo selecionado.
            </p>
            <div className="mt-4 h-[26rem]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSymptomsData}
                  layout="vertical"
                  margin={{ left: 12, right: 18, top: 16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: "#475569", fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="sintoma"
                    width={240}
                    tick={{ fill: "#475569", fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                    {topSymptomsData.map((entry) => (
                      <Cell
                        key={`${entry.categoria}-${entry.sintoma}`}
                        fill={
                          symptomCategoryColor[entry.categoria] ?? "#0f766e"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>

        {loading && (
          <p className="text-slate-600 theme-dark:text-slate-300">
            Atualizando métricas...
          </p>
        )}
        {error && (
          <p className="rounded-2xl bg-rose-50 p-4 text-rose-700 theme-dark:bg-rose-900/20 theme-dark:text-rose-300">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm theme-dark:border-slate-700 theme-dark:bg-slate-900">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 theme-dark:text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-extrabold text-slate-900 theme-dark:text-slate-100">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-600 theme-dark:text-slate-300">
        {subtitle}
      </p>
    </article>
  );
}
