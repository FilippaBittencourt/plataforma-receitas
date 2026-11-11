import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Account } from "@/lib/mock-data";
import { api, getToken, saveToken, type ApiUser } from "@/lib/api";

type SessionState = {
  accounts: Account[];
  signedInIds: string[];
  activeId: string | null;
};

type AuthResult = { ok: true; user: Account; recoveryCode?: string } | { ok: false; error: string };

type AuthContextValue = {
  ready: boolean;
  user: Account | null;
  pendingRecoveryCode: string | null;
  dismissRecoveryCode: () => void;
  signedInAccounts: Account[];
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (data: { name: string; email: string; password: string }) => Promise<AuthResult>;
  logout: () => void;
  switchAccount: (id: string) => void;
  updateUser: (patch: Partial<Omit<Account, "id" | "role">>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  emailInUse: (email: string) => boolean;
};

const initialState: SessionState = { accounts: [], signedInIds: [], activeId: null };

function toAccount(u: ApiUser): Account {
  return { id: String(u.id), name: u.nome, handle: u.nomeUsuario.startsWith("@") ? u.nomeUsuario : `@${u.nomeUsuario}`,
    email: u.email, bio: u.bio ?? "", since: `Membro desde ${new Date(u.dataCadastro).getFullYear()}`,
    role: u.tipo === "ADMINISTRADOR" ? "moderador" : "membro",
    fotoPerfil: u.fotoPerfil,
    stats: { publicadas: u.estatisticas.receitasPublicadas, avaliacoes: u.estatisticas.avaliacoes, testadas: u.estatisticas.avaliacoes, seguidores: 0 },
    publishedIds: [], testedIds: [], notifications: u.notificacoes };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);
  const [ready, setReady] = useState(false);
  const [pendingRecoveryCode, setPendingRecoveryCode] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (token) api<ApiUser>("/api/me").then((me) => setState({ accounts: [toAccount(me)], signedInIds: [String(me.id)], activeId: String(me.id) }))
      .catch(() => saveToken(null)).finally(() => setReady(true));
    else { setState(initialState); setReady(true); }

  }, []);

  const commit = useCallback((next: SessionState) => {
    setState(next);
  }, []);

  const signIn = useCallback(
    (current: SessionState, account: Account, accounts = current.accounts): SessionState => ({
      accounts,
      signedInIds: current.signedInIds.includes(account.id)
        ? current.signedInIds
        : [...current.signedInIds, account.id],
      activeId: account.id,
    }),
    [],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const data = await api<{ token: string; usuario: ApiUser; codigoRecuperacao?: string | null }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, senha: password }) });
        saveToken(data.token); const account = toAccount(data.usuario); commit({ accounts: [account], signedInIds: [account.id], activeId: account.id });
        if (data.codigoRecuperacao) setPendingRecoveryCode(data.codigoRecuperacao);
        return { ok: true, user: account, ...(data.codigoRecuperacao ? { recoveryCode: data.codigoRecuperacao } : {}) };
      } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Falha ao entrar." }; }
    },
    [state, commit, signIn],
  );

  const signup = useCallback(
    async ({ name, email, password }: { name: string; email: string; password: string }): Promise<AuthResult> => {
      try {
        const data = await api<{ token: string; usuario: ApiUser; codigoRecuperacao?: string | null }>("/api/auth/cadastro", { method: "POST", body: JSON.stringify({ nome: name, email, senha: password }) });
        saveToken(data.token); const account = toAccount(data.usuario); commit({ accounts: [account], signedInIds: [account.id], activeId: account.id });
        if (data.codigoRecuperacao) setPendingRecoveryCode(data.codigoRecuperacao);
        return { ok: true, user: account, ...(data.codigoRecuperacao ? { recoveryCode: data.codigoRecuperacao } : {}) };
      } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Falha ao criar conta." }; }
    },
    [state, commit, signIn],
  );

  const logout = useCallback(() => {
    saveToken(null);
    commit({ ...state, signedInIds: [], activeId: null });
  }, [state, commit]);

  const switchAccount = useCallback(
    (id: string) => {
      if (!state.signedInIds.includes(id)) return;
      commit({ ...state, activeId: id });
    },
    [state, commit],
  );

  const updateUser = useCallback(
    async (patch: Partial<Omit<Account, "id" | "role">>) => {
      if (!state.activeId) return;
      const current = state.accounts.find(a => a.id === state.activeId);
      if (!current) return;
      const profile = await api<ApiUser>("/api/me", { method: "PATCH", body: JSON.stringify({ nome: patch.name ?? current.name, nomeUsuario: patch.handle ?? current.handle, bio: patch.bio ?? current.bio, fotoPerfil: patch.fotoPerfil === undefined ? current.fotoPerfil ?? null : patch.fotoPerfil }) });
      const updated = toAccount(profile);
      commit({
        ...state,
        accounts: [updated],
      });
    },
    [state, commit],
  );

  const deleteAccount = useCallback(async () => {
    if (!state.activeId) return;
    await api("/api/me", { method: "DELETE" });
    saveToken(null);
    const id = state.activeId;
    commit({
      accounts: state.accounts.filter((a) => a.id !== id),
      signedInIds: state.signedInIds.filter((x) => x !== id),
      activeId: null,
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
  }, [state, ready, pendingRecoveryCode, login, signup, logout, switchAccount, updateUser, deleteAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

// Só aceita caminhos internos, para o ?redirect= não virar redirecionamento aberto.
export function safeRedirect(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : undefined;
}
