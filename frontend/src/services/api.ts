import axios from 'axios';

const DEFAULT_LOCAL_API_BASE_URL = 'http://127.0.0.1:8000';
const DEFAULT_PUBLIC_API_BASE_URL = 'https://apida.guilam.dev.br';
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost']);

function normalizeBaseUrl(value: string | undefined) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

function isLoopbackUrl(value: string) {
  if (!value) {
    return false;
  }

  try {
    return LOOPBACK_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    const isLocalApp = LOOPBACK_HOSTS.has(currentHost);

    if (!isLocalApp && isLoopbackUrl(configuredBaseUrl)) {
      return DEFAULT_PUBLIC_API_BASE_URL;
    }

    if (!isLocalApp && !configuredBaseUrl && currentHost === 'appda.guilam.dev.br') {
      return DEFAULT_PUBLIC_API_BASE_URL;
    }
  }

  return configuredBaseUrl || DEFAULT_LOCAL_API_BASE_URL;
}

const API_BASE_URL = resolveApiBaseUrl();
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
