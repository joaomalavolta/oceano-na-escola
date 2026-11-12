# A saída de campo: abrir, registrar, encerrar *(12/11/2026)*

## O problema que motivou

Uma escola abriu a saída, foi levada direto à ficha de papel e clicou no botão em destaque,
"Salvar e enviar para revisão", achando que guardava a saída. Em seguida, na revisão, marcou
"revisada" e "validada". Em 45 segundos a saída estava validada, sem nenhum registro, e o
registro em campo — que só aceita saída em rascunho — dizia "nenhuma expedição aberta".

O banco permitia isso porque a conferência de "tem dado" olhava só se existia unidade amostral,
e salvar a ficha cria uma unidade por equipe, preenchida ou não. Pela mesma brecha, uma saída
vazia podia até ser publicada.

## Como ficou

**A página da saída** (`/expedicoes/<id>`) é para onde se vai depois de abrir a saída. A ordem é a
da vida real:

1. **Registrar em campo** — no celular, durante a saída (ação em destaque);
2. **Transcrever a ficha de papel** — depois;
3. **Diário e fotos**;
4. **Terminei a saída: enviar para revisão** — com confirmação, que diz que enviar encerra o
   registro em campo.

Com a saída já enviada, a página diz em que etapa ela está e oferece **reabrir** (volta a
rascunho, desfaz a validação, refaz as etapas).

**A ficha de papel** não tem mais o envio como botão em destaque: "Terminei a saída: enviar" pede
confirmação.

**O banco recusa saída vazia** ao avançar para "enviado" e para "publicado" (função
`expedicao_tem_dado`). Conta como dado: uma ocorrência, uma contagem, ou um trecho com área medida —
este último cobre a turma que percorreu o trecho e não achou nada, que é zero medido e é dado.
Voltar continua livre.

**O registro em campo** abre já com a saída escolhida quando chega pela página dela
(`/campo?expedicao=<id>`). Sem saída aberta, lista as saídas dos últimos 30 dias que foram
enviadas mas não publicadas, com **Reabrir para registrar**. Publicadas ficam de fora: reabrir uma
delas tira o dado do mapa, e isso se decide na revisão, com o aviso do custo.

**Pinos com foto no mapa** — na revisão, uma caixa junta as quatro condições para o pino aparecer
com foto: saída publicada, foto publicada (curadoria), escola com termo de uso de imagem e escola
publicada. Mostra quantas ocorrências estão com foto publicada, aguardando curadoria ou sem foto, e
o que bloqueia. Ao publicar a saída, dá para **publicar as fotos junto**, marcando a declaração de
que foram conferidas (sem rosto identificável de estudante, nome ou uniforme com nome). Desmarcado
de início: é ato de curadoria, e quem publica fica em `curada_por`. Foto com pedido de remoção fica
de fora. Com a saída já publicada, o mesmo botão aparece na caixa.

**Autoria** — `expedicao.criado_por` passa a ser preenchido pelo banco (`default auth.uid()`). As
saídas anteriores continuam sem autor: não há de onde recuperar.

**Foto no celular** — dois botões, "Tirar foto" (câmera) e "Da galeria". Com um botão só, o
Android abria só a câmera.
