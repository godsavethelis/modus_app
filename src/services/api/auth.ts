/**
 * Auth API. Реюз существующих эндпоинтов бэкенда (спека):
 *   POST /api/auth/login
 *   POST /api/auth/refresh
 */
import type { AuthTokens, LoginRequest, LoginResponse } from '@/types';
import { MOCK_AUTH_FAILURE, MOCK_PASSWORD, mockUser } from '../mocks/data';
import { ApiError, delay } from './client';

export async function login({ email, password }: LoginRequest): Promise<LoginResponse> {
  await delay();
  // TODO(backend): POST /api/auth/login
  if (MOCK_AUTH_FAILURE === 'network') {
    throw new ApiError('Нет соединения. Проверь интернет и попробуй ещё раз', 'network');
  }
  if (MOCK_AUTH_FAILURE === 'server') {
    throw new ApiError('Сервер недоступен. Попробуй чуть позже', 'server');
  }
  if (!email.includes('@')) {
    throw new ApiError('Проверь email', 'validation');
  }
  if (password !== MOCK_PASSWORD) {
    throw new ApiError('Неверный email или пароль', 'auth');
  }
  return {
    user: { ...mockUser, email },
    tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
  };
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  await delay(300);
  // TODO(backend): POST /api/auth/refresh
  if (!refreshToken) {
    throw new ApiError('Сессия истекла', 'auth');
  }
  return { accessToken: 'mock-access-2', refreshToken: 'mock-refresh-2' };
}
