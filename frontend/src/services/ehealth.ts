import { api } from './api';
import type {
  AgendaMedicamento,
  AgendaPayload,
  ArtigoAlzheimer,
  Paciente,
  PacientePayload,
  RegistroPayload,
  RegistroSintoma,
} from '../types/api';

interface ListParams {
  skip?: number;
  limit?: number;
}

export async function listPacientes(params: ListParams = { skip: 0, limit: 1000 }) {
  const { data } = await api.get<Paciente[]>('/pacientes/', {
    params,
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

export async function listAgendas(params: ListParams = { skip: 0, limit: 1000 }) {
  const { data } = await api.get<AgendaMedicamento[]>('/agenda-medicamentos/', {
    params,
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

export async function listRegistros(params: ListParams = { skip: 0, limit: 1000 }) {
  const { data } = await api.get<RegistroSintoma[]>('/registro-sintomas/', {
    params,
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

export async function listAlzheimerArticles(
  params: { q?: string; skip?: number; limit?: number } = {
    skip: 0,
    limit: 50,
  },
) {
  const { data } = await api.get<ArtigoAlzheimer[]>('/artigos-alzheimer/', {
    params,
  });
  return data;
}
