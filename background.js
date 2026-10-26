/** Background: abre a ficha associada ao token selecionado e registra o menu contextual. */
import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3";

const ID = "com.shinobinosho.ficha";
const SELECTED = `${ID}/selectedToken`;
const OPEN_FLAG = `${ID}/openRequest`;
const AUTO_OPEN = `${ID}/autoOpenOnSelect`;
const TOKEN_META = `${ID}/character`;

let previousSelectionKey = "";
let openingFromSelection = false;

async function openForToken(tokenId) {
  if (!tokenId) return;
  await OBR.player.setMetadata({
    [SELECTED]: tokenId,
    [OPEN_FLAG]: Date.now(),
  });
  try {
    const opened = await OBR.action.isOpen();
    if (!opened) await OBR.action.open();
  } catch {
    // A solicitação fica em metadata e será lida quando a extensão abrir.
  }
}

OBR.onReady(async () => {
  await OBR.contextMenu.create({
    id: `${ID}/menu-open`,
    icons: [{
      icon: "/icon.svg",
      label: "Bingo Book — Abrir/criar ficha",
      filter: {
        min: 1,
        max: 1,
        every: [{ key: "layer", value: "CHARACTER" }],
      },
    }],
    onClick: async (context) => {
      const item = context.items[0];
      if (!item) return;
      previousSelectionKey = item.id;
      await openForToken(item.id);
    },
  });

  // Autoabre quando a seleção muda para um único token Character. O botão
  // dentro do popover permite desativar esta conveniência para movimentar tokens.
  OBR.player.onChange(async (player) => {
    const selection = Array.isArray(player.selection) ? player.selection : [];
    const nextKey = selection.length === 1 ? selection[0] : "";
    if (nextKey === previousSelectionKey) return;
    previousSelectionKey = nextKey;
    if (!nextKey || player.metadata?.[AUTO_OPEN] === false || openingFromSelection) return;

    openingFromSelection = true;
    try {
      const items = await OBR.scene.items.getItems([nextKey]);
      const item = items[0];
      if (!item || item.layer !== "CHARACTER") return;
      // Evita abrir no meio de seleções de mapas/objetos e somente reage a tokens.
      await openForToken(item.id);
    } catch (error) {
      console.warn("Não foi possível abrir o dossiê do token selecionado", error);
    } finally {
      openingFromSelection = false;
    }
  });
});