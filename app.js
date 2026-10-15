/**
 * Shinobi no Sho — Extensão Owlbear Rodeo
 * Ficha + Bingo Book + rolagem 2d8 (perícias, combate, poderes, dano)
 */

import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3";

/** Catálogo embutido de aptidões */
const APT_CATALOG = [
  { id:"acuidade", nome:"Acuidade", gratis:true, desc:"Armas ágeis usam Des no CC", mods:[] },
  { id:"reflexos", nome:"Reflexos", gratis:true, desc:"+1 ESQ", mods:[{tipo:"combat",alvo:"esq",valor:1,ativo:true}] },
  { id:"olho_aguia", nome:"Olho de Águia", gratis:true, desc:"+1 CD +1 Procurar", mods:[{tipo:"combat",alvo:"cd",valor:1,ativo:true},{tipo:"pericia",alvo:"Procurar",valor:1,ativo:true}] },
  { id:"passos_silenciosos", nome:"Passos Silenciosos", gratis:true, desc:"+1 Furtividade", mods:[{tipo:"pericia",alvo:"Furtividade",valor:1,ativo:true}] },
  { id:"resistente", nome:"Resistente", gratis:true, desc:"+1 Vigor", mods:[{tipo:"attr",alvo:"vigor",valor:1,ativo:true}] },
  { id:"mente_afiada", nome:"Mente Afiada", gratis:true, desc:"+1 Inteligência", mods:[{tipo:"attr",alvo:"inteligencia",valor:1,ativo:true}] },
  { id:"espirito_firme", nome:"Espírito Firme", gratis:true, desc:"+1 Espírito", mods:[{tipo:"attr",alvo:"espirito",valor:1,ativo:true}] },
  { id:"iniciativa_rapida", nome:"Iniciativa Rápida", gratis:true, desc:"+1 Prontidão +1 LM", mods:[{tipo:"pericia",alvo:"Prontidão",valor:1,ativo:true},{tipo:"combat",alvo:"lm",valor:1,ativo:true}] },
  { id:"byakugan", nome:"Byakugan", gratis:false, desc:"+2 LM +1 Percepção", mods:[{tipo:"combat",alvo:"lm",valor:2,ativo:true},{tipo:"attr",alvo:"percepcao",valor:1,ativo:true}] },
  { id:"sharingan", nome:"Sharingan", gratis:false, desc:"+1 LM +1 ESQ", mods:[{tipo:"combat",alvo:"lm",valor:1,ativo:true},{tipo:"combat",alvo:"esq",valor:1,ativo:true}] },
  { id:"elemento_katon", nome:"Elemento: Katon", gratis:false, desc:"Afinidade fogo", mods:[] },
  { id:"elemento_suiton", nome:"Elemento: Suiton", gratis:false, desc:"Afinidade água", mods:[] },
  { id:"elemento_futon", nome:"Elemento: Futon", gratis:false, desc:"Afinidade vento", mods:[] },
  { id:"elemento_doton", nome:"Elemento: Doton", gratis:false, desc:"Afinidade terra", mods:[] },
  { id:"elemento_raiton", nome:"Elemento: Raiton", gratis:false, desc:"Afinidade raio", mods:[] },
];

function emptyAptCustom() {
  return {
    id: "custom_" + crypto.randomUUID().slice(0, 8),
    nome: "Aptidão custom",
    gratis: false,
    desc: "",
    selected: true,
    mods: [], // adiciona um a um
  };
}

const MOD_ATTR = ["forca","destreza","agilidade","percepcao","inteligencia","vigor","espirito"];
const MOD_COMBAT = ["cc","cd","esq","lm"];
const MOD_PER = ["Acrobacia","Arte","Atletismo","Concentração","Furtividade","Medicina","Prontidão","Procurar","Rastrear"];

function targetsForTipo(tipo) {
  if (tipo === "attr") return MOD_ATTR;
  if (tipo === "combat") return MOD_COMBAT;
  return MOD_PER;
}

/** Soma bônus ativos das aptidões selecionadas */
function sumMods(c, tipo, alvo) {
  let t = 0;
  const list = c.aptidoesSel || [];
  for (const a of list) {
    if (!a.selected) continue;
    for (const m of a.mods || []) {
      if (m.ativo === false) continue;
      if (m.tipo === tipo && String(m.alvo).toLowerCase() === String(alvo).toLowerCase()) {
        t += +m.valor || 0;
      }
    }
  }
  return t;
}

function attrEfetivo(c, key) {
  return (c[key] || 0) + sumMods(c, "attr", key);
}

/** Pontos de poder gastos em jutsus (nível de cada poder) */
function poderGastoJutsus(c) {
  let t = 0;
  for (const p of c.poderes || []) {
    t += Math.max(1, +p.nivel || 1);
  }
  return t;
}

/** Aptidões além das 3 gratuitas custam 2 pts de poder cada (manual) */
function aptExtraCount(c) {
  const list = (c.aptidoesSel || []).filter((a) => a.selected !== false);
  const gratis = list.filter((a) => a.gratis).length;
  const pagas = list.filter((a) => !a.gratis).length;
  // excesso de gratuitas + todas as pagas
  const excessGratis = Math.max(0, gratis - 3);
  return excessGratis + pagas;
}

function poderGastoApt(c) {
  return aptExtraCount(c) * 2;
}

function poderGastoTotal(c) {
  return poderGastoJutsus(c) + poderGastoApt(c);
}

function poderDisponivel(c) {
  return pointsForNc(c.nc || 4).poderes;
}



const META_KEY = "com.shinobinosho.ficha/v2";
const TOKEN_META = "com.shinobinosho.ficha/character";
const SELECTED_KEY = "com.shinobinosho.ficha/selectedToken";
const OPEN_FLAG = "com.shinobinosho.ficha/openRequest";
const BIND_FLAG = "com.shinobinosho.ficha/bindRequest";
const ATTRS = [
  { key: "forca", label: "Força", short: "For" },
  { key: "destreza", label: "Destreza", short: "Des" },
  { key: "agilidade", label: "Agilidade", short: "Agi" },
  { key: "percepcao", label: "Percepção", short: "Per" },
  { key: "inteligencia", label: "Inteligência", short: "Int" },
  { key: "vigor", label: "Vigor", short: "Vig" },
  { key: "espirito", label: "Espírito", short: "Esp" },
];

const PERICIAS = [
  { nome: "Acrobacia", atr: "agilidade" },
  { nome: "Arte", atr: "inteligencia" },
  { nome: "Atletismo", atr: "forca" },
  { nome: "Ciências Naturais", atr: "inteligencia" },
  { nome: "Concentração", atr: "inteligencia" },
  { nome: "Cultura", atr: "inteligencia" },
  { nome: "Disfarces", atr: "percepcao" },
  { nome: "Escapar", atr: "destreza" },
  { nome: "Furtividade", atr: "agilidade" },
  { nome: "Lidar c/ Animais", atr: "percepcao" },
  { nome: "Mecanismos", atr: "inteligencia" },
  { nome: "Medicina", atr: "inteligencia" },
  { nome: "Ocultismo", atr: "inteligencia" },
  { nome: "Prestidigitação", atr: "destreza" },
  { nome: "Procurar", atr: "percepcao" },
  { nome: "Prontidão", atr: "percepcao" },
  { nome: "Rastrear", atr: "percepcao" },
  { nome: "Venefício", atr: "inteligencia" },
];

