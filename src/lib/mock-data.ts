import recipe1 from "@/assets/recipe-1.jpg";
import recipe2 from "@/assets/recipe-2.jpg";
import recipe3 from "@/assets/recipe-3.jpg";
import recipe4 from "@/assets/recipe-4.jpg";
import recipe5 from "@/assets/recipe-5.jpg";
import recipe6 from "@/assets/recipe-6.jpg";

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
  image: string;
  category: string;
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
  { id: "doces", label: "Doces", emoji: "🍮", count: 482 },
  { id: "paes", label: "Pães", emoji: "🥖", count: 213 },
  { id: "massas", label: "Massas", emoji: "🍝", count: 318 },
  { id: "carnes", label: "Carnes", emoji: "🥩", count: 264 },
  { id: "vegetariano", label: "Vegetariano", emoji: "🥗", count: 197 },
  { id: "bebidas", label: "Bebidas", emoji: "🧉", count: 124 },
];

const baseCriteria = (c: Partial<Criteria> = {}): Criteria => ({
  medidas: 4.6,
  tempo: 4.3,
  rendimento: 4.5,
  clareza: 4.7,
  resultado: 4.8,
  ...c,
});

export const recipes: Recipe[] = [
  {
    id: "cookies-caramelo",
    title: "Cookies de caramelo salgado",
    author: "Marina Duarte",
    authorHandle: "@marinaduarte",
    image: recipe1,
    category: "Doces",
    difficulty: "Fácil",
    rating: 4.9,
    reviewsCount: 1284,
    successRate: 96,
    testedCount: 1103,
    verified: true,
    timeMinutes: 45,
    yield: "18 cookies grandes",
    summary:
      "Bordas crocantes, centro macio e um caramelo salgado que não endurece na geladeira. Testada 1.103 vezes pela comunidade.",
    ingredients: [
      "220 g de manteiga sem sal, amolecida",
      "180 g de açúcar mascavo claro",
      "100 g de açúcar refinado",
      "2 ovos grandes (60 g cada)",
      "320 g de farinha de trigo",
      "1 colher de chá de bicarbonato de sódio",
      "200 g de chocolate meio amargo picado",
      "80 g de caramelo salgado firme",
      "Flor de sal para finalizar",
    ],
    steps: [
      "Bata a manteiga com os açúcares por 3 minutos, até clarear.",
      "Adicione os ovos um a um, batendo apenas para incorporar.",
      "Misture a farinha peneirada com o bicarbonato e incorpore com espátula.",
      "Junte o chocolate e os cubos de caramelo. Leve à geladeira por 30 minutos.",
      "Porcione bolas de 60 g e asse a 180 °C por 11 a 13 minutos.",
      "Finalize com flor de sal e deixe firmar 10 minutos na assadeira.",
    ],
    criteria: baseCriteria({ medidas: 4.9, tempo: 4.7, rendimento: 4.8, clareza: 4.9, resultado: 5 }),
    communityPhotos: [recipe1, recipe4, recipe6, recipe1],
    reviews: [
      {
        id: "r1",
        author: "Bruno Estevão",
        initials: "BE",
        date: "12 de agosto, 2026",
        rating: 5,
        success: true,
        text: "Segui exatamente as medidas e saíram idênticos à foto. O descanso de 30 min faz toda diferença no espalhamento.",
        criteria: baseCriteria({ medidas: 5, tempo: 5, resultado: 5 }),
        photo: recipe1,
      },
      {
        id: "r2",
        author: "Carla Menezes",
        initials: "CM",
        date: "3 de agosto, 2026",
        rating: 4,
        success: true,
        text: "Rendeu 16 e não 18 no meu porcionamento. Fora isso, instruções muito claras.",
        criteria: baseCriteria({ rendimento: 3.5, clareza: 5 }),
      },
      {
        id: "r3",
        author: "Yasmin Prado",
        initials: "YP",
        date: "28 de julho, 2026",
        rating: 5,
        success: true,
        text: "Fiz com chocolate 70% e ficou perfeito. O caramelo realmente não endurece depois de frio.",
        criteria: baseCriteria(),
        photo: recipe4,
      },
    ],
  },
  {
    id: "risoto-funghi",
    title: "Risoto de funghi cremoso",
    author: "Chef Otávio Lima",
    authorHandle: "@otaviolima",
    image: recipe2,
    category: "Massas",
    difficulty: "Médio",
    rating: 4.7,
    reviewsCount: 862,
    successRate: 91,
    testedCount: 741,
    verified: true,
    timeMinutes: 50,
    yield: "4 porções",
    summary:
      "Cremosidade sem creme de leite: a técnica de mantecatura está descrita passo a passo com tempos reais de cozimento.",
    ingredients: [
      "320 g de arroz arbóreo",
      "30 g de funghi secchi hidratados",
      "1,2 L de caldo de legumes quente",
      "1 cebola pequena picada fina",
      "120 ml de vinho branco seco",
      "60 g de manteiga gelada",
      "70 g de parmesão ralado",
    ],
    steps: [
      "Hidrate o funghi em 200 ml de água morna por 20 minutos e reserve a água.",
      "Refogue a cebola na manteiga até translúcida, junte o arroz e toste por 2 minutos.",
      "Deglaceie com o vinho e deixe evaporar completamente.",
      "Adicione o caldo em conchas, mexendo, por cerca de 17 minutos.",
      "Desligue o fogo e mantecate com manteiga gelada e parmesão.",
    ],
    criteria: baseCriteria({ medidas: 4.6, tempo: 4.2, rendimento: 4.6, clareza: 4.8, resultado: 4.8 }),
    communityPhotos: [recipe2, recipe5, recipe2],
    reviews: [
      {
        id: "r1",
        author: "Helena Ruiz",
        initials: "HR",
        date: "9 de agosto, 2026",
        rating: 5,
        success: true,
        text: "O tempo de 17 minutos bateu certinho com o meu fogão. Ficou no ponto de onda.",
        criteria: baseCriteria(),
        photo: recipe2,
      },
      {
        id: "r2",
        author: "Diego Fontes",
        initials: "DF",
        date: "22 de julho, 2026",
        rating: 4,
        success: false,
        text: "Precisei de mais 300 ml de caldo do que o indicado. Talvez dependa da panela.",
        criteria: baseCriteria({ medidas: 3.5, tempo: 3.8 }),
      },
    ],
  },
  {
    id: "pao-rustico",
    title: "Pão rústico de fermentação natural",
    author: "Padaria Vila Bela",
    authorHandle: "@vilabela",
    image: recipe3,
    category: "Pães",
    difficulty: "Avançado",
    rating: 4.5,
    reviewsCount: 517,
    successRate: 78,
    testedCount: 604,
    verified: true,
    timeMinutes: 240,
    yield: "1 pão de 900 g",
    summary:
      "Cronograma completo de 20 horas com pontos de verificação visuais em cada etapa da fermentação.",
    ingredients: [
      "500 g de farinha de trigo tipo 1",
      "350 g de água filtrada (70% hidratação)",
      "100 g de levain ativo",
      "10 g de sal",
    ],
    steps: [
      "Autólise: misture farinha e água e descanse 40 minutos.",
      "Incorpore o levain e o sal, fazendo dobras a cada 30 minutos por 3 horas.",
      "Modele, coloque no banneton e leve à geladeira por 12 a 16 horas.",
      "Asse em panela de ferro a 250 °C: 20 minutos tampado, 20 minutos destampado.",
    ],
    criteria: baseCriteria({ medidas: 4.7, tempo: 3.9, rendimento: 4.5, clareza: 4.4, resultado: 4.6 }),
    communityPhotos: [recipe3, recipe3],
    reviews: [
      {
        id: "r1",
        author: "Paulo Nakamura",
        initials: "PN",
        date: "30 de julho, 2026",
        rating: 4,
        success: false,
        text: "Meu levain estava fraco e o alveolado não abriu. A receita avisa sobre isso, culpa minha.",
        criteria: baseCriteria({ clareza: 4.5, resultado: 3.5 }),
      },
    ],
  },
  {
    id: "brigadeiro-belga",
    title: "Brigadeiro gourmet de chocolate belga",
    author: "Lia Fontenele",
    authorHandle: "@liafontenele",
    image: recipe4,
    category: "Doces",
    difficulty: "Fácil",
    rating: 4.8,
    reviewsCount: 964,
    successRate: 94,
    testedCount: 880,
    verified: true,
    timeMinutes: 30,
    yield: "30 unidades",
    summary: "Ponto de enrolar explicado com tempo e temperatura, sem tentativa e erro.",
    ingredients: [
      "395 g de leite condensado",
      "30 g de manteiga",
      "150 g de chocolate belga 54%",
      "1 pitada de sal",
    ],
    steps: [
      "Derreta o chocolate em banho-maria e reserve.",
      "Cozinhe leite condensado e manteiga em fogo médio por 8 minutos.",
      "Incorpore o chocolate fora do fogo e volte por 2 minutos.",
      "Resfrie por 3 horas em superfície fria antes de enrolar.",
    ],
    criteria: baseCriteria({ medidas: 4.8, tempo: 4.6, rendimento: 4.7, clareza: 4.9, resultado: 4.9 }),
    communityPhotos: [recipe4, recipe4, recipe1],
    reviews: [
      {
        id: "r1",
        author: "Sofia Barreto",
        initials: "SB",
        date: "1 de agosto, 2026",
        rating: 5,
        success: true,
        text: "Rendeu exatamente 30 unidades de 15 g. Raro uma receita acertar o rendimento.",
        criteria: baseCriteria({ rendimento: 5 }),
        photo: recipe4,
      },
    ],
  },
  {
    id: "lasanha-domingo",
    title: "Lasanha de domingo à bolonhesa",
    author: "Nonna Rosa",
    authorHandle: "@nonnarosa",
    image: recipe5,
    category: "Massas",
    difficulty: "Médio",
    rating: 4.6,
    reviewsCount: 733,
    successRate: 89,
    testedCount: 655,
    verified: false,
    timeMinutes: 150,
    yield: "8 porções",
    summary: "Molho de 2 horas, béchamel na medida certa e montagem em 5 camadas.",
    ingredients: [
      "500 g de carne moída (patinho)",
      "700 g de molho de tomate italiano",
      "500 ml de leite integral",
      "40 g de farinha e 40 g de manteiga",
      "250 g de massa fresca para lasanha",
      "200 g de muçarela",
    ],
    steps: [
      "Doure a carne em fogo alto sem mexer demais.",
      "Cozinhe o molho por 2 horas em fogo baixo.",
      "Prepare o béchamel e tempere com noz-moscada.",
      "Monte 5 camadas e asse a 190 °C por 40 minutos.",
    ],
    criteria: baseCriteria({ medidas: 4.4, tempo: 4.1, rendimento: 4.6, clareza: 4.5, resultado: 4.8 }),
    communityPhotos: [recipe5, recipe5],
    reviews: [
      {
        id: "r1",
        author: "Tiago Alencar",
        initials: "TA",
        date: "15 de julho, 2026",
        rating: 5,
        success: true,
        text: "As 2 horas de molho fazem diferença real. Serviu 8 pessoas sem sobra.",
        criteria: baseCriteria(),
        photo: recipe5,
      },
    ],
  },
  {
    id: "torta-limao",
    title: "Torta de limão siciliano com merengue",
    author: "Ana Sayuri",
    authorHandle: "@anasayuri",
    image: recipe6,
    category: "Doces",
    difficulty: "Médio",
    rating: 4.4,
    reviewsCount: 421,
    successRate: 83,
    testedCount: 398,
    verified: false,
    timeMinutes: 90,
    yield: "1 torta de 24 cm",
    summary: "Creme que não talha e merengue suíço estável por 48 horas.",
    ingredients: [
      "200 g de biscoito amanteigado",
      "90 g de manteiga derretida",
      "395 g de leite condensado",
      "120 ml de suco de limão siciliano",
      "3 claras e 180 g de açúcar",
    ],
    steps: [
      "Processe o biscoito com a manteiga e forre a forma. Asse 10 minutos.",
      "Misture leite condensado e suco até engrossar e leve à geladeira por 4 horas.",
      "Faça o merengue suíço a 65 °C e cubra a torta.",
      "Doure levemente com maçarico.",
    ],
    criteria: baseCriteria({ medidas: 4.2, tempo: 4.3, rendimento: 4.4, clareza: 4.3, resultado: 4.6 }),
    communityPhotos: [recipe6, recipe6],
    reviews: [
      {
        id: "r1",
        author: "Renata Vilas",
        initials: "RV",
        date: "20 de julho, 2026",
        rating: 4,
        success: true,
        text: "O merengue aguentou dois dias na geladeira como prometido.",
        criteria: baseCriteria(),
      },
    ],
  },
];

export const criteriaLabels: { key: keyof Criteria; label: string; hint: string }[] = [
  { key: "medidas", label: "Precisão das medidas", hint: "As quantidades bateram na prática?" },
  { key: "tempo", label: "Tempo de preparo", hint: "O tempo informado é realista?" },
  { key: "rendimento", label: "Rendimento", hint: "Rendeu o que foi prometido?" },
  { key: "clareza", label: "Clareza das instruções", hint: "Deu para seguir sem dúvidas?" },
  { key: "resultado", label: "Resultado final", hint: "O prato ficou como esperado?" },
];

export function getRecipe(id: string) {
  return recipes.find((r) => r.id === id);
}

export const currentUser = {
  name: "Júlia Ferraz",
  handle: "@juliaferraz",
  initials: "JF",
  bio: "Testo receitas nos fins de semana e anoto tudo. Confio em medidas em gramas.",
  since: "Membro desde 2024",
  stats: { publicadas: 12, avaliacoes: 87, testadas: 64, seguidores: 1240 },
};

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
