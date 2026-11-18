import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Account } from "@/lib/mock-data";
import { api, ApiError, setActiveSessionId, type ApiUser } from "@/lib/api";
import { AuthContext, type AuthContextValue, type AuthResult } from "@/lib/auth-context";

type SessionState = {
  accounts: Account[];
  signedInIds: string[];
  activeId: string | null;
};

const SESSION_KEY = "cookie:sessions";
const initialState: SessionState = { accounts: [], signedInIds: [], activeId: null };

function readStoredState(): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as Partial<SessionState>;
    if (!value || !Array.isArray(value.accounts) || !Array.isArray(value.signedInIds)) return null;
    return {
      accounts: value.accounts,
      signedInIds: value.signedInIds,
      activeId: typeof value.activeId === "string" ? value.activeId : null,
    };
  } catch {
    return null;
  }
}

function persistState(state: SessionState) {
  if (typeof window === "undefined") return;
  if (state.signedInIds.length === 0) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  localStorage.removeItem("cookie:token");
}

function toAccount(u: ApiUser): Account {
  return {
    id: String(u.id),
    name: u.nome,
    handle: u.nomeUsuario.startsWith("@") ? u.nomeUsuario : `@${u.nomeUsuario}`,
    email: u.email,
    bio: u.bio ?? "",
    since: `Membro desde ${new Date(u.dataCadastro).getFullYear()}`,
    role: u.tipo === "ADMINISTRADOR" ? "moderador" : "membro",
    fotoPerfil: u.fotoPerfil,
    stats: {
      publicadas: u.estatisticas.receitasPublicadas,
      avaliacoes: u.estatisticas.avaliacoes,
      testadas: u.estatisticas.receitasTestadas,
      seguidores: u.estatisticas.seguidores ?? 0,
      seguindo: u.estatisticas.seguindo ?? 0,
    },
    publishedIds: [],
    testedIds: [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [ready, setReady] = useState(false);
  const [pendingRecoveryCode, setPendingRecoveryCode] = useState<string | null>(null);

  const commit = useCallback((next: SessionState) => {
    stateRef.current = next;
    persistState(next);
    setActiveSessionId(next.activeId);
    setState(next);
  }, []);

  const refreshUser = useCallback(async () => {
    const activeId = stateRef.current.activeId;
    if (!activeId) return;
    const profile = await api<ApiUser>("/api/me");
    if (stateRef.current.activeId !== activeId || String(profile.id) !== activeId) return;
    const updated = toAccount(profile);
    const current = stateRef.current;
    commit({
      ...current,
      accounts: current.accounts.map((account) => (account.id === activeId ? updated : account)),
    });
  }, [commit]);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const stored = readStoredState();
      localStorage.removeItem("cookie:token");
      if (stored) localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
      const candidates = stored?.signedInIds ?? [];
      const checked = await Promise.all(
        candidates.map(async (id) => {
          try {
            const user = await api<ApiUser>("/api/me", {
              headers: { "X-Session-Id": id },
            });
            return { account: toAccount(user), id, unavailable: false };
          } catch (error) {
            // Só descartamos uma sessão quando a API confirma que o token não é válido.
            // Falhas de rede/servidor não devem apagar as sessões persistidas no navegador.
            return {
              account: null,
              id,
              unavailable: !(error instanceof ApiError && error.status === 401),
            };
          }
        }),
      );
      if (cancelled) return;
      if (checked.some((item) => item.unavailable)) {
        if (stored) {
          setActiveSessionId(stored.activeId);
          setState(stored);
        }
        setReady(true);
        return;
      }
      const valid = checked.filter(
        (item): item is { account: Account; id: string; unavailable: false } =>
          item.account !== null,
      );
      const accounts = [...new Map(valid.map((item) => [item.account.id, item.account])).values()];
      const signedInIds = accounts.map((account) => account.id);
      const activeId =
        stored?.activeId && signedInIds.includes(stored.activeId)
          ? stored.activeId
          : (signedInIds[0] ?? null);
      commit({ accounts, signedInIds, activeId });
      setReady(true);
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, [commit]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const data = await api<{
          usuario: ApiUser;
          codigoRecuperacao?: string | null;
        }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, senha: password }) });
        const account = toAccount(data.usuario);
        commit({
          accounts: [...state.accounts.filter((item) => item.id !== account.id), account],
          signedInIds: [...state.signedInIds.filter((id) => id !== account.id), account.id],
          activeId: account.id,
        });
        if (data.codigoRecuperacao) setPendingRecoveryCode(data.codigoRecuperacao);
        return {
          ok: true,
          user: account,
          ...(data.codigoRecuperacao ? { recoveryCode: data.codigoRecuperacao } : {}),
        };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Falha ao entrar." };
      }
    },
    [commit, state],
  );

  const signup = useCallback(
    async ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }): Promise<AuthResult> => {
      try {
        const data = await api<{
          usuario: ApiUser;
          codigoRecuperacao?: string | null;
        }>("/api/auth/cadastro", {
          method: "POST",
          body: JSON.stringify({ nome: name, email, senha: password }),
        });
        const account = toAccount(data.usuario);
        commit({
          accounts: [...state.accounts.filter((item) => item.id !== account.id), account],
          signedInIds: [...state.signedInIds.filter((id) => id !== account.id), account.id],
          activeId: account.id,
        });
        if (data.codigoRecuperacao) setPendingRecoveryCode(data.codigoRecuperacao);
        return {
          ok: true,
          user: account,
          ...(data.codigoRecuperacao ? { recoveryCode: data.codigoRecuperacao } : {}),
        };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Falha ao criar conta.",
        };
      }
    },
    [commit, state],
  );

  const logout = useCallback(() => {
    for (const id of stateRef.current.signedInIds) {
      void api("/api/auth/logout", {
        method: "POST",
        headers: { "X-Session-Id": id },
      }).catch(() => undefined);
    }
    commit(initialState);
  }, [commit]);

  const switchAccount = useCallback(
    (id: string) => {
      if (!state.signedInIds.includes(id) || id === state.activeId) return;
      commit({ ...state, activeId: id });
      window.location.reload();
    },
    [state, commit],
  );

  const updateUser = useCallback(
    async (patch: Partial<Omit<Account, "id" | "role">>) => {
      if (!state.activeId) return;
      const current = state.accounts.find((a) => a.id === state.activeId);
      if (!current) return;
      const profile = await api<ApiUser>("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          nome: patch.name ?? current.name,
          nomeUsuario: patch.handle ?? current.handle,
          bio: patch.bio ?? current.bio,
          fotoPerfil:
            patch.fotoPerfil === undefined ? (current.fotoPerfil ?? null) : patch.fotoPerfil,
        }),
      });
      const updated = toAccount(profile);
      commit({
        ...state,
        accounts: state.accounts.map((account) => (account.id === updated.id ? updated : account)),
      });
    },
    [state, commit],
  );

  const deleteAccount = useCallback(async () => {
    if (!state.activeId) return;
    await api("/api/me", { method: "DELETE" });
    const id = state.activeId;
    const signedInIds = state.signedInIds.filter((x) => x !== id);
    commit({
      accounts: state.accounts.filter((a) => a.id !== id),
      signedInIds,
      activeId: signedInIds[0] ?? null,
    });
  }, [state, commit]);

  const value = useMemo<AuthContextValue>(() => {
    const byId = (id: string) => state.accounts.find((a) => a.id === id);
    return {
      ready,
      user: state.activeId ? (byId(state.activeId) ?? null) : null,
      pendingRecoveryCode,
      dismissRecoveryCode: () => setPendingRecoveryCode(null),
      signedInAccounts: state.signedInIds.map(byId).filter((a): a is Account => Boolean(a)),
      login,
      signup,
      logout,
      switchAccount,
      updateUser,
      refreshUser,
      deleteAccount,
      emailInUse: (email) => {
        const normalized = email.trim().toLowerCase();
        return state.accounts.some(
          (a) => a.id !== state.activeId && a.email.toLowerCase() === normalized,
        );
      },
    };
  }, [
    state,
    ready,
    pendingRecoveryCode,
    login,
    signup,
    logout,
    switchAccount,
    updateUser,
    refreshUser,
    deleteAccount,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
