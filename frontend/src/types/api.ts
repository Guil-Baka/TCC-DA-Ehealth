export interface UsuarioResponse {
  id_usuario: number;
  nome: string;
  email: string;
}

export interface UserRegisterPayload {
  nome: string;
  email: string;
  password: string;
}

export interface UserLoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UsuarioResponse;
}

export interface Paciente {
  id_paciente: number;
  id_usuario: number;
  iniciais: string;
  estagio_doenca: string;
  idade: number;
}

export interface PacientePayload {
  id_usuario: number;
  iniciais: string;
  estagio_doenca: string;
  idade: number;
}

export interface AgendaMedicamento {
  id_agenda: number;
  id_paciente: number;
  medicamento: string;
  dosagem: string;
  horario: string;
}

export interface AgendaPayload {
  id_paciente: number;
  medicamento: string;
  dosagem: string;
  horario: string;
}

export interface RegistroSintoma {
  id_registro: number;
  id_paciente: number;
  data_registro: string;
  sintomas_cognitivos: string;
  sintomas_comportamentais: string;
  sintomas_motores: string;
  nivel_humor: string;
}

export interface RegistroPayload {
  id_paciente: number;
  data_registro: string;
  sintomas_cognitivos: string;
  sintomas_comportamentais: string;
  sintomas_motores: string;
  nivel_humor: string;
}

export interface ArtigoAlzheimer {
  id_artigo: number;
  titulo: string;
  link: string;
}
