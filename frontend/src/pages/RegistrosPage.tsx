import { useEffect, useMemo, useState } from "react";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import type { Paciente, RegistroPayload, RegistroSintoma } from "../types/api";
import {
  createRegistro,
  deleteRegistro,
  listPacientes,
  listRegistros,
  updateRegistro,
} from "../services/ehealth";
import { anonymizePacienteId, formatDate } from "../utils/anonymize";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FormField } from "../components/ui/FormField";
import { FormInput } from "../components/ui/FormInput";
import { FormSelect } from "../components/ui/FormSelect";

function toDatetimeLocalValue(date: Date) {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

const nowInput = () => toDatetimeLocalValue(new Date());

const initialForm: RegistroPayload = {
  id_paciente: 0,
  data_registro: new Date().toISOString(),
  sintomas_cognitivos: "",
  sintomas_comportamentais: "",
  sintomas_motores: "",
  nivel_humor: "",
};

const HUMOR_OPTIONS = ["estavel", "ansioso", "irritado", "triste", "agitado"];

const SINTOMAS_COGNITIVOS_OPTIONS = [
  "Perda da capacidade de adquirir e lembrar novas informações",
  "Prejuízo no raciocínio e na execução de tarefas complexas",
  "Habilidades visuoespaciais prejudicadas",
  "Alteração de linguagem, fala, escrita e leitura",
];

const SINTOMAS_COMPORTAMENTAIS_OPTIONS = [
  "Flutuações de humor",
  "Agitação",
  "Desmotivação",
  "Diminuição da iniciativa",
  "Apatia",
  "Retraimento social",
  "Diminuição de interesse em atividades prévias",
  "Perda de empatia",
  "Comportamentos obsessivo-compulsivos",
  "Comportamentos socialmente inadequados",
];

const SINTOMAS_FUNCIONAIS_OPTIONS = [
  "Dificuldade em aprender a usar eletrodomésticos",
  "Esquece mês ou ano",
  "Dificuldade de usar telefone e fazer ligações",
  "Dificuldade de usar carro, táxi ou ônibus",
  "Dificuldade de tomar remédios",
  "Dificuldade de guardar fatos e notícias",
  "Dificuldade de expressar opiniões",
  "Dificuldade de sair e voltar para casa sozinho",
];

function parseStoredSelections(value: string) {
  return value
    .split(/[;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toggleSelection(list: string[], item: string) {
  if (list.includes(item)) {
    return list.filter((current) => current !== item);
  }
  return [...list, item];
}

interface SymptomMultiSelectProps {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (item: string) => void;
}

function SymptomMultiSelect({
  title,
  options,
  selected,
  onToggle,
}: SymptomMultiSelectProps) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white theme-dark:border-slate-700 theme-dark:bg-slate-900">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 theme-dark:text-slate-200">
        <span>{title}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 theme-dark:bg-slate-800 theme-dark:text-slate-300">
          {selected.length} selecionado(s)
        </span>
      </summary>
      <div className="max-h-48 space-y-2 overflow-y-auto border-t border-slate-200 p-3 theme-dark:border-slate-700">
        {options.map((item) => (
          <label
            key={item}
            className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 theme-dark:border-slate-700 theme-dark:text-slate-200"
          >
            <input
              type="checkbox"
              checked={selected.includes(item)}
              onChange={() => onToggle(item)}
              className="mt-0.5"
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

function toIsoFromInput(datetimeLocal: string) {
  const date = new Date(datetimeLocal);
  return date.toISOString();
}

export function RegistrosPage() {
  const [registros, setRegistros] = useState<RegistroSintoma[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState<RegistroPayload>(initialForm);
  const [selectedCognitivos, setSelectedCognitivos] = useState<string[]>([]);
  const [selectedComportamentais, setSelectedComportamentais] = useState<
    string[]
  >([]);
  const [selectedFuncionais, setSelectedFuncionais] = useState<string[]>([]);
  const [datetimeInput, setDatetimeInput] = useState(nowInput());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ordered = useMemo(
    () =>
      [...registros].sort(
        (a, b) => +new Date(b.data_registro) - +new Date(a.data_registro),
      ),
    [registros],
  );

  const orderedPacientes = useMemo(
    () => [...pacientes].sort((a, b) => a.id_paciente - b.id_paciente),
    [pacientes],
  );

  const cognitivoChoices = useMemo(
    () => [
      ...SINTOMAS_COGNITIVOS_OPTIONS,
      ...selectedCognitivos.filter(
        (item) => !SINTOMAS_COGNITIVOS_OPTIONS.includes(item),
      ),
    ],
    [selectedCognitivos],
  );

  const comportamentalChoices = useMemo(
    () => [
      ...SINTOMAS_COMPORTAMENTAIS_OPTIONS,
      ...selectedComportamentais.filter(
        (item) => !SINTOMAS_COMPORTAMENTAIS_OPTIONS.includes(item),
      ),
    ],
    [selectedComportamentais],
  );

  const funcionaisChoices = useMemo(
    () => [
      ...SINTOMAS_FUNCIONAIS_OPTIONS,
      ...selectedFuncionais.filter(
        (item) => !SINTOMAS_FUNCIONAIS_OPTIONS.includes(item),
      ),
    ],
    [selectedFuncionais],
  );

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [registrosData, pacientesData] = await Promise.all([
        listRegistros(),
        listPacientes(),
      ]);
      setRegistros(registrosData);
      setPacientes(pacientesData);
    } catch {
      setError("Não foi possível carregar registros de sintomas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.id_paciente) {
      setError("Selecione um paciente para salvar o registro.");
      return;
    }

    if (!selectedCognitivos.length) {
      setError("Selecione ao menos um sintoma cognitivo.");
      return;
    }

    if (!selectedComportamentais.length) {
      setError("Selecione ao menos um sintoma comportamental.");
      return;
    }

    if (!selectedFuncionais.length) {
      setError("Selecione ao menos um sintoma funcional.");
      return;
    }

    const payload: RegistroPayload = {
      ...form,
      data_registro: toIsoFromInput(datetimeInput),
      sintomas_cognitivos: selectedCognitivos.join("; "),
      sintomas_comportamentais: selectedComportamentais.join("; "),
      sintomas_motores: selectedFuncionais.join("; "),
    };

    try {
      if (editingId) {
        await updateRegistro(editingId, payload);
      } else {
        await createRegistro(payload);
      }
      setForm(initialForm);
      setSelectedCognitivos([]);
      setSelectedComportamentais([]);
      setSelectedFuncionais([]);
      setDatetimeInput(nowInput());
      setEditingId(null);
      await refresh();
    } catch {
      setError("Falha ao salvar registro. Verifique o ID do paciente.");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Deseja excluir este registro?")) return;
    try {
      await deleteRegistro(id);
      await refresh();
    } catch {
      setError("Não foi possível excluir o registro.");
    }
  }

  function onEdit(registro: RegistroSintoma) {
    setEditingId(registro.id_registro);
    setSelectedCognitivos(parseStoredSelections(registro.sintomas_cognitivos));
    setSelectedComportamentais(
      parseStoredSelections(registro.sintomas_comportamentais),
    );
    setSelectedFuncionais(parseStoredSelections(registro.sintomas_motores));
    setForm({
      id_paciente: registro.id_paciente,
      data_registro: registro.data_registro,
      sintomas_cognitivos: registro.sintomas_cognitivos,
      sintomas_comportamentais: registro.sintomas_comportamentais,
      sintomas_motores: registro.sintomas_motores,
      nivel_humor: registro.nivel_humor,
    });
    setDatetimeInput(toDatetimeLocalValue(new Date(registro.data_registro)));
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
      <Card>
        <h2 className="text-2xl text-slate-900 theme-dark:text-slate-100">
          Registro de sintomas
        </h2>
        <p className="mt-2 text-sm text-slate-600 theme-dark:text-slate-300">
          Colete evolução clínica e comportamental para alimentar o dashboard e
          apoiar decisões de cuidado.
        </p>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 theme-dark:border-amber-900 theme-dark:bg-amber-950/30 theme-dark:text-amber-200">
          Atenção: registre apenas sintomas que se apresentarem por, no mínimo,
          duas semanas.
        </p>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <FormField label="Paciente">
            <FormSelect
              required
              value={form.id_paciente || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  id_paciente: Number(e.target.value),
                }))
              }
            >
              <option value="" disabled>
                Selecione um paciente
              </option>
              {orderedPacientes.map((paciente) => (
                <option key={paciente.id_paciente} value={paciente.id_paciente}>
                  {paciente.iniciais} (
                  {anonymizePacienteId(paciente.id_paciente)})
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label="Data e hora do registro">
            <FormInput
              type="datetime-local"
              required
              value={datetimeInput}
              onChange={(e) => setDatetimeInput(e.target.value)}
            />
          </FormField>

          <div className="space-y-3">
            <SymptomMultiSelect
              title="Sintomas cognitivos"
              options={cognitivoChoices}
              selected={selectedCognitivos}
              onToggle={(item) =>
                setSelectedCognitivos((prev) => toggleSelection(prev, item))
              }
            />
            <SymptomMultiSelect
              title="Sintomas comportamentais"
              options={comportamentalChoices}
              selected={selectedComportamentais}
              onToggle={(item) =>
                setSelectedComportamentais((prev) =>
                  toggleSelection(prev, item),
                )
              }
            />
            <SymptomMultiSelect
              title="Sintomas funcionais"
              options={funcionaisChoices}
              selected={selectedFuncionais}
              onToggle={(item) =>
                setSelectedFuncionais((prev) => toggleSelection(prev, item))
              }
            />
          </div>

          <FormField label="Nível de humor">
            <FormSelect
              required
              value={form.nivel_humor}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nivel_humor: e.target.value }))
              }
            >
              <option value="" disabled>
                Selecione o humor
              </option>
              {HUMOR_OPTIONS.map((humor) => (
                <option key={humor} value={humor}>
                  {humor}
                </option>
              ))}
              {form.nivel_humor &&
                !HUMOR_OPTIONS.includes(form.nivel_humor) && (
                  <option value={form.nivel_humor}>{form.nivel_humor}</option>
                )}
            </FormSelect>
          </FormField>

          <div className="flex gap-2">
            <Button type="submit">
              <Plus size={16} />
              {editingId ? "Atualizar registro" : "Adicionar registro"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                  setSelectedCognitivos([]);
                  setSelectedComportamentais([]);
                  setSelectedFuncionais([]);
                  setDatetimeInput(nowInput());
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
        {error && (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 theme-dark:bg-rose-900/20 theme-dark:text-rose-300">
            {error}
          </p>
        )}
      </Card>

      <Card>
        <h3 className="text-xl text-slate-900 theme-dark:text-slate-100">
          Histórico de sintomas
        </h3>
        {loading ? (
          <p className="mt-4 text-slate-500 theme-dark:text-slate-400">
            Carregando...
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {ordered.map((registro) => (
              <li
                key={registro.id_registro}
                className="rounded-2xl border border-slate-200 p-4 theme-dark:border-slate-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800 theme-dark:text-slate-100">
                      {anonymizePacienteId(registro.id_paciente)} |{" "}
                      {formatDate(registro.data_registro)}
                    </p>
                    <p className="text-sm text-slate-600 theme-dark:text-slate-300">
                      Cognitivos: {registro.sintomas_cognitivos}
                    </p>
                    <p className="text-sm text-slate-600 theme-dark:text-slate-300">
                      Comportamentais: {registro.sintomas_comportamentais}
                    </p>
                    <p className="text-sm text-slate-600 theme-dark:text-slate-300">
                      Funcionais: {registro.sintomas_motores}
                    </p>
                    <p className="text-sm text-slate-600 theme-dark:text-slate-300">
                      Humor: {registro.nivel_humor}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onEdit(registro)}
                      variant="outline"
                      size="sm"
                    >
                      <PencilLine size={14} /> Editar
                    </Button>
                    <Button
                      onClick={() => onDelete(registro.id_registro)}
                      variant="danger"
                      size="sm"
                    >
                      <Trash2 size={14} /> Excluir
                    </Button>
                  </div>
                </div>
              </li>
            ))}
            {!ordered.length && (
              <p className="text-sm text-slate-500">
                Nenhum registro cadastrado ainda.
              </p>
            )}
          </ul>
        )}
      </Card>
    </section>
  );
}
