# Oceano na Escola — Protocolos e Fichas v1.0

**Instituto Ecosurf** · Passo 2 do plano de produção · Agosto de 2026

Dois protocolos definidos campo a campo, no formato que gera tanto a ficha impressa quanto o
formulário web. Cada protocolo tem número de versão. Todo dado coletado fica amarrado à versão do
protocolo que o gerou, para que a série histórica sobreviva a mudanças futuras.

---

## Estrutura comum a todo protocolo

Todo protocolo do Oceano na Escola tem cinco partes. Essa estrutura é o que o banco de dados
precisa saber generalizar.

| Parte | O que é | Exemplo |
|---|---|---|
| Cabeçalho | Herdado da Expedição, preenchido uma vez | Escola, turma, data, praia |
| Esforço amostral | Quanto foi percorrido ou amostrado | 50 m de trecho, 5 quadrats |
| Contagem | Linhas de item × quantidade | 14 bitucas, 3 garrafas PET |
| Qualitativo | O que a tabela não captura | "Muito lixo perto da saída de drenagem" |
| Evidência | Fotos e fichas digitalizadas | Foto do trecho, scan da ficha da equipe |

Sem o esforço amostral, a contagem não vira densidade e o dado não serve para comparar praias nem
anos. Esse é o campo que mais se esquece em coleta escolar.

---

## Cabeçalho da Expedição

Preenchido pelo professor, uma vez por saída de campo. Vale para todos os protocolos aplicados
naquela expedição.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Número da expedição | Automático | Sim | Gerado pela plataforma |
| Escola | Seleção | Sim | Herdado do cadastro |
| Turma | Seleção | Sim | Herdado do cadastro |
| Professor responsável | Seleção | Sim | |
| Data da saída de campo | Data | Sim | Diferente da data de digitação |
| Hora de início e de término | Hora | Sim | |
| Praia ou área | Texto | Sim | Ex.: Praia do Sonho, Itanhaém |
| Ponto inicial | Coordenada | Sim | GPS do celular |
| Ponto final | Coordenada | Sim | |
| Extensão percorrida | Número, m | Sim | Calculada ou medida |
| Número de mapeadores | Inteiro | Sim | |
| Número de equipes | Inteiro | Sim | |
| Maré | Seleção | Sim | Enchente, vazante, preamar, baixamar |
| Chuva nas últimas 24 h | Seleção | Sim | Sim, não, não sei |
| Vento | Seleção | Não | Calmo, moderado, forte |
| Observações gerais | Texto longo | Não | |

Maré e chuva recente entram porque explicam variação de resíduo entre duas coletas na mesma praia.
Sem eles, uma queda de 40% nos números pode ser interpretada como melhora quando foi só a maré.

---

# Protocolo 01 — Resíduos costeiros e marinhos

**Versão 1.0** · Unidade amostral: trecho de praia por equipe

## Método

Cada equipe recebe um **trecho de 50 m de comprimento**, medido ao longo da praia, cobrindo toda a
**largura** entre a linha d'água e o limite posterior (vegetação, duna, muro ou calçadão). A equipe
recolhe e conta todo resíduo visível maior que 2,5 cm dentro do trecho.

A largura é medida com trena ou passo contado e anotada, porque é ela que transforma contagem em
densidade. Resultado final em **itens por m²**.

## Campos de esforço (por equipe)

| Campo | Tipo | Obrigatório |
|---|---|---|
| Identificação da equipe | Texto | Sim |
| Nomes dos mapeadores | Texto | Sim (fica só na ficha impressa) |
| Comprimento do trecho | Número, m | Sim |
| Largura média do trecho | Número, m | Sim |
| Coordenada de início do trecho | Coordenada | Sim |
| Peso total recolhido | Número, kg | Não |

## Lista de itens

Lista fechada. Cada linha registra código, quantidade e nada mais. A equipe pode acrescentar item
não previsto no campo "outros", com descrição.

**Plástico**

| Código | Item |
|---|---|
| PL01 | Bituca de cigarro |
| PL02 | Sacola plástica |
| PL03 | Garrafa PET |
| PL04 | Tampa ou tampinha |
| PL05 | Canudo |
| PL06 | Copo descartável |
| PL07 | Talher, prato ou mexedor |
| PL08 | Embalagem de salgadinho, biscoito ou bala |
| PL09 | Cotonete ou haste plástica |
| PL10 | Absorvente, fralda ou aplicador |
| PL11 | Linha, anzol ou isca de pesca |
| PL12 | Corda, cabo ou rede |
| PL13 | Fragmento de plástico duro maior que 2,5 cm |
| PL14 | Chinelo, calçado ou brinquedo |
| PL15 | Máscara ou luva descartável |
| PL16 | Ponta ou pedaço de balão |

**Isopor e espumas**

