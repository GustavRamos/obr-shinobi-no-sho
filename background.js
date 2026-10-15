/**
 * Background — menu no token + ponte com o popover
 */
import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3";

const ID = "com.shinobinosho.ficha";
const SELECTED = `${ID}/selectedToken`;
const OPEN_FLAG = `${ID}/openRequest`;

OBR.onReady(async () => {
  // Abrir dossiê do token
  await OBR.contextMenu.create({
    id: `${ID}/menu-open`,
    icons: [
      {
        icon: "/icon.svg",
        label: "Bingo Book — Dossiê",
        filter: {
          min: 1,
          max: 1,
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],
    onClick: async (context) => {
      const item = context.items[0];
      if (!item) return;
      await OBR.player.setMetadata({
        [SELECTED]: item.id,
        [OPEN_FLAG]: Date.now(),
      });
      try {
        await OBR.action.open();
      } catch {}
    },
  });

  // Vincular / criar ficha no token
  await OBR.contextMenu.create({
    id: `${ID}/menu-bind`,
    icons: [
      {
        icon: "/icon.svg",
        label: "Bingo Book — Vincular ficha",
        filter: {
          min: 1,
          max: 1,
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],
    onClick: async (context) => {
      const item = context.items[0];
      if (!item) return;
      await OBR.player.setMetadata({
        [SELECTED]: item.id,
        [OPEN_FLAG]: Date.now(),
        [`${ID}/bindRequest`]: true,
      });
      try {
        await OBR.action.open();
      } catch {}
    },
  });
});
