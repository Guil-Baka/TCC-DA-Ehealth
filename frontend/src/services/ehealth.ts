import { api } from './api';
import type {
  AgendaMedicamento,
  AgendaPayload,
  Paciente,
  PacientePayload,
  RegistroPayload,
  RegistroSintoma,
} from '../types/api';

export async function listPacientes() {
  // The backend defaults to limit=10; request a larger page to avoid UI truncation.
  const { data } = await api.get<Paciente[]>('/pacientes/', {
    params: { skip: 0, limit: 1000 },
  });
  return data;
}

export async function createPaciente(payload: PacientePayload) {
  const { data } = await api.post<Paciente>('/pacientes/', payload);
  return data;
}

export async function updatePaciente(id: number, payload: PacientePayload) {
  const { data } = await api.put<Paciente>(`/pacientes/${id}`, payload);
  return data;
}

export async function deletePaciente(id: number) {
  await api.delete(`/pacientes/${id}`);
}

export async function listAgendas() {
  const { data } = await api.get<AgendaMedicamento[]>('/agenda-medicamentos/', {
    params: { skip: 0, limit: 1000 },
  });
  return data;
}

export async function createAgenda(payload: AgendaPayload) {
  const { data } = await api.post<AgendaMedicamento>('/agenda-medicamentos/', payload);
  return data;
}

export async function updateAgenda(id: number, payload: AgendaPayload) {
  const { data } = await api.put<AgendaMedicamento>(`/agenda-medicamentos/${id}`, payload);
  return data;
}

export async function deleteAgenda(id: number) {
  await api.delete(`/agenda-medicamentos/${id}`);
}

export async function listRegistros() {
  const { data } = await api.get<RegistroSintoma[]>('/registro-sintomas/', {
    params: { skip: 0, limit: 1000 },
  });
  return data;
}

export async function createRegistro(payload: RegistroPayload) {
  const { data } = await api.post<RegistroSintoma>('/registro-sintomas/', payload);
  return data;
}

export async function updateRegistro(id: number, payload: RegistroPayload) {
  const { data } = await api.put<RegistroSintoma>(`/registro-sintomas/${id}`, payload);
  return data;
}

export async function deleteRegistro(id: number) {
  await api.delete(`/registro-sintomas/${id}`);
}
