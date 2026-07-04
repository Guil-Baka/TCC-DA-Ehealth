import { useEffect, useMemo, useState } from "react";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import type { Paciente, PacientePayload } from "../types/api";
import {
  createPaciente,
  deletePaciente,
  listPacientes,
  updatePaciente,
} from "../services/ehealth";
import { anonymizePacienteId } from "../utils/anonymize";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FormField } from "../components/ui/FormField";
import { FormInput } from "../components/ui/FormInput";
import { FormSelect } from "../components/ui/FormSelect";

const initialForm: PacientePayload = {
  id_usuario: 1,
  iniciais: "",
  estagio_doenca: "",
  idade: 0,
};

const ESTAGIO_OPTIONS = ["leve", "moderado", "avançado"];

export function PacientesPage() {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState<PacientePayload>({
    ...initialForm,
    id_usuario: user?.id_usuario ?? 0,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ordered = useMemo(
    () => [...pacientes].sort((a, b) => a.id_paciente - b.id_paciente),
    [pacientes],
  );

  useEffect(() => {
    if (user) {
      setForm((prev) => ({ ...prev, id_usuario: user.id_usuario }));
    }
  }, [user]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await listPacientes();
      setPacientes(data);
    } catch {
      setError(
        "Não foi possível carregar pacientes. Verifique se a API FastAPI está em execução.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (editingId) {
        await updatePaciente(editingId, form);
      } else {
        await createPaciente(form);
      }
      setForm({ ...initialForm, id_usuario: user?.id_usuario ?? 0 });
      setEditingId(null);
      await refresh();
    } catch {
      setError(
        "Falha ao salvar paciente. O backend permite apenas pacientes vinculados ao usuário logado.",
      );
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Deseja remover este paciente?")) return;
    try {
      await deletePaciente(id);
      await refresh();
    } catch {
      setError("Não foi possível remover o paciente.");
    }
  }

  function onEdit(paciente: Paciente) {
    setEditingId(paciente.id_paciente);
    setForm({
      id_usuario: paciente.id_usuario,
      iniciais: paciente.iniciais,
      estagio_doenca: paciente.estagio_doenca,
      idade: paciente.idade,
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
      <Card>
        <h2 className="text-2xl text-slate-900 theme-dark:text-slate-100">
          Cadastro de pacientes
        </h2>
        <p className="mt-2 text-sm text-slate-600 theme-dark:text-slate-300">
          Use este módulo para registrar perfis clínicos e atualizar o estágio
          da doença.
        </p>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600 theme-dark:bg-slate-800 theme-dark:text-slate-300">
            Cuidador autenticado: {user?.nome}
          </p>

          <FormField label="Iniciais do paciente">
            <FormInput
              required
              value={form.iniciais}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  iniciais: e.target.value.toUpperCase(),
                }))
              }
              placeholder="Ex.: MS"
              maxLength={10}
            />
          </FormField>

          <FormField label="Estágio da doença">
            <FormSelect
              required
              value={form.estagio_doenca}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, estagio_doenca: e.target.value }))
              }
            >
              <option value="" disabled>
                Selecione o estágio
              </option>
              {ESTAGIO_OPTIONS.map((estagio) => (
                <option key={estagio} value={estagio}>
                  {estagio}
                </option>
              ))}
              {form.estagio_doenca &&
                !ESTAGIO_OPTIONS.includes(form.estagio_doenca) && (
                  <option value={form.estagio_doenca}>
                    {form.estagio_doenca}
                  </option>
                )}
            </FormSelect>
          </FormField>

          <FormField label="Idade">
            <FormInput
              type="number"
              min={0}
              max={130}
              required
              value={form.idade}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, idade: Number(e.target.value) }))
              }
            />
          </FormField>

          <div className="flex gap-2">
            <Button type="submit">
              <Plus size={16} />
              {editingId ? "Atualizar paciente" : "Adicionar paciente"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    ...initialForm,
                    id_usuario: user?.id_usuario ?? 0,
                  });
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
          Pacientes registrados
        </h3>
        {loading ? (
          <p className="mt-4 text-slate-500 theme-dark:text-slate-400">
            Carregando...
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {ordered.map((paciente) => (
              <li
                key={paciente.id_paciente}
                className="rounded-2xl border border-slate-200 p-4 theme-dark:border-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800 theme-dark:text-slate-100">
                      {paciente.iniciais} (
                      {anonymizePacienteId(paciente.id_paciente)})
                    </p>
                    <p className="text-sm text-slate-600 theme-dark:text-slate-300">
                      Estágio: {paciente.estagio_doenca} | Idade:{" "}
                      {paciente.idade} | Cuidador: {paciente.id_usuario}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onEdit(paciente)}
                      variant="outline"
                      size="sm"
                    >
                      <PencilLine size={14} /> Editar
                    </Button>
                    <Button
                      onClick={() => onDelete(paciente.id_paciente)}
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
                Nenhum paciente cadastrado ainda.
              </p>
            )}
          </ul>
        )}
      </Card>
    </section>
  );
}