const SHINOBI_NC = {
  Estudante: 4, Genin: 4, Chuunin: 8, "Jounin Especial": 10,
  Jounin: 12, "Jounin Elite": 16, "Sannin/Kage": 20,
};

function pointsForNc(nc) {
  nc = Math.max(4, Math.min(20, +nc || 4));
  const atr = 12 + 6 * (nc - 4);
  const per = 8 + 4 * (nc - 4);
  let pod = 4 + 2 * (nc - 4);
  if (nc >= 20) pod = 40;
  let mini = 0;
  if (nc <= 4) mini = 0;
  else if (nc <= 6) mini = 1;
  else if (nc <= 8) mini = 2;
  else if (nc <= 10) mini = 3;
  else if (nc <= 12) mini = 4;
  else if (nc <= 14) mini = 5;
  else if (nc <= 16) mini = 6;
  else if (nc <= 18) mini = 7;
  else mini = 8;
  return { atributos: atr, pericias: per, poderes: pod, minimo: mini, maxAtr: nc, limite: nc >> 1 };
}

function blankChar() {
  const c = {
    id: crypto.randomUUID(),
    linkedTokenId: null,
    ownerId: null,
    ownerName: "",
    nome: "", cla: "", nivel: "Genin", nc: 4, vila: "Konoha", funcao: "", ameaca: "C",
    forca: 0, destreza: 0, agilidade: 0, percepcao: 0, inteligencia: 0, vigor: 0, espirito: 0,
    baseCc: 3, baseCd: 3, baseEsq: 3, baseLm: 3,
    pericias: {}, poderes: [], aptidoes: "", notas: "", vitAtual: null, chaAtual: null,
  };
  PERICIAS.forEach((p) => { c.pericias[p.nome] = 0; });
  return c;
}

function vitMax(c) { return 10 + 3 * attrEfetivo(c, "vigor") + 5 * (c.nc || 4); }
function chaMax(c) { return 10 + 3 * attrEfetivo(c, "espirito"); }
function hab(c, baseKey, atrKey) {
  const combatKey = baseKey === "baseCc" ? "cc" : baseKey === "baseCd" ? "cd" : baseKey === "baseEsq" ? "esq" : "lm";
  return (c[baseKey] ?? 3) + attrEfetivo(c, atrKey) + sumMods(c, "combat", combatKey);
}
function perTotal(c, nome, atr) {
  return (c.pericias?.[nome] || 0) + Math.ceil(attrEfetivo(c, atr) / 2) + sumMods(c, "pericia", nome);
}

let characters = [];
let current = blankChar();
let obrReady = false;
let editingPower = -1;
let myPlayerId = null;
let myRole = "PLAYER"; // GM | PLAYER
let myName = "";

function loadLocal() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) characters = JSON.parse(raw) || [];
  } catch { characters = []; }
}
function saveLocal() { localStorage.setItem(META_KEY, JSON.stringify(characters)); }
async function saveObr() {
  if (!obrReady) return;
  try { await OBR.player.setMetadata({ [META_KEY]: characters }); } catch {}
}
async function loadObr() {
  if (!obrReady) return;
  try {
    const meta = await OBR.player.getMetadata();
    if (meta?.[META_KEY] && Array.isArray(meta[META_KEY])) {
      characters = meta[META_KEY];
      saveLocal();
    }
  } catch {}
}

function isGM() {
  return myRole === "GM";
}

/** Jogador só acessa a própria ficha; GM acessa todas */
function canAccess(c) {
  if (!c) return false;
  if (!obrReady) return true;
  if (isGM()) return true;
  if (!c.ownerId) return true;
  return c.ownerId === myPlayerId;
}

function canEdit(c) {
  if (!obrReady) return true; // modo local / antes do OBR
  return canAccess(c);
}

function claimOwnership(c) {
  if (!c) return;
  if (c.ownerId && c.ownerId !== myPlayerId && !isGM()) return;
  c.ownerId = myPlayerId;
  c.ownerName = myName || "Jogador";
}

function setReadOnly(ro) {
  const root = $("view-sheet");
  if (!root) return;
  root.querySelectorAll("input, select, textarea, button").forEach((el) => {
    if (el.id === "btn-bingo" || el.id === "btn-unbind-token") return;
    if (el.classList.contains("roll-btn")) {
      el.disabled = false; // rolagem liberada se pode ver
      return;
    }
    if (el.id === "btn-save" || el.id === "btn-bind-token" || el.id === "btn-add-power" || el.id === "btn-new") {
      el.disabled = ro;
      return;
    }
    if (el.tagName === "BUTTON") {
      el.disabled = ro && !el.classList.contains("roll-btn");
      return;
    }
    el.disabled = ro;
  });
  const lock = $("lock-banner");
  if (lock) {
    lock.classList.toggle("hidden", !ro);
    lock.textContent = ro
      ? "🔒 Ficha de outro jogador — somente leitura"
      : "";
  }
}


let _saveTimer = null;
/** Autosave com debounce — grava ~600ms após a última alteração */
function scheduleSave() {
  if (!canEdit(current)) return;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try { readSheet(); } catch {}
    persist();
  }, 600);
}

function persist() {
  if (!canEdit(current)) {
    setStatus("Sem permissão para editar esta ficha");
    return;
  }
  // Garante dono ao salvar
  if (!current.ownerId || current.ownerId === myPlayerId) {
    claimOwnership(current);
  }
  const i = characters.findIndex((c) => c.id === current.id);
  if (i >= 0) characters[i] = structuredClone(current);
  else if (current.nome?.trim()) characters.push(structuredClone(current));
  saveLocal();
  saveObr();
  // Salva também no token vinculado (se houver)
  if (current.linkedTokenId && obrReady) {
    saveToToken(current.linkedTokenId, current).then(() => {
      setStatus("Salvo no token ✓");
      updateTokenBadge();
    }).catch(() => setStatus("Salvo (token falhou)"));
  } else {
    setStatus("Salvo ✓");
  }
}

async function saveToToken(tokenId, data) {
  if (!obrReady || !tokenId) return;
  const payload = structuredClone(data);
  payload.linkedTokenId = tokenId;
  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (const item of items) {
      item.metadata[TOKEN_META] = payload;
      // nome no token ajuda o GM
      if (payload.nome && item.name !== undefined) {
        // não sobrescreve nome visual obrigatoriamente; só metadata
      }
    }
  });
}

async function loadFromToken(tokenId) {
  if (!obrReady || !tokenId) return null;
  const items = await OBR.scene.items.getItems([tokenId]);
  if (!items.length) return null;
  const meta = items[0].metadata?.[TOKEN_META];
  if (meta && typeof meta === "object") {
    const c = structuredClone(meta);
    c.linkedTokenId = tokenId;
    if (!c.id) c.id = crypto.randomUUID();
    normalize(c);
    return c;
  }
  // Token sem ficha: cria em branco já vinculada
  const c = blankChar();
  c.linkedTokenId = tokenId;
  // tenta usar o nome do item
  try {
    if (items[0].name) c.nome = items[0].name;
  } catch {}
  return c;
}

