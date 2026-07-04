import { useEffect, useMemo, useState } from "react";
import { Clock3, PencilLine, Plus, Trash2 } from "lucide-react";
import type { AgendaMedicamento, AgendaPayload, Paciente } from "../types/api";
import {
  createAgenda,
  deleteAgenda,
  listPacientes,
  listAgendas,
  updateAgenda,
} from "../services/ehealth";
import { anonymizePacienteId } from "../utils/anonymize";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FormField } from "../components/ui/FormField";
import { FormInput } from "../components/ui/FormInput";
import { PaginationControls } from "../components/ui/PaginationControls";
import { FormSelect } from "../components/ui/FormSelect";

const initialForm: AgendaPayload = {
  id_paciente: 0,
  medicamento: "",
  dosagem: "",
  horario: "08:00:00",
};
const PAGE_SIZE = 10;

function normalizeHorario(value: string) {
  if (value.length === 5) return `${value}:00`;
  return value;
}

export function AgendaPage() {
  const [agendas, setAgendas] = useState<AgendaMedicamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState<AgendaPayload>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const ordered = useMemo(
    () => [...agendas].sort((a, b) => a.horario.localeCompare(b.horario)),
    [agendas],
  );

  const orderedPacientes = useMemo(
    () => [...pacientes].sort((a, b) => a.id_paciente - b.id_paciente),
    [pacientes],
  );

  async function refresh(targetPage = page) {
    setLoading(true);
    setError("");
    try {
      const [agendasData, pacientesData] = await Promise.all([
        listAgendas({
          skip: (targetPage - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        }),
        listPacientes({ skip: 0, limit: 1000 }),
      ]);
      if (!agendasData.length && targetPage > 1) {
        setPage(targetPage - 1);
        return;
      }
      setAgendas(agendasData);
      setPacientes(pacientesData);
    } catch {
      setError("Não foi possível carregar a agenda de medicamentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh(page);
  }, [page]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.id_paciente) {
      setError("Selecione um paciente para salvar a agenda.");
      return;
    }

    const payload = { ...form, horario: normalizeHorario(form.horario) };

    try {
      if (editingId) {
        await updateAgenda(editingId, payload);
      } else {
        await createAgenda(payload);
      }
      setForm(initialForm);
      setEditingId(null);
      await refresh(page);
    } catch {
      setError(
        "Falha ao salvar agenda. Verifique se o paciente informado existe.",
      );
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Deseja remover este lembrete?")) return;
    try {
      await deleteAgenda(id);
      await refresh(page);
    } catch {
      setError("Não foi possível remover o item da agenda.");
    }
  }

  function onEdit(agenda: AgendaMedicamento) {
    setEditingId(agenda.id_agenda);
    setForm({
      id_paciente: agenda.id_paciente,
      medicamento: agenda.medicamento,
      dosagem: agenda.dosagem,
      horario: agenda.horario.slice(0, 5),
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
      <Card>
        <h2 className="text-2xl text-slate-900 theme-dark:text-slate-100">
          Agenda assistiva de medicamentos
        </h2>
        <p className="mt-2 text-sm text-slate-600 theme-dark:text-slate-300">
          Organize horários e dosagens para reduzir falhas no tratamento diário.
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

          <FormField label="Medicamento">
            <FormInput
              required
              value={form.medicamento}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, medicamento: e.target.value }))
              }
            />
          </FormField>

          <FormField label="Dosagem">
            <FormInput
              required
              value={form.dosagem}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, dosagem: e.target.value }))
              }
            />
          </FormField>

          <FormField label="Horário">
            <FormInput
              type="time"
              required
              value={form.horario.slice(0, 5)}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, horario: e.target.value }))
              }
            />
          </FormField>

          <div className="flex gap-2">
            <Button type="submit">
              <Plus size={16} />
              {editingId ? "Atualizar item" : "Adicionar item"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
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
          Lembretes ativos
        </h3>
        {loading ? (
          <p className="mt-4 text-slate-500 theme-dark:text-slate-400">
            Carregando...
          </p>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {ordered.map((agenda) => (
                <li
                  key={agenda.id_agenda}
                  className="rounded-2xl border border-slate-200 p-4 theme-dark:border-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800 theme-dark:text-slate-100">
                        {agenda.medicamento}
                      </p>
                      <p className="text-sm text-slate-600 theme-dark:text-slate-300">
                        Paciente: {anonymizePacienteId(agenda.id_paciente)} |
                        Dosagem: {agenda.dosagem}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 theme-dark:text-teal-300">
                        <Clock3 size={14} /> {agenda.horario.slice(0, 5)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onEdit(agenda)}
                        variant="outline"
                        size="sm"
                      >
                        <PencilLine size={14} /> Editar
                      </Button>
                      <Button
                        onClick={() => onDelete(agenda.id_agenda)}
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
                  Nenhum item de agenda cadastrado.
                </p>
              )}
            </ul>
            <PaginationControls
              page={page}
              pageSize={PAGE_SIZE}
              itemCount={ordered.length}
              loading={loading}
              label="Agenda paginada por 10 registros"
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => current + 1)}
            />
          </>
        )}
      </Card>
    </section>
  );
}
