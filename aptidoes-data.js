/** Catálogo de aptidões / hijutsus — Shinobi no Sho (editável) */
export const APT_CATALOG = [
  {
    id: "acuidade",
    nome: "Acuidade",
    gratis: true,
    desc: "Usa Destreza no lugar de Força no CC corpo a corpo com armas ágeis.",
    mods: [{ tipo: "combat", alvo: "cc", valor: 0, nota: "troca atributo base" }],
  },
  {
    id: "reflexos",
    nome: "Reflexos",
    gratis: true,
    desc: "+1 ESQ",
    mods: [{ tipo: "combat", alvo: "esq", valor: 1 }],
  },
  {
    id: "olho_aguia",
    nome: "Olho de Águia",
    gratis: true,
    desc: "+1 CD e +1 Procurar",
    mods: [
      { tipo: "combat", alvo: "cd", valor: 1 },
      { tipo: "pericia", alvo: "Procurar", valor: 1 },
    ],
  },
  {
    id: "passos_silenciosos",
    nome: "Passos Silenciosos",
    gratis: true,
    desc: "+1 Furtividade",
    mods: [{ tipo: "pericia", alvo: "Furtividade", valor: 1 }],
  },
  {
    id: "resistente",
    nome: "Resistente",
    gratis: true,
    desc: "+1 Vigor efetivo em cálculos de Vitalidade (bônus de combate)",
    mods: [{ tipo: "attr", alvo: "vigor", valor: 1 }],
  },
  {
    id: "mente_afiada",
    nome: "Mente Afiada",
    gratis: true,
    desc: "+1 Inteligência efetiva em perícias mentais",
    mods: [{ tipo: "attr", alvo: "inteligencia", valor: 1 }],
  },
  {
    id: "espirito_firme",
    nome: "Espírito Firme",
    gratis: true,
    desc: "+1 Espírito (chakra / vontade)",
    mods: [{ tipo: "attr", alvo: "espirito", valor: 1 }],
  },
  {
    id: "iniciativa_rapida",
    nome: "Iniciativa Rápida",
    gratis: true,
    desc: "+1 Prontidão e +1 LM",
    mods: [
      { tipo: "pericia", alvo: "Prontidão", valor: 1 },
      { tipo: "combat", alvo: "lm", valor: 1 },
    ],
  },
  {
    id: "elemento_katon",
    nome: "Elemento Natural: Katon",
    gratis: false,
    desc: "Afinidade fogo — +1 em poderes Katon (marque no poder)",
    mods: [],
  },
  {
    id: "elemento_suiton",
    nome: "Elemento Natural: Suiton",
    gratis: false,
    desc: "Afinidade água",
    mods: [],
  },
  {
    id: "elemento_futon",
    nome: "Elemento Natural: Futon",
    gratis: false,
    desc: "Afinidade vento",
    mods: [],
  },
  {
    id: "elemento_doton",
    nome: "Elemento Natural: Doton",
    gratis: false,
    desc: "Afinidade terra",
    mods: [],
  },
  {
    id: "elemento_raiton",
    nome: "Elemento Natural: Raiton",
    gratis: false,
    desc: "Afinidade raio",
    mods: [],
  },
  {
    id: "byakugan",
    nome: "Byakugan (Hijutsu)",
    gratis: false,
    desc: "+2 LM, +1 Percepção",
    mods: [
      { tipo: "combat", alvo: "lm", valor: 2 },
      { tipo: "attr", alvo: "percepcao", valor: 1 },
    ],
  },
  {
    id: "sharingan",
    nome: "Sharingan (Hijutsu)",
    gratis: false,
    desc: "+1 LM, +1 ESQ",
    mods: [
      { tipo: "combat", alvo: "lm", valor: 1 },
      { tipo: "combat", alvo: "esq", valor: 1 },
    ],
  },
];

export const ATTR_TARGETS = [
  { id: "forca", label: "Força" },
  { id: "destreza", label: "Destreza" },
  { id: "agilidade", label: "Agilidade" },
  { id: "percepcao", label: "Percepção" },
  { id: "inteligencia", label: "Inteligência" },
  { id: "vigor", label: "Vigor" },
  { id: "espirito", label: "Espírito" },
];

export const COMBAT_TARGETS = [
  { id: "cc", label: "CC" },
  { id: "cd", label: "CD" },
  { id: "esq", label: "ESQ" },
  { id: "lm", label: "LM" },
];