async function getSelectedTokenId() {
  if (!obrReady) return null;
  try {
    const meta = await OBR.player.getMetadata();
    if (meta?.[SELECTED_KEY]) return meta[SELECTED_KEY];
  } catch {}
  try {
    const sel = await OBR.player.getSelection?.();
    if (sel && sel.length === 1) return sel[0];
  } catch {}
  return null;
}

function updateTokenBadge() {
  const el = $("token-badge");
  if (!el) return;
  if (current.linkedTokenId) {
    el.textContent = "🔗 Token vinculado";
    el.className = "token-badge on";
  } else {
    el.textContent = "Sem token";
    el.className = "token-badge";
  }
}

async function bindToSelectedToken() {
  if (!canEdit(current)) {
    setStatus("Sem permissão para vincular esta ficha");
    return;
  }
  const tid = await getSelectedTokenId();
  if (!tid) {
    setStatus("Selecione um token de personagem no mapa");
    return;
  }
  // Se o token já tem ficha de outro dono, bloqueia
  const existing = await loadFromToken(tid);
  if (existing && existing.ownerId && existing.ownerId !== myPlayerId && !isGM()) {
    setStatus("🔒 Token já tem ficha de " + (existing.ownerName || "outro jogador"));
    return;
  }
  claimOwnership(current);
  current.linkedTokenId = tid;
  readSheet();
  await saveToToken(tid, current);
  persist();
  updateTokenBadge();
  setStatus("Ficha vinculada ao token · dono: " + (current.ownerName || "você"));
}

async function openFromTokenRequest() {
  if (!obrReady) return;
  try {
    const meta = await OBR.player.getMetadata();
    const tid = meta?.[SELECTED_KEY];
    if (!tid) return;
    const data = await loadFromToken(tid);
    if (data) {
      if (!canAccess(data)) {
        setStatus("🔒 Esta ficha pertence a " + (data.ownerName || "outro jogador"));
        show("bingo");
        renderBingo();
        return;
      }
      current = data;
      const i = characters.findIndex((c) => c.id === current.id || c.linkedTokenId === tid);
      if (i >= 0) characters[i] = structuredClone(current);
      else characters.push(structuredClone(current));
      saveLocal();
      show("sheet");
      fillSheet();
      setReadOnly(!canEdit(current));
      updateTokenBadge();
      setStatus(canEdit(current) ? "Dossiê do token carregado" : "Somente leitura");
    }
    // limpa flags
    await OBR.player.setMetadata({
      [OPEN_FLAG]: undefined,
      [BIND_FLAG]: undefined,
    });
  } catch (e) {
    console.warn(e);
  }
}

function roll2d8() {
  const d1 = 1 + (Math.random() * 8 | 0);
  const d2 = 1 + (Math.random() * 8 | 0);
  return { d1, d2, sum: d1 + d2 };
}

function parseDamage(expr) {
  if (!expr || !String(expr).trim()) return null;
  let s = String(expr).trim().toLowerCase().replace(/\s/g, "");
  ATTRS.forEach(({ key, label, short }) => {
    const v = String(current[key] || 0);
    s = s.replace(new RegExp(label, "gi"), v);
    s = s.replace(new RegExp(short, "gi"), v);
    s = s.replace(new RegExp(key, "gi"), v);
  });
  s = s.replace(/espirito/gi, String(current.espirito || 0));
  s = s.replace(/nível|nivel|nc/gi, String(current.nc || 4));
  const parts = s.match(/([+-]?\d*d\d+)|([+-]?\d+)/gi);
  if (!parts) return { total: +s || 0, detail: s };
  let total = 0;
  const detail = [];
  for (const p of parts) {
    const m = p.match(/^([+-]?)(\d*)d(\d+)$/i);
    if (m) {
      const sign = m[1] === "-" ? -1 : 1;
      const n = +(m[2] || 1);
      const faces = +m[3];
      let sub = 0;
      const rolls = [];
      for (let i = 0; i < n; i++) {
        const r = 1 + (Math.random() * faces | 0);
        rolls.push(r);
        sub += r;
      }
      total += sign * sub;
      detail.push((sign < 0 ? "-" : "") + n + "d" + faces + "[" + rolls.join(",") + "]");
    } else {
      total += +p;
      detail.push(String(+p));
    }
  }
  return { total, detail: detail.join(" ") };
}

/** Envia rolagem para extensões de dados na mesa (JustDices etc.) */
async function rollOnTable(expression, label) {
  if (!obrReady) return null;
  const callId = crypto.randomUUID();
  const expr = expression.startsWith("/") ? expression : "/r " + expression;
  try {
    // JustDices API — aparece no histórico da mesa para todos
    await OBR.broadcast.sendMessage(
      "com.sewef.justdices/api.request",
      { callId, expression: expr, showInLogs: true },
      { destination: "LOCAL" }
    );
  } catch (e) {
    console.warn("JustDices broadcast failed", e);
  }
  // Canal genérico — outras extensões / logs podem ouvir
  try {
    await OBR.broadcast.sendMessage(
      "com.shinobinosho.ficha/roll",
      {
        callId,
        expression: expr,
        label: label || "",
        name: current.nome || "Shinobi",
        system: "shinobi-no-sho",
      },
      { destination: "REMOTE" }
    );
  } catch {}
  return callId;
}

async function announce(msg) {
  setStatus(msg);
  const log = $("roll-log");
  if (log) log.textContent = msg;
  if (obrReady) {
    try { await OBR.notification.show(msg); } catch {}
  }
}

/**
 * Teste 2d8 do sistema:
 * 1) Manda 2d8+precisão para a mesa (JustDices = histórico na mesa)
 * 2) Interpreta fracasso/sucesso automático localmente
 * Nota: a extensão oficial "Dice" (3D física) não expõe API pública;
 * use JustDices (instalada na sala) para a rolagem aparecer na mesa,
 * ou role 2d8 no Dice 3D e some a precisão mostrada no Bingo Book.
 */
async function doTest(label, precisao, dif) {
  const who = current.nome || "Shinobi";
  const prec = +precisao || 0;
  const formula = prec ? "2d8+" + prec : "2d8";

  // 1) Rolagem na mesa (se JustDices estiver ativo)
  await rollOnTable(formula, who + " · " + label);

  // 2) Resultado local (regras Shinobi no Sho) + notificação
  const { d1, d2, sum } = roll2d8();
  const total = sum + prec;
  let result = label + ": 2d8(" + d1 + "+" + d2 + ")+" + prec + " = " + total;
  if (sum <= 3) result += " · FRACASSO AUTO";
  else if (sum >= 15) result += " · SUCESSO AUTO";
  else if (dif != null && dif !== "") result += total >= +dif ? " · sucesso" : " · falha";

  await announce(who + " → " + result);
  return total;
}

