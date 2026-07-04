import { api } from './api';
import type { AuthResponse, UserLoginPayload, UserRegisterPayload, UsuarioResponse } from '../types/api';

export async function registerUser(payload: UserRegisterPayload) {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function loginUser(payload: UserLoginPayload) {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get<UsuarioResponse>('/auth/me');
  return data;
}
