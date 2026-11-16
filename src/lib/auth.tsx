import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Account } from "@/lib/mock-data";
import { api, getToken, saveToken, type ApiUser } from "@/lib/api";
import { AuthContext, type AuthContextValue, type AuthResult } from "@/lib/auth-context";

type SessionState = {
  accounts: Account[];
  signedInIds: string[];
  activeId: string | null;
  tokens: Record<string, string>;
};

const SESSION_KEY = "cookie:sessions";
const initialState: SessionState = { accounts: [], signedInIds: [], activeId: null, tokens: {} };

function readStoredState(): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as Partial<SessionState>;
    if (!value || !Array.isArray(value.accounts) || !Array.isArray(value.signedInIds)) return null;
    if (!value.tokens || typeof value.tokens !== "object") return null;
    return {
      accounts: value.accounts,
      signedInIds: value.signedInIds,
      activeId: typeof value.activeId === "string" ? value.activeId : null,
      tokens: value.tokens,
    };
  } catch {
    return null;
  }
}

function persistState(state: SessionState) {
  if (typeof window === "undefined") return;
  if (state.signedInIds.length === 0) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(state));
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
      seguidores: 0,
    },
    publishedIds: [],
    testedIds: [],
    notifications: u.notificacoes,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);
  const [ready, setReady] = useState(false);
  const [pendingRecoveryCode, setPendingRecoveryCode] = useState<string | null>(null);

  const commit = useCallback((next: SessionState) => {
    persistState(next);
    saveToken(next.activeId ? (next.tokens[next.activeId] ?? null) : null);
    setState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const stored = readStoredState();
      const legacyToken = getToken();
      const candidates = stored
        ? stored.signedInIds.flatMap((id) => {
            const token = stored.tokens[id];
            return token ? [[id, token] as const] : [];
          })
        : legacyToken
          ? [["legacy", legacyToken] as const]
          : [];
      const checked = await Promise.all(
        candidates.map(async ([, token]) => {
          try {
            const user = await api<ApiUser>("/api/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            return { account: toAccount(user), token };
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;
      const valid = checked.filter(
        (item): item is { account: Account; token: string } => item !== null,
      );
      const accounts = [...new Map(valid.map((item) => [item.account.id, item.account])).values()];
      const tokens = Object.fromEntries(valid.map((item) => [item.account.id, item.token]));
      const signedInIds = accounts.map((account) => account.id);
      const activeId =
        stored?.activeId && signedInIds.includes(stored.activeId)
          ? stored.activeId
          : (signedInIds[0] ?? null);
      commit({ accounts, signedInIds, activeId, tokens });
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
          token: string;
          usuario: ApiUser;
          codigoRecuperacao?: string | null;
        }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, senha: password }) });
        saveToken(data.token);
        const account = toAccount(data.usuario);
        commit({
          accounts: [...state.accounts.filter((item) => item.id !== account.id), account],
          signedInIds: [...state.signedInIds.filter((id) => id !== account.id), account.id],
          activeId: account.id,
          tokens: { ...state.tokens, [account.id]: data.token },
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
          token: string;
          usuario: ApiUser;
          codigoRecuperacao?: string | null;
        }>("/api/auth/cadastro", {
          method: "POST",
          body: JSON.stringify({ nome: name, email, senha: password }),
        });
        saveToken(data.token);
        const account = toAccount(data.usuario);
        commit({
          accounts: [...state.accounts.filter((item) => item.id !== account.id), account],
          signedInIds: [...state.signedInIds.filter((id) => id !== account.id), account.id],
          activeId: account.id,
          tokens: { ...state.tokens, [account.id]: data.token },
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
    commit(initialState);
  }, [commit]);

  const switchAccount = useCallback(
    (id: string) => {
      if (!state.signedInIds.includes(id) || !state.tokens[id] || id === state.activeId) return;
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
    const tokens = { ...state.tokens };
    delete tokens[id];
    commit({
      accounts: state.accounts.filter((a) => a.id !== id),
      signedInIds,
      activeId: signedInIds[0] ?? null,
      tokens,
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
    deleteAccount,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