async function doDamage(label, expr) {
  const who = current.nome || "Shinobi";
  // Monta fórmula limpa para a mesa (só dados + números)
  let e = String(expr || "1d8");
  ATTRS.forEach(({ key, label: lb, short }) => {
    const v = String(current[key] || 0);
    e = e.replace(new RegExp(lb, "gi"), v);
    e = e.replace(new RegExp(short, "gi"), v);
    e = e.replace(new RegExp(key, "gi"), v);
  });
  e = e.replace(/espirito/gi, String(current.espirito || 0));
  e = e.replace(/nível|nivel|nc/gi, String(current.nc || 4));
  e = e.replace(/\s/g, "");

  await rollOnTable(e, who + " · " + label + " (dano)");

  const r = parseDamage(expr || "1d8");
  if (!r) return;
  await announce(who + " → " + label + ": " + r.detail + " = " + r.total + " dano");
  return r.total;
}

function $(id) { return document.getElementById(id); }
function setStatus(t) { const s = $("status"); if (s) s.textContent = t; }

function show(v) {
  $("view-bingo").classList.toggle("hidden", v !== "bingo");
  $("view-sheet").classList.toggle("hidden", v !== "sheet");
  $("view-power").classList.toggle("hidden", v !== "power");
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function normalize(c) {
  if (!c.pericias) c.pericias = {};
  PERICIAS.forEach((p) => { if (c.pericias[p.nome] == null) c.pericias[p.nome] = 0; });
  if (!Array.isArray(c.poderes)) c.poderes = [];
  if (c.vitAtual == null) c.vitAtual = vitMax(c);
  if (c.chaAtual == null) c.chaAtual = chaMax(c);
}

function renderBingo() {
  const box = $("bingo-list");
  const q = ($("bingo-search").value || "").toLowerCase();
  const filterNivel = $("bingo-filter-nivel").value;
  const filterVila = $("bingo-filter-vila").value;
  let list = characters.slice();
  // Jogador só vê as próprias fichas (+ sem dono); GM vê todas
  if (!isGM()) {
    list = list.filter((c) => !c.ownerId || c.ownerId === myPlayerId);
  }
  if (q) {
    list = list.filter((c) =>
      [c.nome, c.cla, c.vila, c.funcao, c.ameaca, ...(c.poderes || []).map((p) => p.nome)]
        .join(" ").toLowerCase().includes(q)
    );
  }
  if (filterNivel) list = list.filter((c) => c.nivel === filterNivel);
  if (filterVila) list = list.filter((c) => (c.vila || "").toLowerCase().includes(filterVila.toLowerCase()));
  const order = { SS: 0, S: 1, A: 2, B: 3, C: 4, D: 5 };
  list.sort((a, b) => (order[a.ameaca] ?? 9) - (order[b.ameaca] ?? 9) || (a.nome || "").localeCompare(b.nome || ""));

  box.innerHTML = "";
  if (!list.length) {
    box.innerHTML = '<p class="empty">Arquivo vazio — registre um perfil com “+ Perfil”.</p>';
    return;
  }
  list.forEach((c) => {
    const vit = vitMax(c);
    const cha = chaMax(c);
    const threat = c.ameaca || "C";
    const initial = (c.nome || "忍").trim().charAt(0).toUpperCase();
    const card = document.createElement("article");
    card.className = "bingo-card";
    card.innerHTML =
      '<div class="bingo-head">' +
        '<div class="bingo-portrait">' + esc(initial) + '</div>' +
        '<div class="bingo-info">' +
          '<div class="bingo-name">' + esc(c.nome || "(sem nome)") + '</div>' +
          '<div class="bingo-meta">' + esc(c.nivel || "?") + " · NC " + (c.nc || "?") +
            "<br/>" + esc(c.vila || "—") + (c.cla ? " · " + esc(c.cla) : "") +
            (c.funcao ? "<br/>" + esc(c.funcao) : "") +
            (c.ownerName ? "<br/>👤 " + esc(c.ownerName) : "<br/>👤 sem dono") +
          '</div>' +
        '</div>' +
        '<div class="seal ' + esc(threat) + '"><span class="rank">' + esc(threat) +
        '</span><span class="lbl">Ameaça</span></div>' +
      '</div>' +
      '<div class="bingo-stats">' +
        '<span><b>VIT</b>' + (c.vitAtual ?? vit) + "/" + vit + '</span>' +
        '<span><b>CHA</b>' + (c.chaAtual ?? cha) + "/" + cha + '</span>' +
        '<span><b>CC</b>' + hab(c, "baseCc", "forca") + '</span>' +
        '<span><b>ESQ</b>' + hab(c, "baseEsq", "agilidade") + '</span>' +
      '</div>' +
      '<div class="bingo-powers">' +
      ((c.poderes || []).slice(0, 5).map((p) =>
        '<span class="tag">' + esc(p.nome) + " " + esc(p.rank || "") +
        (p.nivel ? "·N" + p.nivel : "") + "</span>"
      ).join("") || '<span class="muted">— sem jutsus registrados —</span>') +
      '</div>' +
      '<div class="bingo-actions">' +
      '<button type="button" data-open="' + c.id + '">Dossiê</button>' +
      '<button type="button" data-roll-cc="' + c.id + '">CC 🎲</button>' +
      '<button type="button" data-roll-esq="' + c.id + '">ESQ 🎲</button>' +
      '<button type="button" data-del="' + c.id + '" class="danger">✕</button></div>';
    box.appendChild(card);
  });

  box.onclick = async (e) => {
    const t = e.target;
    if (t.dataset.open) {
      const found = characters.find((x) => x.id === t.dataset.open);
      if (!found || !canAccess(found)) {
        setStatus("🔒 Sem permissão");
        return;
      }
      current = structuredClone(found);
      normalize(current);
      show("sheet");
      fillSheet();
      setReadOnly(!canEdit(current));
      return;
    }
    if (t.dataset.del) {
      characters = characters.filter((x) => x.id !== t.dataset.del);
      saveLocal(); saveObr();
      renderBingo();
      return;
    }
    if (t.dataset.rollCc || t.dataset.rollEsq) {
      const id = t.dataset.rollCc || t.dataset.rollEsq;
      const c = characters.find((x) => x.id === id);
      if (!c) return;
      current = structuredClone(c);
      normalize(current);
      if (t.dataset.rollCc) await doTest("CC", hab(current, "baseCc", "forca"));
      else await doTest("ESQ", hab(current, "baseEsq", "agilidade"));
    }
  };
}


function ensureAptList(c) {
  if (!Array.isArray(c.aptidoesSel)) c.aptidoesSel = [];
}

function toggleCatalogApt(id) {
  ensureAptList(current);
  const cat = APT_CATALOG.find((x) => x.id === id);
  if (!cat) return;
  const i = current.aptidoesSel.findIndex((x) => x.id === id);
  if (i >= 0) {
    current.aptidoesSel.splice(i, 1);
  } else {
    const copy = JSON.parse(JSON.stringify(cat));
    copy.selected = true;
    (copy.mods || []).forEach((m) => { if (m.ativo === undefined) m.ativo = true; });
    current.aptidoesSel.push(copy);
  }
  renderAptitudes();
  recalc();
}

function renderAptitudes() {
  ensureAptList(current);
  const box = $("apt-catalog");
  const customBox = $("apt-custom-list");
  if (!box) return;

  const gratisMax = 3;
  const sel = current.aptidoesSel.filter((a) => a.selected !== false);
  const gratisCount = sel.filter((a) => a.gratis).length;
  const extra = aptExtraCount(current);
  const disp = poderDisponivel(current);
  const gasto = poderGastoTotal(current);

  box.innerHTML = "";
  const info = document.createElement("p");
  info.className = "apt-info" + (gasto > disp ? " bad" : "");
  info.innerHTML = "Gratuitas: <strong>" + gratisCount + "/" + gratisMax + "</strong>" +
    " · Extras: <strong>" + extra + "</strong> (×2 pts = " + (extra * 2) + ")" +
    " · Poder restante: <strong>" + (disp - gasto) + "</strong> / " + disp;
  box.appendChild(info);

  APT_CATALOG.forEach((cat) => {
    const on = current.aptidoesSel.some((x) => x.id === cat.id);
    const row = document.createElement("label");
    row.className = "apt-row" + (cat.gratis ? " gratis" : " paga");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = on;
    cb.disabled = !canEdit(current);
    cb.onchange = () => {
      if (!on) {
        // tentando adicionar
        if (cat.gratis && gratisCount >= gratisMax) {
          // compra extra por 2 pts de poder
          const disp = poderDisponivel(current);
          const gasto = poderGastoTotal(current);
          if (gasto + 2 > disp) {
            setStatus("Sem pontos de poder (aptidão extra custa 2 pts)");
            cb.checked = false;
            return;
          }
          setStatus("Aptidão extra: -2 pts de poder");
        } else if (!cat.gratis) {
          const disp = poderDisponivel(current);
          const gasto = poderGastoTotal(current);
          if (gasto + 2 > disp) {
            setStatus("Sem pontos de poder (hijutsu/aptidão custa 2 pts)");
            cb.checked = false;
            return;
          }
        }
      }
      toggleCatalogApt(cat.id);
    };
    const txt = document.createElement("span");
    txt.innerHTML = "<strong>" + esc(cat.nome) + "</strong>" +
      (cat.gratis ? ' <em class="tag">grátis</em>' : ' <em class="tag">extra</em>') +
      "<br/><small>" + esc(cat.desc || "") + "</small>";
    row.appendChild(cb);
    row.appendChild(txt);
    box.appendChild(row);
  });

  // Detalhe dos mods das selecionadas
  if (customBox) {
    customBox.innerHTML = "";
    current.aptidoesSel.forEach((apt, ai) => {
      const card = document.createElement("div");
      card.className = "apt-mod-card";

      const head = document.createElement("div");
      head.className = "apt-mod-head";
      const nameInp = document.createElement("input");
      nameInp.type = "text";
      nameInp.value = apt.nome || "";
      nameInp.placeholder = "Nome da aptidão";
      nameInp.className = "apt-name-inp";
      nameInp.disabled = !canEdit(current);
      nameInp.onchange = () => { current.aptidoesSel[ai].nome = nameInp.value; };
      const rmApt = document.createElement("button");
      rmApt.type = "button";
      rmApt.textContent = "✕";
      rmApt.className = "danger apt-rm";
      rmApt.title = "Remover aptidão";
      rmApt.onclick = () => {
        current.aptidoesSel.splice(ai, 1);
        renderAptitudes();
        recalc();
      };
      head.appendChild(nameInp);
      head.appendChild(rmApt);
      card.appendChild(head);

      const modsWrap = document.createElement("div");
      modsWrap.className = "apt-mods-compact";

      (apt.mods || []).forEach((m, mi) => {
        if (m.ativo === false) m.ativo = true; // linhas listadas = ativas
        const row = document.createElement("div");
        row.className = "mod-row";

        const tipoSel = document.createElement("select");
        [["attr","Atributo"],["combat","Combate"],["pericia","Perícia"]].forEach(([v,l]) => {
          const o = document.createElement("option");
          o.value = v; o.textContent = l;
          if (m.tipo === v) o.selected = true;
          tipoSel.appendChild(o);
        });
        tipoSel.disabled = !canEdit(current);
        tipoSel.onchange = () => {
          current.aptidoesSel[ai].mods[mi].tipo = tipoSel.value;
          const opts = targetsForTipo(tipoSel.value);
          current.aptidoesSel[ai].mods[mi].alvo = opts[0];
          renderAptitudes();
          recalc();
        };

        const alvoSel = document.createElement("select");
        targetsForTipo(m.tipo || "attr").forEach((v) => {
          const o = document.createElement("option");
          o.value = v; o.textContent = v;
          if (String(m.alvo).toLowerCase() === String(v).toLowerCase()) o.selected = true;
          alvoSel.appendChild(o);
        });
        alvoSel.disabled = !canEdit(current);
        alvoSel.onchange = () => {
          current.aptidoesSel[ai].mods[mi].alvo = alvoSel.value;
          recalc();
        };

        const plus = document.createElement("span");
        plus.textContent = "+";
        plus.className = "mod-plus";

        const val = document.createElement("input");
        val.type = "number";
        val.value = m.valor ?? 1;
        val.className = "mod-val";
        val.disabled = !canEdit(current);
        val.onchange = () => {
          current.aptidoesSel[ai].mods[mi].valor = +val.value || 0;
          current.aptidoesSel[ai].mods[mi].ativo = true;
          recalc();
        };

        const rm = document.createElement("button");
        rm.type = "button";
        rm.textContent = "✕";
        rm.className = "danger mod-rm";
        rm.onclick = () => {
          current.aptidoesSel[ai].mods.splice(mi, 1);
          renderAptitudes();
          recalc();
        };

        row.appendChild(tipoSel);
        row.appendChild(alvoSel);
        row.appendChild(plus);
        row.appendChild(val);
        row.appendChild(rm);
        modsWrap.appendChild(row);
      });

      const addMod = document.createElement("button");
      addMod.type = "button";
      addMod.textContent = "+ bônus";
      addMod.className = "ghost mod-add";
      addMod.onclick = () => {
        if (!current.aptidoesSel[ai].mods) current.aptidoesSel[ai].mods = [];
        current.aptidoesSel[ai].mods.push({ tipo: "combat", alvo: "cc", valor: 1, ativo: true });
        renderAptitudes();
        recalc();
      };

      card.appendChild(modsWrap);
      card.appendChild(addMod);
      customBox.appendChild(card);
    });

    const addCustom = document.createElement("button");
    addCustom.type = "button";
    addCustom.className = "primary";
    addCustom.style.cssText = "width:100%;margin-top:8px";
    addCustom.textContent = "+ Aptidão custom";
    addCustom.onclick = () => {
      ensureAptList(current);
      current.aptidoesSel.push(emptyAptCustom());
      renderAptitudes();
      recalc();
    };
    customBox.appendChild(addCustom);
  }
}

function drawCombatChart() {
  const canvas = $("chart-combat");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 24;
  const labels = ["CC", "CD", "ESQ", "LM"];
  const vals = [
    hab(current, "baseCc", "forca"),
    hab(current, "baseCd", "destreza"),
    hab(current, "baseEsq", "agilidade"),
    hab(current, "baseLm", "percepcao"),
  ];
  const maxV = Math.max(10, ...vals, 1);
  ctx.clearRect(0, 0, w, h);
  const n = 4;
  for (let lv = 1; lv <= 4; lv++) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
      const rr = (r * lv) / 4;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(90,74,56,0.35)";
    ctx.stroke();
  }
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    const v = vals[i] / maxV;
    const x = cx + Math.cos(a) * r * v, y = cy + Math.sin(a) * r * v;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(30,58,95,0.3)";
  ctx.fill();
  ctx.strokeStyle = "#1e3a5f";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = "#6b5e4a";
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  labels.forEach((lb, i) => {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    ctx.fillText(lb + " " + vals[i], cx + Math.cos(a) * (r + 14), cy + Math.sin(a) * (r + 14) + 3);
  });
}