| Código | Item |
|---|---|
| EP01 | Caixa, prato ou bandeja de isopor |
| EP02 | Fragmento de isopor maior que 2,5 cm |
| EP03 | Espuma ou esponja |

**Outros materiais**

| Código | Item |
|---|---|
| MT01 | Lata de alumínio |
| MT02 | Tampa metálica ou lacre |
| MT03 | Outro metal |
| VD01 | Garrafa de vidro |
| VD02 | Caco de vidro |
| PA01 | Papel, papelão ou embalagem cartonada |
| BR01 | Borracha, pneu ou câmara de ar |
| TX01 | Tecido, roupa ou pano |
| MD01 | Madeira processada, palito ou tábua |
| SA01 | Resíduo de saúde: seringa, agulha, medicamento |
| OU01 | Outro (descrever) |

## Campos por linha de contagem

| Campo | Tipo | Obrigatório |
|---|---|---|
| Código do item | Seleção | Sim |
| Quantidade | Inteiro | Sim |
| Descrição | Texto | Só quando o código é OU01 |

## Registro pontual (opcional, até 5 por equipe)

Para o achado que merece foto e coordenada própria: objeto grande, descarte irregular, foco
concentrado.

| Campo | Tipo | Obrigatório |
|---|---|---|
| Descrição | Texto | Sim |
| Coordenada | Coordenada | Sim |
| Foto | Imagem | Sim |
| Origem provável | Seleção | Sim |
| Observação | Texto | Não |

**Origem provável:** uso na praia (banhista), pesca, náutico, drenagem ou esgoto, descarte urbano,
industrial, saúde, indefinido.

## Campos qualitativos (por equipe)

- O que mais chamou a atenção no trecho.
- Havia saída de drenagem, córrego ou esgoto próximo. Sim ou não, e onde.
- O lixo estava espalhado ou concentrado em pontos.

---

# Protocolo 02 — Microplásticos

**Versão 1.0** · Unidade amostral: quadrat de 50 × 50 cm

## Método

Microplástico não se conta como resíduo grande. Só faz sentido como **densidade por área**, e isso
exige amostragem padronizada.

Cada equipe faz **5 quadrats de 50 × 50 cm** (0,25 m² cada), espaçados a cada 10 m ao longo do
trecho, posicionados sobre a **linha de deixa** — a faixa de detritos deixada pela última preamar,
onde o microplástico se acumula.

Em cada quadrat, a equipe recolhe os **2 cm superficiais** de sedimento, peneira em malha de
**1 mm** e conta visualmente as partículas de **1 a 5 mm** por classe.

**Limite de detecção declarado:** partículas menores que 1 mm exigem laboratório e não entram neste
protocolo. Isso precisa estar escrito na ficha, para que ninguém leia o resultado como contagem
total de microplástico.

## Campos de esforço (por equipe)

| Campo | Tipo | Obrigatório |
|---|---|---|
| Identificação da equipe | Texto | Sim |
| Número de quadrats | Inteiro | Sim |
| Área de cada quadrat | Número, m² | Sim (padrão 0,25) |
| Profundidade coletada | Número, cm | Sim (padrão 2) |
| Malha da peneira | Número, mm | Sim (padrão 1) |
| Posição na praia | Seleção | Sim |
| Coordenada do primeiro quadrat | Coordenada | Sim |

**Posição na praia:** linha de deixa, faixa entre-marés, pós-praia seca, base da duna ou restinga.

## Campos por quadrat

| Campo | Tipo | Obrigatório |
|---|---|---|
| Número do quadrat | Inteiro | Sim |
| Distância do ponto inicial | Número, m | Sim |
| Fragmento duro | Inteiro | Sim |
| Pellet (esfera ou disco industrial) | Inteiro | Sim |
| Isopor ou espuma | Inteiro | Sim |
| Filme (plástico mole, saco) | Inteiro | Sim |
| Filamento ou fio | Inteiro | Sim |
| Outro | Inteiro | Sim |
| Foto do quadrat | Imagem | Não |

**Pellet merece coluna própria.** É matéria-prima industrial, tem origem rastreável e a Baixada
Santista tem histórico de aporte. Contá-lo separado transforma o dado em argumento de gestão, não
só em número ambiental.

## Cálculo automático

```
densidade (itens/m²) = total de partículas ÷ (área do quadrat × número de quadrats)
```

Com 5 quadrats de 0,25 m², o divisor é 1,25 m². A plataforma calcula. A ficha impressa traz a conta
escrita para a turma fazer em sala.

---

# Ficha do aluno mapeador

Uma por equipe, por protocolo. Impressa em uma folha A4, frente e verso.

**Frente — cabeçalho da equipe**

```
OCEANO NA ESCOLA          Protocolo 01 — Resíduos costeiros      v1.0
Expedição nº ____   Data ___/___/______   Ficha ____ de ____

Escola _______________________  Turma ______  Equipe ______

Mapeadores ________________________________________________

Trecho: comprimento ______ m    largura ______ m
Coordenada de início ________________  Hora ______
```

