/**
 * Shinobi no Sho — Extensão Owlbear Rodeo
 * Ficha + Bingo Book + rolagem 2d8 (perícias, combate, poderes, dano)
 */

import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3";
import { HIJUTSU_CATALOG, getHijutsu } from "./hijutsu-data.js";

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
  { id:"byakugan", nome:"Byakugan (Clã Hyuuga)", gratis:false, restritoClan:"Hyuuga", desc:"Aptidão restrita ao clã Hyuuga; ativação e sentidos conforme manual p. 157. Sem bônus estático automático.", mods:[] },
  { id:"sharingan", nome:"Sharingan (Clã Uchiha)", gratis:false, restritoClan:"Uchiha", desc:"Aptidão restrita ao clã Uchiha; ativação, visão de chakra e esquiva perceptiva conforme manual p. 180–182. Sem bônus estático automático.", mods:[] },
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
  for (const p of c.poderes || []) t += Math.max(1, +p.nivel || 1);
  // Os níveis dos poderes de Hijutsu também consomem pontos de poder.
  for (const h of c.hijutsus || []) t += Math.max(1, +h.nivel || 1);
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
const AUTO_OPEN_KEY = "com.shinobinosho.ficha/autoOpenOnSelect";
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
    pericias: {}, poderes: [], hijutsus: [], permitirHijutsusMultiplos: false, aptidoes: "", notas: "", vitAtual: null, chaAtual: null,
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
let autoOpenOnSelect = true;
let autosaveTimer = null;
let isFillingSheet = false;

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
      const merged = new Map();
      for (const c of characters) if (c?.id) merged.set(c.id, c);
      for (const c of meta[META_KEY]) if (c?.id) merged.set(c.id, c);
      characters = [...merged.values()];
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
    if (el.id === "btn-bingo" || el.id === "btn-open-selected-token") return;
    if (el.classList.contains("roll-btn")) {
      el.disabled = false; // rolagem liberada se pode ver
      return;
    }
    if (["btn-save", "btn-bind-token", "btn-add-power", "btn-add-hijutsu", "btn-new"].includes(el.id)) {
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
  else if (current.nome?.trim() || current.linkedTokenId) characters.push(structuredClone(current));
  saveLocal();
  saveObr();
  // Salva também no token vinculado (se houver), e devolve a promessa para
  // ações de navegação aguardarem a gravação antes de carregar outra ficha.
  if (current.linkedTokenId && obrReady) {
    return saveToToken(current.linkedTokenId, current).then(() => {
      setStatus("Salvo no token ✓");
      updateTokenBadge();
    }).catch((error) => {
      console.warn("Não foi possível salvar no token", error);
      setStatus("Salvo localmente; falha ao gravar no token");
    });
  }
  setStatus("Salvo ✓");
  return Promise.resolve();
}

async function saveToToken(tokenId, data) {
  if (!obrReady || !tokenId) return;
  const payload = structuredClone(data);
  payload.linkedTokenId = tokenId;
  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (const item of items) {
      item.metadata = item.metadata || {};
      payload.linkedTokenName = item.name || payload.linkedTokenName || "";
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
    const originalTokenId = c.linkedTokenId;
    c.linkedTokenId = tokenId;
    c.linkedTokenName = items[0].name || c.linkedTokenName || "";
    if (!c.id) c.id = crypto.randomUUID();
    normalize(c);
    // Ao duplicar um token no mapa, o Owlbear copia o metadata. Uma cópia
    // precisa de ID de ficha próprio para não sobrescrever o perfil original.
    // Tokens legados sem linkedTokenId também recebem vínculo canônico na primeira leitura.
    if (originalTokenId !== tokenId) {
      if (originalTokenId || c.id) {
        c.id = crypto.randomUUID();
        c.notas = [c.notas, "Ficha criada a partir de uma cópia de token ou metadados legados; possui ID independente."].filter(Boolean).join("\n");
      }
      try { await saveToToken(tokenId, c); }
      catch (error) { console.warn("Não foi possível gravar a ficha independente no token duplicado", error); }
    }
    return c;
  }
  // Token sem ficha: cria e grava imediatamente uma ficha vazia no próprio token.
  // Assim, fechar o popover antes de editar não gera um novo ID a cada abertura.
  const c = blankChar();
  c.linkedTokenId = tokenId;
  c.linkedTokenName = items[0].name || "";
  if (items[0].name) c.nome = items[0].name;
  normalize(c);
  try { await saveToToken(tokenId, c); }
  catch (error) { console.warn("Não foi possível gravar a ficha inicial no token", error); }
  return c;
}