function drawPericiaChart() {
  const canvas = $("chart-per");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const rows = PERICIAS.map((p) => ({
    nome: p.nome.length > 12 ? p.nome.slice(0, 11) + "…" : p.nome,
    v: perTotal(current, p.nome, p.atr),
  })).sort((a, b) => b.v - a.v).slice(0, 8);
  const maxV = Math.max(1, ...rows.map((r) => r.v));
  const barH = 16;
  const gap = 6;
  const left = 90;
  rows.forEach((row, i) => {
    const y = 8 + i * (barH + gap);
    ctx.fillStyle = "#6b5e4a";
    ctx.font = "10px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(row.nome, left - 6, y + 12);
    const bw = ((w - left - 30) * row.v) / maxV;
    ctx.fillStyle = "rgba(155,27,27,0.55)";
    ctx.fillRect(left, y, bw, barH);
    ctx.fillStyle = "#1a1510";
    ctx.textAlign = "left";
    ctx.fillText(String(row.v), left + bw + 4, y + 12);
  });
}



/** Atualiza max dos inputs de atributo quando o NC muda */
function applyNcLimitsToInputs() {
  const maxNow = pointsForNc(current.nc || 4).maxAtr;
  document.querySelectorAll("#attr-list input[data-attr-key]").forEach((inp) => {
    inp.max = maxNow;
    inp.title = "Base (pts / máx NC " + maxNow + ")";
    const key = inp.dataset.attrKey;
    // Não corta valores já salvos acima do antigo limite — só impede subir além do novo
    // Se quiser clampar ao mudar NC para baixo, descomente:
    // if ((+inp.value || 0) > maxNow) { inp.value = maxNow; current[key] = maxNow; }
  });
  const sub = $("sheet-sub");
  if (sub) sub.textContent = (current.nivel || "?") + " · NC " + (current.nc || "?") + " · " + (current.vila || "—");
}

