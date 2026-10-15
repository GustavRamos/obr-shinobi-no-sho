# Shinobi no Sho — Bingo Book (Owlbear Rodeo)

Extensão de **Bingo Book + ficha** para o sistema **Naruto: Shinobi no Sho (D8)**.

## O que tem

### Bingo Book
- Lista de perfis (PCs e NPCs) com **nível de ameaça** (D → SS)
- Busca por nome, clã, vila, jutsu
- Filtro por nível shinobi e vila
- Cards com Vit/Cha, CC, ESQ e poderes
- Rolagem rápida de **CC** e **ESQ** direto do card

### Ficha
- Atributos, perícias, combate com **botão 🎲 em cada linha**
- Poderes com **rank, nível, custo, precisão e dano**
- Um clique: **Teste** (2d8+precisão) ou **Dano** (ex: `2d8+Espírito`)
- Vitalidade/Chakra atuais editáveis
- Radar de atributos
- Pontos automáticos por NC

### Rolagem no Owlbear
- Resultados vão para a barra de status da extensão
- E notificam a sala via `OBR.notification` (todo mundo vê)

## Instalar

1. Hospede a pasta `public/` em HTTPS (Netlify Drop, GitHub Pages, etc.)
2. No Owlbear: **Profile → Add Extension**
3. Cole: `https://SEU-SITE/manifest.json`
4. Ative na sala → ícone **Bingo Book** no canto superior esquerdo

## Dano — exemplos

| Campo dano | Resultado |
|------------|-----------|
| `2d8` | dois d8 |
| `2d8+3` | dois d8 + 3 |
| `1d8+Espírito` | usa o Espírito da ficha |
| `2d8+Força` | usa Força |
| `1d8+NC` | soma o NC |

## Fluxo na mesa

1. Abra o **Bingo Book**
2. Cadastre inimigos/aliados (+ Novo → preencha → Salvar)
3. No combate: abra o perfil ou role CC/ESQ no card
4. Na ficha: 🎲 em perícia, atributo ou poder
5. Dano do jutsu: botão **Dano** no card do poder

## Arquivos

```
public/
  manifest.json
  index.html
  app.js
  style.css
  icon.svg
```


## Dados na mesa (física / histórico)

O Bingo Book **não desenha dados 3D sozinho** — isso é papel das extensões de dados do Owlbear.

### Recomendado na mesma sala

1. **JustDices** (histórico na mesa + API)  
   Instalar: `https://justdices.onrender.com/manifest.json`  
   Com ele ativo, cada 🎲 do Bingo Book envia `2d8+precisão` (ou a fórmula de dano) para a mesa. Todos veem no log do JustDices.

2. **Dice** (oficial Owlbear — 3D com física)  
   Extensão da loja: [Dice](https://extensions.owlbear.rodeo/dice)  
   Abra o tray, coloque **dois d8** + bônus e role. A física e a animação sincronizam para todos.

### Fluxo prático

| O que você quer | Como |
|-----------------|------|
| Rolar da ficha e ver na mesa | Bingo Book 🎲 + **JustDices** instalado |
| Ver dados 3D caindo | Extensão **Dice** oficial |
| Os dois | Use as duas extensões na sala |

O resultado do **sistema** (fracasso 2–3, sucesso 15–16, total + precisão) continua na notificação e na barra do Bingo Book.


## Ficha por token

Cada personagem/NPC no **mapa** pode ter a ficha gravada no próprio token.

### Como usar

1. Coloque um token na camada **Character**
2. Clique com o botão direito no token → **Bingo Book — Dossiê**
3. Preencha e **Salvar** → dados ficam no `metadata` do token
4. Ou no dossiê: **Vincular ao token selecionado**

### O que fica onde

| Local | Conteúdo |
|-------|----------|
| **Token** | Ficha completa (atributos, perícias, poderes, Vit/Cha) |
| **Lista do player** | Cópia no Bingo Book (arquivo) |
| **localStorage** | Backup no navegador |

Ao reabrir a cena, o token ainda tem a ficha. Clique de novo no token → **Dossiê**.


## Acesso exclusivo por jogador

Cada ficha tem um **dono** (`ownerId` do player no Owlbear).

| Papel | Pode ver | Pode editar |
|-------|----------|-------------|
| **Jogador** | Só as próprias fichas (+ sem dono) | Só as próprias |
| **GM** | Todas | Todas |

### Como funciona

1. Ao criar/salvar uma ficha, o jogador vira **dono**
2. No Bingo Book, o jogador **só vê a lista dele**
3. No token de outro player → mensagem de bloqueio
4. Botão **Tornar-me dono** (se sem dono ou se for GM)

### Dica de mesa

No Owlbear, ative também **CHARACTER_OWNER_ONLY** nas permissões da sala para os jogadores só moverem o próprio token. A ficha do Bingo Book reforça a mesma regra no dossiê.
