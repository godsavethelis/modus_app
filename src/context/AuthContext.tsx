/**
 * Контекст авторизации. Хранит пользователя и токены, восстанавливает сессию
 * при старте (спека: автовход через refresh-token), даёт login/logout.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LoginRequest, User } from '@/types';
import { authApi } from '@/services/api';
import { clearTokens, loadTokens, saveTokens } from '@/services/storage/secureStore';
import { mockUser } from '@/services/mocks/data';

interface AuthContextValue {
  user: User | null;
  /** Идёт восстановление сессии при старте. */
  initializing: boolean;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Тихий автовход: если есть сохранённые токены — считаем сессию валидной.
    // TODO(backend): здесь дёрнуть refresh и получить актуального пользователя.
    (async () => {
      try {
        const tokens = await loadTokens();
        if (tokens) setUser(mockUser);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      async signIn(credentials) {
        const { user: nextUser, tokens } = await authApi.login(credentials);
        await saveTokens(tokens);
        setUser(nextUser);
      },
      async signOut() {
        await clearTokens();
        setUser(null);
      },
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider');
  return ctx;
}