function fillSheet() {
  normalize(current);
  $("nome").value = current.nome || "";
  $("cla").value = current.cla || "";
  $("nivel").value = current.nivel || "Genin";
  $("nc").value = current.nc || 4;
  $("vila").value = current.vila || "";
  $("funcao").value = current.funcao || "";
  $("ameaca").value = current.ameaca || "C";
  $("aptidoes").value = current.aptidoes || "";
  $("notas").value = current.notas || "";
  $("vit-atual").value = current.vitAtual ?? vitMax(current);
  $("cha-atual").value = current.chaAtual ?? chaMax(current);
  // dossiê visual
  const threat = current.ameaca || "C";
  const seal = $("sheet-seal");
  if (seal) {
    seal.className = "seal " + threat;
    $("sheet-rank").textContent = threat;
  }
  const sub = $("sheet-sub");
  if (sub) sub.textContent = (current.nivel || "?") + " · NC " + (current.nc || "?") + " · " + (current.vila || "—");
  const por = $("sheet-portrait");
  if (por) por.textContent = (current.nome || "忍").trim().charAt(0).toUpperCase() || "忍";

  const attrBox = $("attr-list");
  attrBox.innerHTML = "";
  const limA = pointsForNc(current.nc || 4);
  ATTRS.forEach(({ key, label }) => {
    const row = document.createElement("div");
    row.className = "attr-row attr-row-ext";
    const lab = document.createElement("span");
    lab.textContent = label;
    lab.title = "Base conta no limite NC; bônus de aptidão NÃO conta no máximo";
    row.appendChild(lab);

    const inp = document.createElement("input");
    inp.type = "number";
    inp.min = 0;
    inp.max = limA.maxAtr;
    inp.dataset.attrKey = key;
    inp.value = current[key] || 0;
    inp.title = "Base (pts / máx NC " + limA.maxAtr + ")";
    inp.addEventListener("input", () => {
      // Limite SEMPRE pelo NC atual (não o valor antigo da abertura da ficha)
      const maxNow = pointsForNc(current.nc || 4).maxAtr;
      let v = +inp.value || 0;
      if (v > maxNow) { v = maxNow; inp.value = v; }
      current[key] = v;
      recalc();
    });
    row.appendChild(inp);

    const bonus = document.createElement("span");
    bonus.className = "attr-bonus";
    bonus.dataset.attrBonus = key;
    const b = sumMods(current, "attr", key);
    bonus.textContent = b ? ("+" + b) : "+0";
    bonus.title = "Bônus de aptidão (não entra no limite de nível)";
    row.appendChild(bonus);

    const tot = document.createElement("span");
    tot.className = "attr-efetivo";
    tot.dataset.attrEfetivo = key;
    tot.textContent = "= " + attrEfetivo(current, key);
    tot.title = "Total efetivo (base + aptidão)";
    row.appendChild(tot);

    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "roll-btn"; btn.textContent = "🎲";
    btn.title = "Testar " + label + " (efetivo)";
    btn.addEventListener("click", () => doTest(label, attrEfetivo(current, key)));
    row.appendChild(btn);

    attrBox.appendChild(row);
  });

  const perBox = $("per-list");
  perBox.innerHTML = "";
  PERICIAS.forEach(({ nome, atr }) => {
    const row = document.createElement("div");
    row.className = "per-row";
    const short = nome.length > 14 ? nome.slice(0, 13) + "…" : nome;
    row.innerHTML = '<span title="' + nome + '">' + short + "</span>";
    const inp = document.createElement("input");
    inp.type = "number"; inp.min = 0; inp.max = 20;
    inp.value = current.pericias[nome] || 0;
    inp.addEventListener("input", () => { current.pericias[nome] = +inp.value || 0; recalc(); });
    const tot = document.createElement("span");
    tot.className = "total";
    tot.dataset.per = nome;
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "roll-btn"; btn.textContent = "🎲";
    btn.addEventListener("click", () => doTest(nome, perTotal(current, nome, atr)));
    row.appendChild(inp);
    row.appendChild(tot);
    row.appendChild(btn);
    perBox.appendChild(row);
  });

  renderPowers();
  renderAptitudes();
  recalc();
  drawRadar();
  drawCombatChart();
  drawPericiaChart();
  updateTokenBadge();
}

