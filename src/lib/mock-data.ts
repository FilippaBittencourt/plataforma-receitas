export type Criteria = {
  medidas: number;
  tempo: number;
  rendimento: number;
  clareza: number;
  resultado: number;
};

export type Review = {
  id: string;
  author: string;
  initials: string;
  date: string;
  rating: number;
  success: boolean;
  text: string;
  criteria: Criteria;
  photo?: string;
};

export type Recipe = {
  id: string;
  title: string;
  author: string;
  authorHandle: string;
  authorId?: string | null;
  image: string;
  hasPhoto?: boolean;
  category: string;
  categorySlug?: string;
  difficulty: "Fácil" | "Médio" | "Avançado";
  rating: number;
  reviewsCount: number;
  successRate: number;
  testedCount: number;
  verified: boolean;
  timeMinutes: number;
  yield: string;
  summary: string;
  ingredients: string[];
  steps: string[];
  criteria: Criteria;
  communityPhotos: string[];
  reviews: Review[];
};

export const categories = [
  { id: "doces", label: "Doces", count: 482 },
  { id: "paes", label: "Pães", count: 213 },
  { id: "massas", label: "Massas", count: 318 },
  { id: "carnes", label: "Carnes", count: 264 },
  { id: "vegetariano", label: "Vegetariano", count: 197 },
  { id: "bebidas", label: "Bebidas", count: 124 },
];

export const criteriaLabels: { key: keyof Criteria; label: string; hint: string }[] = [
  { key: "medidas", label: "Precisão das medidas", hint: "As quantidades bateram na prática?" },
  { key: "tempo", label: "Tempo de preparo", hint: "O tempo informado é realista?" },
  { key: "rendimento", label: "Rendimento", hint: "Rendeu o que foi prometido?" },
  { key: "clareza", label: "Clareza das instruções", hint: "Deu para seguir sem dúvidas?" },
  { key: "resultado", label: "Resultado final", hint: "O prato ficou como esperado?" },
];

export type Role = "membro" | "moderador";

export type Account = {
  id: string;
  name: string;
  handle: string;
  email: string;
  bio: string;
  fotoPerfil?: string | null;
  since: string;
  role: Role;
  stats: { publicadas: number; avaliacoes: number; testadas: number; seguidores: number };
  publishedIds: string[];
  testedIds: string[];
  notifications: { avaliacoes: boolean; comentarios: boolean; novidades: boolean };
};

// Contas de demonstração disponíveis como atalhos na tela de login.
export const demoAccounts: Account[] = [
  {
    id: "u-julia",
    name: "Júlia Ferraz",
    handle: "@juliaferraz",
    email: "julia@cookie.com",
    bio: "Testo receitas nos fins de semana e anoto tudo. Confio em medidas em gramas.",
    since: "Membro desde 2024",
    role: "membro",
    stats: { publicadas: 12, avaliacoes: 87, testadas: 64, seguidores: 1240 },
    publishedIds: [],
    testedIds: [],
    notifications: { avaliacoes: true, comentarios: true, novidades: false },
  },
  {
    id: "u-moderacao",
    name: "Equipe de Moderação",
    handle: "@moderacao",
    email: "moderacao@cookie.com",
    bio: "Curadoria de receitas, fotos e links externos.",
    since: "Membro desde 2023",
    role: "moderador",
    stats: { publicadas: 0, avaliacoes: 312, testadas: 140, seguidores: 86 },
    publishedIds: [],
    testedIds: [],
    notifications: { avaliacoes: false, comentarios: true, novidades: true },
  },
];

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export const moderationUsers = [
  {
    id: "mu1",
    name: "usuario_2381",
    handle: "@usuario_2381",
    reports: 4,
    reason: "Comentários ofensivos em 3 receitas",
    status: "ativo" as const,
  },
  {
    id: "mu2",
    name: "Receitas Rápidas BR",
    handle: "@receitasrapidasbr",
    reports: 2,
    reason: "Links externos repetidos (possível spam)",
    status: "ativo" as const,
  },
  {
    id: "mu3",
    name: "Gustavo Lemos",
    handle: "@gustavolemos",
    reports: 1,
    reason: "Avaliações negativas sem ter testado",
    status: "suspenso" as const,
  },
];

export const moderationQueue = [
  {
    id: "m1",
    type: "Receita" as const,
    title: "Bolo de cenoura sem glúten",
    author: "@camilarosa",
    reason: "Aguardando verificação de medidas",
    date: "Hoje, 09:12",
  },
  {
    id: "m2",
    type: "Comentário" as const,
    title: "“Essa receita é um lixo, não percam tempo”",
    author: "@usuario_2381",
    reason: "Denunciado por linguagem ofensiva",
    date: "Hoje, 08:40",
  },
  {
    id: "m3",
    type: "Foto" as const,
    title: "Foto de resultado — Risoto de funghi",
    author: "@diegofontes",
    reason: "Possível conteúdo não relacionado",
    date: "Ontem, 21:05",
  },
  {
    id: "m4",
    type: "Link externo" as const,
    title: "blogdacozinha.com/pao-de-queijo",
    author: "@marinaduarte",
    reason: "Link externo aguardando curadoria",
    date: "Ontem, 17:22",
  },
];
