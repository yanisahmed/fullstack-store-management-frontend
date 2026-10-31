'use client';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokens } from './api';
import { ModuleName, Role, Store, User } from './types';

interface Ctx {
  user: User | null; store: Store | null; loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(d: { storeName: string; name: string; email: string; phone?: string; password: string }): Promise<void>;
  logout(): void; reload(): Promise<void>;
  isRole(...r: Role[]): boolean; hasModule(m: ModuleName): boolean; expired: boolean;
}
const AuthCtx = createContext<Ctx>(null as unknown as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!tokens.access) { setLoading(false); return; }
    try {
      const u = await api<User>('/auth/me');
      setUser(u);
      setStore(u.storeId ? await api<Store>('/stores/me') : null);
    } catch { tokens.clear(); setUser(null); setStore(null); }
    setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const finish = async (d: { accessToken: string; refreshToken: string }) => { tokens.set(d.accessToken, d.refreshToken); await reload(); };
  const login = async (email: string, password: string) => finish(await api('/auth/login', { method: 'POST', body: { email, password } }));
  const register: Ctx['register'] = async (b) => finish(await api('/auth/register-store', { method: 'POST', body: b }));
  const logout = () => { tokens.clear(); setUser(null); setStore(null); };

  const isRole = (...r: Role[]) => !!user?.roles.some((x) => r.includes(x));
  const expiresAt = store?.subscription?.expiresAt;
  const expired = !!store && (!expiresAt || new Date(expiresAt) < new Date());
  const hasModule = (m: ModuleName) => isRole('superuser') || (!!store && !expired && store.status === 'active' && store.enabledModules.includes(m));

  return <AuthCtx.Provider value={{ user, store, loading, login, register, logout, reload, isRole, hasModule, expired }}>{children}</AuthCtx.Provider>;
}
