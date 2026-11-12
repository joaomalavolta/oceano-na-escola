# Fotos da escola e linha do tempo da rede

Uma escola acompanha o que a outra está fazendo pelas saídas de campo e
pelas fotos que cada uma publica. Este documento registra o que foi feito
e as regras que continuam valendo.

## 1. Onde cada foto entra

| Foto | Onde se envia | Onde aparece em público |
| --- | --- | --- |
| **Capa da escola** | No cadastro (opcional) ou na ficha da escola, seção Fotos | Cartão em `/escolas`, cabeçalho da página da escola, galeria |
| **Turma e mapeadores** | Ficha da escola, seção Fotos | Galeria da página da escola |
| **Saída de campo** | Diário da expedição (`/expedicoes/<id>/diario`), seção Fotos da saída | Galeria da escola e, com a expedição publicada, a linha do tempo |
| **Ocorrência** | Registro em campo (`/campo`), como antes | Mapa, galeria e a saída a que pertence |

## 2. As regras não mudaram

- **Só quem responde pela escola envia.** RLS de `evidencia` e política do
  Storage, que confere a pasta `escola-<id>`.
- **A foto nasce "só para a escola".** Vai a público por ato de uma pessoa,
  registrada em `curada_por`. O botão Publicar fica ao lado da foto.
- **Exceção: a capa.** Escolhê-la já é a curadoria, e ela é publicada no
  envio. Ainda assim só aparece com a escola aprovada e com termo de imagem.
- **Sem termo de imagem, nada aparece.** Nem a capa.
- **Uma capa por escola**, garantida por índice no banco.
- **Pedido de remoção** continua aberto a quem não tem conta, e tira a foto do
  ar na hora — inclusive a capa. Na linha do tempo, ele fica dentro do visor
  que abre ao tocar na foto.
- **Não existe foto ou perfil de aluno individual.** As premissas (bloco 2)
  pedem foto apenas como registro coletivo da turma e da saída, e nome de
  estudante fora de página pública. As telas de envio repetem isso: "não
  escreva nome de aluno na legenda".

Verificado no banco com papel real de professor, conta sem vínculo e
visitante: 13 de 13 casos.

## 3. A linha do tempo

`/linha-do-tempo`, no menu ao lado de Escolas. Uma saída de campo por marco,
da mais recente para a mais antiga, agrupadas por mês, com até quatro fotos
curadas e um "+n" que leva à página da escola. Recorte por rede: toda a rede,
escolas, escolas de surf (`?rede=surf`).

Só entra o que já era público: expedições publicadas (`pub_expedicao`) de
escolas publicadas, e fotos que passaram pelas três portas (`pub_galeria`).
A página é `noindex`, pela regra da galeria: tem foto de turma.

Na página de cada escola, a aba Expedições passou a ser a linha do tempo da
própria escola, com até oito fotos por saída.

## 4. Lacuna conhecida, fora desta entrega

A regra "galeria fora dos buscadores" (premissas, bloco 9) está aplicada à
linha do tempo, mas não à galeria da página da escola: ela é uma aba da
página da escola, que as premissas querem indexável. Resolver pede separar a
galeria numa rota própria, ou aceitar a página inteira como `noindex`.
Decisão do Ecosurf.
