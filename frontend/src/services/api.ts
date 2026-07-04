import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let handlingUnauthorized = false;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register');
    const hasAuthContext =
      Boolean(accessToken) ||
      Boolean(error.config?.headers?.Authorization);

    if (
      status === 401 &&
      !isAuthEndpoint &&
      hasAuthContext &&
      unauthorizedHandler &&
      !handlingUnauthorized
    ) {
      // Trigger a single logout flow when an authenticated session expires.
      handlingUnauthorized = true;
      unauthorizedHandler();
      queueMicrotask(() => {
        handlingUnauthorized = false;
      });
    }

    return Promise.reject(error);
  },
);