function recalc() {
  const lim = pointsForNc(current.nc);
  const gastoAtr = ATTRS.reduce((s, a) => s + (current[a.key] || 0), 0);
  let overMax = false;
  ATTRS.forEach(({ key }) => {
    if ((current[key] || 0) > lim.maxAtr) overMax = true;
    const bEl = document.querySelector('[data-attr-bonus="' + key + '"]');
    const eEl = document.querySelector('[data-attr-efetivo="' + key + '"]');
    const b = sumMods(current, "attr", key);
    if (bEl) bEl.textContent = b ? ("+" + b) : "+0";
    if (eEl) eEl.textContent = "= " + attrEfetivo(current, key);
  });
  const el = $("pts-atr");
  el.textContent = gastoAtr + "/" + lim.atributos + " pts · base máx " + lim.maxAtr + " (aptidão fora do limite)";
  el.className = "pts " + (gastoAtr <= lim.atributos && !overMax ? "ok" : "bad");

  const gastoPer = Object.values(current.pericias || {}).reduce((s, v) => s + (+v || 0), 0);
  const ep = $("pts-per");
  ep.textContent = gastoPer + "/" + lim.pericias + " pts · limite " + lim.limite;
  ep.className = "pts " + (gastoPer <= lim.pericias ? "ok" : "bad");

  const vmax = vitMax(current);
  const cmax = chaMax(current);
  $("vit-max").textContent = "/" + vmax;
  $("cha-max").textContent = "/" + cmax;
  /* combat stats */
  $("cd").textContent = hab(current, "baseCd", "destreza");
  $("esq").textContent = hab(current, "baseEsq", "agilidade");
  $("lm").textContent = hab(current, "baseLm", "percepcao");
  const gCc = $("cc-g"); if (gCc) gCc.textContent = $("cc").textContent;
  const gCd = $("cd-g"); if (gCd) gCd.textContent = $("cd").textContent;
  const gEsq = $("esq-g"); if (gEsq) gEsq.textContent = $("esq").textContent;
  const gLm = $("lm-g"); if (gLm) gLm.textContent = $("lm").textContent;
  $("extra-stats").textContent =
    "Desloc. " + (10 + ((current.agilidade || 0) >> 1)) + "m · Reação ESQ " +
    (9 + hab(current, "baseEsq", "agilidade")) + " · Poderes " + lim.poderes;
  const pp = $("pts-poder");
  if (pp) {
    const disp = poderDisponivel(current);
    const total = poderGastoTotal(current);
    pp.textContent = total + " / " + disp + " pts";
    pp.className = "pts " + (total <= disp ? "ok" : "bad");
  }


  PERICIAS.forEach(({ nome, atr }) => {
    const node = document.querySelector('[data-per="' + CSS.escape(nome) + '"]');
    if (node) node.textContent = perTotal(current, nome, atr);
  });
  drawRadar();
  drawCombatChart();
  drawPericiaChart();
  scheduleSave();
}

function renderPowers() {
  const box = $("power-list");
  box.innerHTML = "";
  const disp = poderDisponivel(current);
  const gJ = poderGastoJutsus(current);
  const gA = poderGastoApt(current);
  const total = gJ + gA;
  const hdr = document.createElement("p");
  hdr.className = "apt-info" + (total > disp ? " bad" : "");
  hdr.innerHTML = "Pontos de poder: <strong>" + total + " / " + disp + "</strong>" +
    " <span class='muted'>(jutsus " + gJ + " + aptidões extra " + gA + ")</span>";
  box.appendChild(hdr);
  (current.poderes || []).forEach((p, idx) => {
    const div = document.createElement("div");
    div.className = "power-card";
    div.innerHTML =
      '<div class="power-top"><strong>' + esc(p.nome || "Poder") +
      '</strong><span class="tag">' + esc(p.rank || "?") +
      (p.nivel != null ? " · Nv " + p.nivel : "") + "</span></div>" +
      '<div class="power-meta muted">' + esc(p.tipo || "") + " · Custo " + esc(p.custo || "—") +
      " · Prec " + (p.precisao ?? "—") + " · Dano " + esc(p.dano || "—") + "</div>" +
      '<div class="power-fx">' + esc(p.efeito || "") + "</div>" +
      '<div class="power-actions">' +
      '<button type="button" data-test="' + idx + '">Teste</button>' +
      '<button type="button" data-dmg="' + idx + '">Dano</button>' +
      '<button type="button" data-edit="' + idx + '">Editar</button>' +
      '<button type="button" data-rm="' + idx + '" class="danger">✕</button></div>';
    box.appendChild(div);
  });
  box.onclick = async (e) => {
    const t = e.target;
    const i = +(t.dataset.test ?? t.dataset.dmg ?? t.dataset.edit ?? t.dataset.rm);
    if (Number.isNaN(i)) return;
    const p = current.poderes[i];
    if (!p) return;
    if (t.dataset.test != null) {
      const prec = p.precisao !== "" && p.precisao != null
        ? +p.precisao
        : hab(current, "baseCd", "destreza");
      await doTest(p.nome || "Poder", prec);
    } else if (t.dataset.dmg != null) {
      await doDamage(p.nome || "Poder", p.dano || "1d8");
    } else if (t.dataset.edit != null) {
      openPowerEditor(i);
    } else if (t.dataset.rm != null) {
      current.poderes.splice(i, 1);
      renderPowers();
    }
  };
}

function openPowerEditor(idx) {
  editingPower = idx;
  const p = idx < 0
    ? { nome: "", rank: "C", nivel: 1, tipo: "Ninjutsu", custo: "", precisao: "", dano: "2d8", efeito: "" }
    : { ...current.poderes[idx] };
  $("pow-nome").value = p.nome || "";
  $("pow-rank").value = p.rank || "C";
  $("pow-nivel").value = p.nivel ?? 1;
  $("pow-tipo").value = p.tipo || "Ninjutsu";
  $("pow-custo").value = p.custo || "";
  $("pow-precisao").value = p.precisao ?? "";
  $("pow-dano").value = p.dano || "";
  $("pow-efeito").value = p.efeito || "";
  show("power");
}

function savePowerEditor() {
  const p = {
    nome: $("pow-nome").value.trim(),
    rank: $("pow-rank").value,
    nivel: +$("pow-nivel").value || 1,
    tipo: $("pow-tipo").value.trim(),
    custo: $("pow-custo").value.trim(),
    precisao: $("pow-precisao").value === "" ? "" : +$("pow-precisao").value,
    dano: $("pow-dano").value.trim(),
    efeito: $("pow-efeito").value.trim(),
  };
  if (!current.poderes) current.poderes = [];
  if (editingPower < 0) current.poderes.push(p);
  else current.poderes[editingPower] = p;
  show("sheet");
  renderPowers();
}

function drawRadar() {
  const canvas = $("radar");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2;
  const r = Math.min(cx, cy) - 20;
  const n = ATTRS.length;
  const maxV = Math.max(pointsForNc(current.nc).maxAtr, 1);
  ctx.clearRect(0, 0, w, h);
  for (let lv = 1; lv <= 4; lv++) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
      const rr = (r * lv) / 4;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(90,74,56,0.35)";
    ctx.stroke();
  }
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.strokeStyle = "rgba(90,74,56,0.35)";
    ctx.stroke();
  }
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    const v = Math.min(1, (current[ATTRS[i].key] || 0) / maxV);
    const x = cx + Math.cos(a) * r * v, y = cy + Math.sin(a) * r * v;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(155,27,27,0.25)";
  ctx.fill();
  ctx.strokeStyle = "#9b1b1b";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = "#6b5e4a";
  ctx.font = "10px system-ui";
  ctx.textAlign = "center";
  ATTRS.forEach((a, i) => {
    const ang = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    ctx.fillText(a.short, cx + Math.cos(ang) * (r + 12), cy + Math.sin(ang) * (r + 12) + 3);
  });
}