**Frente — tabela de contagem**

Três colunas repetidas em duas metades da folha, com os códigos já impressos e espaço para a
contagem em risquinhos e o total ao lado.

```
CÓD  ITEM                          CONTAGEM              TOTAL
PL01 Bituca de cigarro             |||| |||| ||          [ 12 ]
PL02 Sacola plástica               ||                    [  2 ]
...
```

**Verso — registro pontual e qualitativo**

Cinco blocos para achados com foto, e três perguntas abertas.

---

# Ficha do professor

Uma por expedição. Consolida todas as equipes e é a que vira dado na plataforma.

```
OCEANO NA ESCOLA — FICHA CONSOLIDADA
Expedição nº ____  Escola ____________  Turma ______
Data ___/___/______   Praia __________________________

Maré ________  Chuva 24 h ______  Vento ________
Mapeadores ______  Equipes ______
Extensão total ______ m   Largura média ______ m   Área ______ m²
```

Tabela com uma coluna por equipe e a soma na última coluna:

```
CÓD  ITEM                    E1    E2    E3    E4   TOTAL
PL01 Bituca de cigarro       12    18     9    14    [53]
PL02 Sacola plástica          2     0     3     1    [ 6]
...
                                        TOTAL GERAL  [   ]
                                  DENSIDADE itens/m² [   ]
```

O professor transcreve a coluna TOTAL na plataforma. As colunas por equipe ficam na ficha impressa
e são digitalizadas como evidência anexa à expedição.

---

# O que isso define para o banco de dados

| Conceito do protocolo | Entidade no banco |
|---|---|
| Protocolo e sua versão | `protocolo`, `protocolo_versao` |
| Seção da ficha | `protocolo_secao` |
| Campo com tipo, unidade, obrigatoriedade, padrão | `protocolo_campo` |
| Lista de itens com código | `protocolo_item` |
| Unidade amostral (trecho, quadrat) | `unidade_amostral` |
| Linha de contagem | `observacao_contagem` |
| Registro pontual com foto e coordenada | `observacao_pontual` |
| Campo qualitativo | `observacao_texto` |
| Ficha digitalizada | `evidencia` |

Um protocolo novo entra cadastrando seções, campos e itens. Nenhuma tabela nova, nenhuma migration
de schema — foi assim que os cinco protocolos abaixo entraram.

---

# Protocolos de ocorrência

*Aprovados em 12/08/2026.*

RES e MIC medem **densidade**: exigem esforço amostral, área conhecida e ficha impressa, porque
contagem sem área não vira densidade e não compara praia nem ano.

Os cinco protocolos abaixo são de **ocorrência pontual**. O aluno registra o que encontra no ponto
em que está, com coordenada exata e magnitude na unidade do item. Não têm quadrat nem trecho, e por
isso nascem direto no celular, em `/campo`.

| Código | O que registra | Magnitude |
|---|---|---|
| RST | Supressão de restinga, pisoteio, invasora, aterro | m² afetados |
| ESG | Lançamento em drenagem, ligação irregular, espuma/odor, córrego | pontos, metros |
| DES | Entulho, volumoso, queima, acúmulo em terreno | pontos, m² |
| AVI | Espécie avistada, ninho, fauna com resíduo, encalhe | indivíduos, pontos |
| AGU | pH, turbidez, temperatura, salinidade | valor medido |

**O que o método destes cinco tem de diferente.** Em RES e MIC, o cuidado central é o esforço
amostral — sem ele o dado não existe. Aqui o cuidado central é **observar sem interferir e sem se
expor**, porque é esse o risco real: não tocar na água de lançamento, não revirar entulho, não
aproximar de ninho, não entrar em terreno particular, não tocar em animal encalhado. Cada método
está escrito por extenso em `protocolo_versao.metodo` e aparece na ficha impressa.

Três regras que atravessam os cinco:

- **Descrever vale mais que nomear errado.** Espécie só é registrada com identificação segura; na
  dúvida, foto e descrição.
- **Ninho não ganha coordenada de acesso.** Registro à distância, sem foto aproximada e sem indicar
  trilha na descrição.
- **Valor isolado diz pouco.** Em AGU, a medição repetida no mesmo ponto e no mesmo estágio de maré
  é o que constrói a série; um número solto não sustenta conclusão.

As listas de itens abrem com quatro entradas cada. Item novo entra por cadastro, sem migration, e o
dado antigo continua amarrado à versão que o gerou.

---

## Próximo passo

Passos 3 a 6 concluídos: banco com PostGIS e RLS por escola, piloto fictício, ciclo completo de
campo à publicação. Aberto: revisão das listas de itens conforme o uso real das escolas, e os itens
de terceira versão — API pública documentada, sensoriamento remoto comparativo e identificação
assistida de espécies.
