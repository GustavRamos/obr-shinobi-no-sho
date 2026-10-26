# Shinobi no Sho — Bingo Book + Fichas por Token (v1.3.0)

Extensão para **Owlbear Rodeo** inspirada no sistema **Naruto: Shinobi no Sho — Livro Básico, 4.1b**. Esta versão reorganiza o acesso às fichas por token e acrescenta uma área própria para registrar e acompanhar Hijutsus.

## O que mudou nesta versão

### Ficha individual no token

- Cada token da camada **Character** pode guardar sua própria ficha no `metadata` da cena.
- Ao selecionar um token, o plugin pode abrir automaticamente a ficha associada. A abertura automática pode ser desligada em **Auto-ficha: ON/OFF**.
- Se o token ainda não tiver ficha, abrir/criar gera uma ficha vazia já vinculada ao token e salva esse registro no próprio token, mesmo antes da primeira edição.
- Há um botão **Ficha do token** no cabeçalho, outro dentro da ficha e um menu contextual ao clicar com o botão direito no token.
- A ficha é salva automaticamente durante a edição; o botão **Salvar** continua disponível.
- Vincular uma ficha a um token que já tem outra ficha não sobrescreve os dados silenciosamente. Tokens duplicados no mapa ganham um ID de ficha independente na primeira abertura, mesmo que o Owlbear tenha copiado o metadata do original; tokens legados sem vínculo também são normalizados.

**Fluxo recomendado:** selecione um token na camada Character → a ficha abre; preencha e continue jogando. Se preferir não abrir automaticamente, desligue **Auto-ficha** e use **Ficha do token** ou o menu contextual.

> A abertura automática reage à seleção do token. Se selecionar tokens com frequência estiver atrapalhando o movimento no mapa, deixe a opção desligada e use o botão/menu quando necessário.

### Hijutsus separados das aptidões

A nova seção **Hijutsus e progressão** tem catálogo, nível, indicador de atividade na cena, notas de progresso, custo de pontos de poder e referência da página impressa do manual. O catálogo cobre:

| Hijutsu | Página impressa |
|---|---:|
| Dokujutsu (Arte dos Venenos) | 201 |
| Hachimon Tonkou (Oito Portões Celestiais) | 202 |
| Hibon Ninpou (Arte Ninja Única) | 212 |
| Jinchuuriki (Poder do Sacrifício Humano) | 213 |
| Kagura Shingan (Olho Divino da Mente) | 222 |
| Kuchiyose (Invocação) | 224 |
| Magen (Ilusão Demoníaca) | 233 |
| Senjutsu (Técnica Eremita) | 239 |
| Tensai (Genialidade) | 241 |
| Versatilidade | 242 |

- Os níveis dos poderes/Hijutsus entram no cálculo de pontos de poder gastos.
- O nível máximo sugerido na ficha respeita o limite geral de poder baseado no NC e o limite específico registrado no catálogo — por exemplo, Hachimon Tonkou vai até o nível 8.
- O painel alerta para combinações que precisam de atenção, a regra usual de um Hijutsu ou um clã, a regra opcional para múltiplos Hijutsus, e a restrição de Versatilidade com Hibon Ninpou + Tensai.
- A combinação Senjutsu + Kuchiyose é reconhecida como complementar. A ficha alerta se Vigor estiver abaixo de 14 e se não houver uma via aparente registrada, mas os requisitos específicos (tipo de contrato, aptidões necessárias e caminho por Mokuton) ainda devem ser verificados no livro.
- Perfis antigos que guardavam um nome de Hijutsu no campo **Clã / Hijutsu** são migrados quando o texto corresponde exatamente ao nome/identificador do catálogo.

**Importante:** o catálogo é uma referência compacta, não uma transcrição do manual. Ele não automatiza todas as técnicas, pré-requisitos, custos em situações especiais, efeitos ou exceções de cada poder. Use as páginas impressas indicadas no livro para validar as regras da mesa; quando uma combinação opcional for permitida, a decisão e a interação dos benefícios pertencem ao Mestre.

### Correção de Byakugan e Sharingan

Byakugan e Sharingan são tratados como aptidões restritas de clãs — Hyuuga e Uchiha — e não como entradas autônomas do catálogo geral de Hijutsus. Foram removidos seus bônus estáticos simplificados, porque o manual descreve ativação e benefícios específicos. Perfis antigos que aplicavam esses modificadores são ajustados para não continuar somando bônus que não correspondem às regras completas.

### Organização e segurança dos dados

- Dados do personagem ficam no `metadata` do token; o arquivo do jogador e o `localStorage` continuam servindo como cópias auxiliares.
- O salvamento automático é finalizado antes de trocar de ficha, evitando que uma edição pendente vá parar no personagem errado.
- A ficha não sobrescreve uma ficha de token diferente sem avisar.
- O controle de acesso por dono/GM continua ativo.

## Instalação / atualização

1. Hospede os arquivos da pasta raiz em uma URL **HTTPS** (por exemplo, GitHub Pages ou outro host estático).
2. No Owlbear Rodeo, abra **Profile → Add Extension**.
3. Informe a URL HTTPS do `manifest.json` hospedado.
4. Para atualizar uma instalação existente, mantenha a mesma URL do manifesto e publique a nova versão dos arquivos.

Os arquivos devem permanecer juntos na raiz: `manifest.json`, `index.html`, `app.js`, `background.js`, `background.html`, `style.css`, `hijutsu-data.js`, `aptidoes-data.js` e `icon.svg`.

Para desenvolvimento local, `npm start` serve a pasta atual na porta 5173; o SDK do Owlbear continua sendo carregado por CDN.

## Recursos mantidos

- Bingo Book com busca e filtros por nível/vila.
- Fichas com atributos, perícias, combate, vitalidade, chakra, aptidões, poderes/jutsus e notas.
- Rolagens 2d8, testes de perícias/combate e cálculo de dano com expressões como `2d8+3`, `2d8+Espírito` e `1d8+NC`.
- Resultados exibidos na extensão e notificados na sala quando suportado pelo ambiente.
- Cartões de poderes com rank, nível, custo de chakra, precisão, dano e descrição.

## Licença e referência

A lógica do plugin e os resumos curtos do catálogo são código/material auxiliar da extensão. A referência de regras é **Naruto: Shinobi no Sho — Livro Básico, 4ª edição (4.1b)**, de Diego “Fesant” Silva e colaboradores, publicado pelo Projeto D8. O livro identifica licença **Creative Commons Atribuição–Uso Não-Comercial–Compartilhamento pela mesma licença 2.5 Brasil (CC BY-NC-SA 2.5 BR)**. Este plugin não substitui o livro e mantém as descrições dos Hijutsus em forma resumida e para consulta de páginas.