function readSheet() {
  current.nome = $("nome").value;
  current.cla = $("cla").value;
  current.nivel = $("nivel").value;
  current.nc = +$("nc").value || 4;
  current.vila = $("vila").value;
  current.funcao = $("funcao").value;
  current.ameaca = $("ameaca").value;
  current.aptidoes = $("aptidoes").value;
  current.notas = $("notas").value;
  current.vitAtual = +$("vit-atual").value;
  current.chaAtual = +$("cha-atual").value;
}

function bind() {
  $("btn-bingo").onclick = () => { show("bingo"); renderBingo(); };
  $("btn-new").onclick = () => {
    current = blankChar();
    claimOwnership(current);
    show("sheet");
    fillSheet();
    setReadOnly(false);
    setStatus("Novo perfil · você é o dono");
  };
  
  // Autosave em campos estáticos da ficha
  ["nome","cla","vila","funcao","aptidoes","notas","vit-atual","cha-atual"].forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => { scheduleSave(); });
    el.addEventListener("change", () => { scheduleSave(); });
  });
  // data-autosave-wired

  $("btn-save").onclick = () => { readSheet(); persist(); renderBingo(); setStatus("Salvo ✓"); };

  // Abas da ficha
  const tabs = document.getElementById("sheet-tabs");
  if (tabs) {
    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tab]");
      if (!btn) return;
      const name = btn.dataset.tab;
      tabs.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".tab-panel").forEach((p) => {
        p.classList.toggle("active", p.dataset.panel === name);
      });
      // Redesenha gráficos ao abrir abas que os usam
      if (name === "geral" || name === "combate") {
        requestAnimationFrame(() => {
          drawRadar();
          drawCombatChart();
          drawPericiaChart();
        });
      }
    });
  }


  const btnTok = $("btn-bind-token");
  if (btnTok) btnTok.onclick = () => bindToSelectedToken();
  const btnUn = $("btn-unbind-token");
  if (btnUn) btnUn.onclick = () => {
    current.linkedTokenId = null;
    updateTokenBadge();
    setStatus("Token desvinculado (ficha só na lista)");
  };
  const btnClaim = $("btn-claim-owner");
  if (btnClaim) btnClaim.onclick = () => {
    if (current.ownerId && current.ownerId !== myPlayerId && !isGM()) {
      setStatus("🔒 Só o dono ou o GM podem transferir");
      return;
    }
    claimOwnership(current);
    setReadOnly(false);
    persist();
    setStatus("Você é o dono desta ficha");
  };
  $("bingo-search").oninput = renderBingo;
  $("bingo-filter-nivel").onchange = renderBingo;
  $("bingo-filter-vila").oninput = renderBingo;

  $("nivel").onchange = () => {
    current.nivel = $("nivel").value;
    current.nc = SHINOBI_NC[current.nivel] || 4;
    $("nc").value = current.nc;
    applyNcLimitsToInputs();
    recalc();
  };
  $("nc").oninput = () => {
    current.nc = Math.max(4, Math.min(20, +$("nc").value || 4));
    $("nc").value = current.nc;
    // Sincroniza o rótulo de nível se bater com a tabela
    const entry = Object.entries(SHINOBI_NC).find(([, n]) => n === current.nc);
    if (entry) { current.nivel = entry[0]; $("nivel").value = entry[0]; }
    applyNcLimitsToInputs();
    recalc();
  };
  $("ameaca").onchange = () => {
    current.ameaca = $("ameaca").value;
    const seal = $("sheet-seal");
    if (seal) {
      seal.className = "seal " + current.ameaca;
      $("sheet-rank").textContent = current.ameaca;
    }
  };
  $("nome").oninput = () => {
    const por = $("sheet-portrait");
    if (por) por.textContent = ($("nome").value || "忍").trim().charAt(0).toUpperCase() || "忍";
  };

  $("btn-roll-cc").onclick = () => doTest("CC", hab(current, "baseCc", "forca"));
  $("btn-roll-cd").onclick = () => doTest("CD", hab(current, "baseCd", "destreza"));
  $("btn-roll-esq").onclick = () => doTest("ESQ", hab(current, "baseEsq", "agilidade"));
  $("btn-roll-lm").onclick = () => doTest("LM", hab(current, "baseLm", "percepcao"));
  $("btn-roll-custom").onclick = () => {
    const prec = +$("roll-prec").value || 0;
    const dif = $("roll-dif").value;
    doTest("Teste", prec, dif === "" ? null : dif);
  };
  $("btn-add-power").onclick = () => openPowerEditor(-1);
  $("btn-pow-save").onclick = savePowerEditor;
  $("btn-pow-cancel").onclick = () => { show("sheet"); renderPowers(); };
  $("vit-atual").onchange = () => { current.vitAtual = +$("vit-atual").value; };
  $("cha-atual").onchange = () => { current.chaAtual = +$("cha-atual").value; };
}

async function boot() {
  loadLocal();
  bind();
  if (OBR.isAvailable) {
    OBR.onReady(async () => {
      obrReady = true;
      await loadObr();
      myPlayerId = await OBR.player.getId();
      myRole = await OBR.player.getRole();
      myName = await OBR.player.getName();
      setStatus("Owlbear · " + myName + (isGM() ? " (GM)" : " (jogador)"));

      // Menu de contexto também no popover (redundante com background)
      try {
        await OBR.contextMenu.create({
          id: "com.shinobinosho.ficha/menu-open-popover",
          icons: [{
            icon: "/icon.svg",
            label: "Bingo Book — Dossiê",
            filter: { min: 1, max: 1, every: [{ key: "layer", value: "CHARACTER" }] },
          }],
          onClick: async (context) => {
            const item = context.items[0];
            if (!item) return;
            const data = await loadFromToken(item.id);
            const c = data || blankChar();
            c.linkedTokenId = item.id;
            if (!canAccess(c)) {
              setStatus("🔒 Ficha de " + (c.ownerName || "outro jogador"));
              return;
            }
            current = c;
            show("sheet");
            fillSheet();
            setReadOnly(!canEdit(current));
            updateTokenBadge();
            setStatus(canEdit(current) ? "Dossiê do token" : "Somente leitura");
          },
        });
      } catch {}

      // Quando o background pede abertura
      OBR.player.onChange(async (player) => {
        const m = player.metadata || {};
        if (m[OPEN_FLAG]) {
          await openFromTokenRequest();
        }
      });

      // Já veio de um clique no token?
      await openFromTokenRequest();

      show("bingo");
      renderBingo();
      updateTokenBadge();
    });
  } else {
    setStatus("Modo local");
    show("bingo");
    renderBingo();
  }
}

boot();