async function getSelectedTokenId() {
  if (!obrReady) return null;
  try {
    const sel = await OBR.player.getSelection?.();
    if (Array.isArray(sel) && sel.length === 1) {
      const items = await OBR.scene.items.getItems(sel);
      if (items[0]?.layer === "CHARACTER") return items[0].id;
    }
  } catch {}
  // Não usa SELECTED_KEY como fallback: pode apontar para um token antigo.
  return null;
}

function updateTokenBadge() {
  const el = $("token-badge");
  if (!el) return;
  if (current.linkedTokenId) {
    el.textContent = "🔗 " + (current.linkedTokenName || "Token vinculado");
    el.className = "token-badge on";
  } else {
    el.textContent = "Sem token";
    el.className = "token-badge";
  }
}

async function openSelectedTokenSheet() {
  await flushAutosave();
  const tid = await getSelectedTokenId();
  if (!tid) {
    setStatus("Selecione um token da camada Character no mapa");
    return;
  }
  const data = await loadFromToken(tid);
  if (!data) {
    setStatus("Não foi possível ler este token");
    return;
  }
  if (!canAccess(data)) {
    show("bingo");
    renderBingo();
    setStatus("🔒 Esta ficha pertence a " + (data.ownerName || "outro jogador"));
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
  setStatus(current.nome ? "Dossiê de " + current.nome + " carregado" : "Ficha nova no token · preencha e salve");
}

async function toggleAutoOpen() {
  autoOpenOnSelect = !autoOpenOnSelect;
  localStorage.setItem(AUTO_OPEN_KEY, JSON.stringify(autoOpenOnSelect));
  if (obrReady) {
    try { await OBR.player.setMetadata({ [AUTO_OPEN_KEY]: autoOpenOnSelect }); } catch {}
  }
  renderAutoOpenButton();
  setStatus(autoOpenOnSelect ? "Abertura automática ativada: selecionar token abre o dossiê" : "Abertura automática desativada; use o menu do token ou o botão Abrir/Criar ficha");
}

function renderAutoOpenButton() {
  const button = $("btn-auto-open");
  if (!button) return;
  button.textContent = "Auto-ficha: " + (autoOpenOnSelect ? "ON" : "OFF");
  button.title = autoOpenOnSelect
    ? "Ao selecionar um token Character, abre a ficha. Clique para desativar."
    : "Abertura automática desativada. Clique para ativar.";
  button.classList.toggle("auto-enabled", autoOpenOnSelect);
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
  // Não sobrescreve silenciosamente a ficha já gravada no token.
  const items = await OBR.scene.items.getItems([tid]);
  const tokenMeta = items[0]?.metadata?.[TOKEN_META];
  if (tokenMeta && tokenMeta.id && tokenMeta.id !== current.id) {
    setStatus("Este token já possui uma ficha. Use Abrir/Criar ficha para carregá-la primeiro.");
    return;
  }
  readSheet();
  if (current.linkedTokenId && current.linkedTokenId !== tid) {
    current = structuredClone(current);
    current.id = crypto.randomUUID();
  }
  claimOwnership(current);
  current.linkedTokenId = tid;
  current.linkedTokenName = items[0]?.name || current.linkedTokenName || "";
  await saveToToken(tid, current);
  persist();
  updateTokenBadge();
  setStatus("Ficha vinculada ao token · dono: " + (current.ownerName || "você"));
}

let openingTokenRequest = false;
async function openFromTokenRequest() {
  if (!obrReady || openingTokenRequest) return false;
  openingTokenRequest = true;
  let tid = null;
  let requestHandled = false;
  try {
    const meta = await OBR.player.getMetadata();
    tid = meta?.[SELECTED_KEY];
    if (!tid || !meta?.[OPEN_FLAG]) return false;
    requestHandled = true;
    await flushAutosave();

    const data = await loadFromToken(tid);
    if (!data) return false;
    if (!canAccess(data)) {
      setStatus("🔒 Esta ficha pertence a " + (data.ownerName || "outro jogador"));
      show("bingo");
      renderBingo();
      return true;
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
    setStatus(canEdit(current)
      ? (current.nome ? "Dossiê de " + current.nome + " carregado" : "Ficha nova no token · preencha e salve")
      : "Somente leitura");
    return true;
  } catch (e) {
    console.warn("Não foi possível abrir a ficha do token", e);
    setStatus("Não foi possível ler a ficha deste token");
    return false;
  } finally {
    if (requestHandled) {
      // setMetadata aplica um merge parcial; false desativa a flag de forma serializável.
      try { await OBR.player.setMetadata({ [OPEN_FLAG]: false, [BIND_FLAG]: false }); } catch {}
    }
    openingTokenRequest = false;
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

function setActiveSheetTab(tabName = "perfil") {
  const tabs = document.querySelectorAll("[data-sheet-tab]");
  const panels = document.querySelectorAll("[data-sheet-panel]");
  const found = [...tabs].some((tab) => tab.dataset.sheetTab === tabName);
  const active = found ? tabName : "perfil";
  tabs.forEach((tab) => {
    const selected = tab.dataset.sheetTab === active;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", selected ? "true" : "false");
    tab.tabIndex = selected ? 0 : -1;
  });
  panels.forEach((panel) => {
    const selected = panel.dataset.sheetPanel === active;
    panel.classList.toggle("active", selected);
    panel.hidden = !selected;
  });
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function normalize(c) {
  if (!c.pericias) c.pericias = {};
  if (!Array.isArray(c.hijutsus)) c.hijutsus = [];
  if (typeof c.permitirHijutsusMultiplos !== "boolean") c.permitirHijutsusMultiplos = false;
  // Migração dos perfis antigos: antes, o campo "Clã / Hijutsu" também podia
  // conter o nome de um Hijutsu. Move apenas correspondências exatas para a seção própria.
  const oldChoice = String(c.cla || "").trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const legacyHijutsu = HIJUTSU_CATALOG.find((h) => {
    const candidates = [h.id, h.nome, h.nome.split(" (")[0]].map((v) => String(v).toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    return candidates.some((v) => v === oldChoice);
  });
  if (legacyHijutsu) {
    if (!c.hijutsus.some((h) => h.id === legacyHijutsu.id)) {
      c.hijutsus.push({ id: legacyHijutsu.id, nivel: 1, ativo: false, notas: "Migrado do campo antigo Clã / Hijutsu. Confira o nível e os requisitos do manual." });
    }
    c.cla = "";
  }
  PERICIAS.forEach((p) => { if (c.pericias[p.nome] == null) c.pericias[p.nome] = 0; });
  if (!Array.isArray(c.poderes)) c.poderes = [];
  // Byakugan e Sharingan são aptidões restritas de clãs no manual, não Hijutsus
  // autônomos nem bônus planos. Converte fichas antigas sem manter bônus incorretos.
  if (Array.isArray(c.aptidoesSel)) {
    c.aptidoesSel.forEach((a) => {
      if (a.id === "byakugan") {
        a.nome = "Byakugan (Clã Hyuuga)";
        a.desc = "Aptidão restrita do clã; ver ativação e sentidos no manual, p. 157.";
        a.mods = [];
      } else if (a.id === "sharingan") {
        a.nome = "Sharingan (Clã Uchiha)";
        a.desc = "Aptidão restrita do clã; ver ativação e benefícios no manual, p. 180–182.";
        a.mods = [];
      }
    });
  }
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
      '<button type="button" data-del="' + c.id + '" class="danger" ' + (canEdit(c) ? '' : 'disabled title="Somente dono/GM"') + '>✕</button></div>';
    box.appendChild(card);
  });

  box.onclick = async (e) => {
    const t = e.target;
    if (t.dataset.open) {
      await flushAutosave();
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
      const doomed = characters.find((x) => x.id === t.dataset.del);
      if (!doomed || !canEdit(doomed)) {
        setStatus("Sem permissão para excluir esta ficha");
        return;
      }
      if (doomed.linkedTokenId && obrReady) {
        try {
          await OBR.scene.items.updateItems([doomed.linkedTokenId], (items) => {
            for (const item of items) {
              if (item.metadata) delete item.metadata[TOKEN_META];
            }
          });
        } catch (err) { console.warn("Não foi possível remover os dados do token", err); }
      }
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
    const clanEligible = !cat.restritoClan || (current.cla || "").toLocaleLowerCase("pt-BR").includes(cat.restritoClan.toLocaleLowerCase("pt-BR"));
    const row = document.createElement("label");
    row.className = "apt-row" + (cat.gratis ? " gratis" : " paga") + (cat.restritoClan && !clanEligible ? " clan-locked" : "");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = on;
    cb.disabled = !canEdit(current) || (!clanEligible && !on);
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
  setActiveSheetTab("perfil");
  isFillingSheet = true;
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
  const multiRule = $("hijutsu-multiple");
  if (multiRule) multiRule.checked = !!current.permitirHijutsusMultiplos;
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
  renderHijutsus();
  renderAptitudes();
  recalc();
  drawRadar();
  drawCombatChart();
  drawPericiaChart();
  updateTokenBadge();
  isFillingSheet = false;
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
  $("cc").textContent = hab(current, "baseCc", "forca");
  $("cd").textContent = hab(current, "baseCd", "destreza");
  $("esq").textContent = hab(current, "baseEsq", "agilidade");
  $("lm").textContent = hab(current, "baseLm", "percepcao");
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
}

function isAllowedHijutsuCombination(ids) {
  const set = new Set(ids);
  if (set.size <= 1) return true;
  // Exceções expressamente descritas no manual: Senjutsu com Kuchiyose;
  // Hibon Ninpou com Tensai, sem adicionar Versatilidade nessa combinação.
  if (set.size === 2 && set.has("senjutsu") && set.has("kuchiyose")) return true;
  if (set.size === 2 && set.has("hibon-ninpou") && set.has("tensai")) return true;
  return !!current.permitirHijutsusMultiplos;
}

function updateHijutsuGuidance() {
  const box = $("hijutsu-guidance");
  if (!box) return;
  const selected = (current.hijutsus || []).map((h) => getHijutsu(h.id)).filter(Boolean);
  const ids = selected.map((h) => h.id);
  const issues = [];
  const limit = pointsForNc(current.nc || 4).limite;
  for (const saved of current.hijutsus || []) {
    const cat = getHijutsu(saved.id);
    if (!cat) continue;
    const max = Math.min(cat.nivelMax || 10, limit, 10);
    if (+saved.nivel > max) {
      issues.push(cat.nome + " está no nível " + saved.nivel + ", acima do limite geral atual (" + max + "). Verifique o NC/pré-requisitos.");
    }
  }
  const hibonTensai = ids.includes("hibon-ninpou") && ids.includes("tensai");
  if (hibonTensai && ids.includes("versatilidade")) {
    issues.push("O manual não permite comprar Versatilidade na combinação Hibon Ninpou + Tensai.");
  }
  if (ids.includes("senjutsu") && (+current.vigor || 0) < 14) {
    issues.push("Senjutsu: o manual exige Vigor 14; a ficha está com Vigor " + (+current.vigor || 0) + ". Confira também Resistência Maior (Vigor) ou Regeneração, conforme a via escolhida.");
  }
  const clan = (current.cla || "").trim();
  const clanNorm = clan.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const clanIsHijutsu = HIJUTSU_CATALOG.some((h) => [h.id, h.nome, h.nome.split(" (")[0]].some((v) => String(v).toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "") === clanNorm));
  const clanIsPlaceholder = !clan || /^(nenhum|sem clã|sem cla|nenhum clã|nenhum cla|—|-|n\/a)$/i.test(clan);
  const senjutsuWithMokuton = ids.includes("senjutsu") && /mokuton/i.test(clan);
  const hasKuchiyoseRoute = ids.includes("kuchiyose") || (current.poderes || []).some((p) => /kuchiyose/i.test(p.nome || ""));
  if (ids.includes("senjutsu") && !senjutsuWithMokuton && !hasKuchiyoseRoute) {
    issues.push("Senjutsu: registre/valide uma via permitida no manual (por exemplo, Kuchiyose de sapos ou cobras com os pré-requisitos, ou Mokuton com os requisitos correspondentes).");
  }
  if (clanIsHijutsu) issues.push("O campo Clã / linhagem parece conter um Hijutsu antigo. Registre-o na seção Hijutsus para acompanhar nível e custo corretamente.");
  if (!clanIsPlaceholder && !clanIsHijutsu && ids.length && !senjutsuWithMokuton && !current.permitirHijutsusMultiplos) {
    issues.push("Regra padrão: escolha um clã OU um Hijutsu. O personagem tem um clã preenchido e Hijutsu(s); marque a regra opcional se o Mestre autorizou essa combinação.");
  }
  if (ids.length > 1 && !isAllowedHijutsuCombination(ids)) {
    issues.push("Regra padrão: somente um Hijutsu. A combinação atual requer a regra opcional ou autorização do Mestre; consulte as exceções do manual.");
  }
  if (current.permitirHijutsusMultiplos && ids.length > 1) {
    issues.push("Regra opcional ativa: o Mestre deve definir quais benefícios se acumulam e como os Hijutsus interagem.");
  }
  box.className = "hijutsu-guidance" + (issues.length ? " has-warning" : "" );
  box.innerHTML = issues.length
    ? "<strong>Conferência do manual</strong><ul>" + issues.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>"
    : "Compatibilidade verificada para as opções registradas. Requisitos específicos e efeitos de cada técnica ainda devem ser conferidos nas páginas indicadas do manual.";
}

function renderHijutsus() {
  const select = $("hijutsu-select");
  const add = $("btn-add-hijutsu");
  const list = $("hijutsu-list");
  const allow = $("hijutsu-multiple");
  if (!select || !add || !list) return;
  if (!Array.isArray(current.hijutsus)) current.hijutsus = [];
  const selectedIds = new Set(current.hijutsus.map((h) => h.id));
  const countLabel = $("hijutsu-count");
  if (countLabel) countLabel.textContent = current.hijutsus.length + " registrado(s)";
  select.innerHTML = '<option value="">Escolha um Hijutsu…</option>';
  HIJUTSU_CATALOG.filter((item) => !selectedIds.has(item.id)).forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.nome + " · p. " + item.pagina;
    select.appendChild(option);
  });
  select.disabled = !canEdit(current) || select.options.length <= 1;
  add.disabled = !canEdit(current) || select.options.length <= 1;
  if (allow) {
    allow.checked = !!current.permitirHijutsusMultiplos;
    allow.disabled = !canEdit(current);
  }

  list.innerHTML = "";
  if (!current.hijutsus.length) {
    const empty = document.createElement("p");
    empty.className = "empty hijutsu-empty";
    empty.textContent = "Nenhum Hijutsu registrado. Selecione um acima para acompanhar nível, estado e anotações.";
    list.appendChild(empty);
  }
  current.hijutsus.forEach((saved, index) => {
    const cat = getHijutsu(saved.id);
    if (!cat) return;
    const card = document.createElement("article");
    card.className = "hijutsu-card";
    const max = Math.min(cat.nivelMax || 10, pointsForNc(current.nc || 4).limite, 10);
    const level = Math.max(1, +saved.nivel || 1);
    card.innerHTML =
      '<div class="hijutsu-card-head"><div><strong>' + esc(cat.nome) + '</strong>' +
      '<small>Manual p. ' + cat.pagina + ' · gasto na ficha: ' + level + ' ponto(s) de poder</small></div>' +
      '<button type="button" class="danger hijutsu-remove" data-hijutsu-remove="' + index + '" title="Remover Hijutsu" ' + (canEdit(current) ? '' : 'disabled') + '>✕</button></div>' +
      '<p class="hijutsu-summary">' + esc(cat.resumo) + '</p>' +
      '<p class="hijutsu-prereq"><b>Pré-requisitos / notas:</b> ' + esc(cat.preRequisitos) + '</p>' +
      '<div class="hijutsu-controls"><label>Nível do poder <input type="number" min="1" max="' + Math.max(1, max) + '" value="' + level + '" data-hijutsu-level="' + index + '" ' + (canEdit(current) ? '' : 'disabled') + ' /></label>' +
      '<label class="hijutsu-active"><input type="checkbox" data-hijutsu-active="' + index + '" ' + (saved.ativo ? 'checked' : '') + ' ' + (canEdit(current) ? '' : 'disabled') + ' /> Modo/estado ativo (se aplicável)</label>' +
      '<span class="hijutsu-cap">Limite geral: ' + max + ' · máximo específico: ' + cat.nivelMax + '</span></div>' +
      '<label class="hijutsu-notes-label">Detalhes do personagem<textarea rows="2" data-hijutsu-notes="' + index + '" placeholder="' + esc(cat.notasPlaceholder || 'Técnicas, requisitos, custos especiais e limitações…') + '" ' + (canEdit(current) ? '' : 'disabled') + '>' + esc(saved.notas || '') + '</textarea></label>';
    list.appendChild(card);
  });
  updateHijutsuGuidance();

  select.onchange = () => { add.disabled = !canEdit(current) || !select.value; };
  add.onclick = () => {
    const cat = getHijutsu(select.value);
    if (!cat) return;
    current.hijutsus.push({ id: cat.id, nivel: 1, ativo: false, notas: "" });
    select.value = "";
    renderHijutsus();
    renderPowers();
    recalc();
    scheduleAutosave();
  };
  if (allow) allow.onchange = () => {
    current.permitirHijutsusMultiplos = allow.checked;
    updateHijutsuGuidance();
    scheduleAutosave();
  };
  list.oninput = (event) => {
    const t = event.target;
    if (t.dataset.hijutsuNotes != null) {
      const idx = +t.dataset.hijutsuNotes;
      if (current.hijutsus[idx]) current.hijutsus[idx].notas = t.value;
    }
  };
  list.onchange = (event) => {
    const t = event.target;
    if (t.dataset.hijutsuLevel != null) {
      const idx = +t.dataset.hijutsuLevel;
      const cat = getHijutsu(current.hijutsus[idx]?.id);
      if (!cat) return;
      const max = Math.min(cat.nivelMax || 10, pointsForNc(current.nc || 4).limite, 10);
      current.hijutsus[idx].nivel = Math.max(1, Math.min(max, +t.value || 1));
      renderHijutsus();
      renderPowers();
      recalc();
    } else if (t.dataset.hijutsuActive != null) {
      const idx = +t.dataset.hijutsuActive;
      if (current.hijutsus[idx]) current.hijutsus[idx].ativo = t.checked;
    }
    updateHijutsuGuidance();
    scheduleAutosave();
  };
  list.onclick = (event) => {
    const button = event.target.closest("[data-hijutsu-remove]");
    if (!button) return;
    const idx = +button.dataset.hijutsuRemove;
    current.hijutsus.splice(idx, 1);
    renderHijutsus();
    renderPowers();
    recalc();
    scheduleAutosave();
  };
}

function renderPowers() {
  const box = $("power-list");
  box.innerHTML = "";
  const disp = poderDisponivel(current);
  const gJ = (current.poderes || []).reduce((s, p) => s + Math.max(1, +p.nivel || 1), 0);
  const gH = (current.hijutsus || []).reduce((s, h) => s + Math.max(1, +h.nivel || 1), 0);
  const gA = poderGastoApt(current);
  const total = gJ + gH + gA;
  const hdr = document.createElement("p");
  hdr.className = "apt-info" + (total > disp ? " bad" : "");
  hdr.innerHTML = "Pontos de poder: <strong>" + total + " / " + disp + "</strong>" +
    " <span class='muted'>(jutsus " + gJ + " + hijutsus " + gH + " + aptidões extra " + gA + ")</span>";
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
  recalc();
  scheduleAutosave();
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

function scheduleAutosave() {
  if (isFillingSheet || !current || !canEdit(current)) return;
  clearTimeout(autosaveTimer);
  try { readSheet(); } catch {}
  setStatus("Alterações pendentes…");
  autosaveTimer = setTimeout(() => {
    readSheet();
    persist();
    renderBingo();
  }, 650);
}

async function flushAutosave() {
  clearTimeout(autosaveTimer);
  if (isFillingSheet || !$('view-sheet') || $('view-sheet').classList.contains('hidden')) return;
  if (!current || !canEdit(current)) return;
  try {
    readSheet();
    const pendingSave = persist();
    renderBingo();
    await pendingSave;
  } catch (error) {
    console.warn("Não foi possível finalizar o salvamento automático", error);
  }
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
  document.querySelectorAll("[data-sheet-tab]").forEach((tab) => {
    tab.addEventListener("click", () => setActiveSheetTab(tab.dataset.sheetTab));
  });
  setActiveSheetTab("perfil");
  const sheetRoot = $("view-sheet");
  if (sheetRoot) {
    sheetRoot.addEventListener("input", scheduleAutosave);
    sheetRoot.addEventListener("change", scheduleAutosave);
    sheetRoot.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || button.classList.contains("roll-btn")) return;
      if (["btn-open-selected-token", "btn-open-selected-token-top", "btn-bind-token", "btn-unbind-token", "btn-claim-owner"].includes(button.id)) return;
      setTimeout(scheduleAutosave, 0);
    });
  }
  $("btn-auto-open").onclick = toggleAutoOpen;
  $("btn-bingo").onclick = async () => { await flushAutosave(); show("bingo"); renderBingo(); };
  $("btn-new").onclick = async () => {
    await flushAutosave();
    current = blankChar();
    claimOwnership(current);
    show("sheet");
    fillSheet();
    setReadOnly(false);
    setStatus("Novo perfil · você é o dono");
  };
  $("btn-save").onclick = () => { readSheet(); persist(); renderBingo(); };
  const btnTok = $("btn-bind-token");
  if (btnTok) btnTok.onclick = () => bindToSelectedToken();
  const btnOpenToken = $("btn-open-selected-token");
  if (btnOpenToken) btnOpenToken.onclick = () => openSelectedTokenSheet();
  const btnOpenTokenTop = $("btn-open-selected-token-top");
  if (btnOpenTokenTop) btnOpenTokenTop.onclick = () => openSelectedTokenSheet();
  const btnUn = $("btn-unbind-token");
  if (btnUn) btnUn.onclick = () => {
    current.linkedTokenId = null;
    current.linkedTokenName = "";
    persist();
    updateTokenBadge();
    setStatus("Token desvinculado nesta ficha. A ficha salva no token continua lá.");
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
    renderHijutsus();
    renderPowers();
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
  $("cla").oninput = () => { current.cla = $("cla").value; updateHijutsuGuidance(); };
  $("cla").onchange = () => renderAptitudes();
  $("nome").oninput = () => {
    current.nome = $("nome").value;
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

      // Quando o background pede abertura
      OBR.player.onChange(async (player) => {
        const m = player.metadata || {};
        if (typeof m[AUTO_OPEN_KEY] === "boolean" && m[AUTO_OPEN_KEY] !== autoOpenOnSelect) {
          autoOpenOnSelect = m[AUTO_OPEN_KEY];
          renderAutoOpenButton();
        }
        if (m[OPEN_FLAG]) await openFromTokenRequest();
      });

      const playerMeta = await OBR.player.getMetadata().catch(() => ({}));
      if (typeof playerMeta?.[AUTO_OPEN_KEY] === "boolean") {
        autoOpenOnSelect = playerMeta[AUTO_OPEN_KEY];
      } else {
        const localAuto = localStorage.getItem(AUTO_OPEN_KEY);
        if (localAuto != null) {
          try { autoOpenOnSelect = JSON.parse(localAuto) !== false; } catch {}
        }
        await OBR.player.setMetadata({ [AUTO_OPEN_KEY]: autoOpenOnSelect }).catch(() => {});
      }
      renderAutoOpenButton();

      // Se a extensão foi aberta a partir de um token, não volte para o Arquivo logo depois.
      const openedFromToken = await openFromTokenRequest();
      if (!openedFromToken) {
        show("bingo");
        renderBingo();
      }
      updateTokenBadge();
    });
  } else {
    const localAuto = localStorage.getItem(AUTO_OPEN_KEY);
    if (localAuto != null) {
      try { autoOpenOnSelect = JSON.parse(localAuto) !== false; } catch {}
    }
    renderAutoOpenButton();
    setStatus("Modo local");
    show("bingo");
    renderBingo();
  }
}

boot();
