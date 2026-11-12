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

## 5. Contato da escola e mural *(segunda entrega)*

### Contato e números

Na ficha da escola, seção **Contato e números**: responsável e função,
e-mail, telefone (com a marca "tem WhatsApp"), Instagram, site, Facebook,
YouTube e o número de participantes atendidos. Aparece na aba **Sobre** da
página pública. Tudo opcional; campo vazio não aparece.

- É dado público, visto por qualquer visitante. A ficha pede o contato
  institucional em vez do pessoal.
- Os endereços viram link na página, por isso o banco só aceita `http://` e
  `https://`. Um "site" escrito `javascript:` é recusado — testado.
- O Instagram guarda só o nome de usuário; o link é montado na tela.
- Os ícones de rede social são genéricos: a biblioteca de ícones não traz
  logotipo de marca, e logotipo alheio não entra em repositório público.

### Mural

Quem responde pela escola escreve um texto com até 6 fotos ou vídeos curtos.
A publicação aparece na aba **Atividades** da página da escola e na
**Linha do tempo** da rede, misturada às saídas de campo pela data.

- O campo de escrever aparece na própria página da escola, só para quem tem
  vínculo com ela (o banco decide). Tirar do ar, publicar de novo e apagar
  ficam na ficha da escola, seção **Mural**.
- Publica na hora: escrever e apertar Publicar é a decisão, registrada com o
  nome de quem publicou. Texto e mídia entram e saem do ar juntos, numa função
  do banco.
- A mídia segue as regras de toda imagem: sem termo de uso de imagem, a
  publicação aparece só com o texto; o pedido de remoção vale para cada foto e
  cada vídeo e tira o arquivo do ar na hora; republicar não traz de volta
  mídia com pedido em aberto.
- O texto é exibido como texto puro, nunca como HTML.

**Limites, escolhidos sem fonte externa:** 2.000 caracteres, 6 arquivos,
vídeo de até 60 segundos e 50 MB (o teto de arquivo do plano gratuito do
Supabase). Fotos são reduzidas antes do envio; vídeos sobem como estão.

**Verificado no banco** com professor, conta sem vínculo e visitante: 17 de 17
casos (contato, URL maliciosa, rascunho, publicação, retirada, vídeo,
remoção, termo de imagem).

**Não verificado aqui:** envio real de vídeo do celular ao Storage (sem login
neste ambiente) e a reprodução de `.mov` gravado em iPhone no Chrome do
Windows, que depende do codec. MP4 é o formato que toca em toda parte.

## 6. Ficha da escola, coordenação e balão do pino *(terceira entrega)*

**Funcionamento** (ficha → aba Sobre e balão do pino): data de fundação e,
para escola de surf, dias de aula (seg a dom) e horário. Na escola regular,
dias de aula não aparecem: seriam sempre "segunda a sexta".

**Coordenação** (ficha → aba Sobre): uma ou mais pessoas, cada uma com foto
redonda, nome, função, e-mail, telefone (com WhatsApp) e Instagram. Ordem
ajustável. Cada pessoa só aparece com a marca **"esta pessoa autorizou"**,
que vem desmarcada: é dado pessoal de adulto, e a escola declara que
perguntou. Sem a marca, nem a foto sai do Storage. Foto de coordenador não
depende do termo de uso de imagem dos alunos, que é outra coisa.

O "Responsável" da entrega anterior foi copiado para a coordenação, já
autorizado (foi a própria escola que o publicou). As colunas antigas ficam
no banco sem uso na tela.

**Balão do pino**: no mapa da rede, passar o mouse no pino de uma escola abre
um resumo (capa, tipo, município, desde quando, dias e horário, atendidos,
saídas de campo) com o botão para a página. No celular, o primeiro toque
abre o balão e o segundo leva à página. No mapa da própria escola, o botão do
balão abre a aba Sobre.

**Atividades embaixo do mapa**: na aba Território, as três atividades mais
recentes (saídas e mural), com link para a lista inteira em Atividades.

**Página Sobre**: nova seção "Também nas escolas de surf", com o programa
Guardiões Ecosurf como ambiente de projetos de educação para a Cultura
Oceânica entre escolas de surf, e o papel "Instrutor de escola de surf".

**Verificado no banco**: 12 de 12 casos (migração do responsável, dias
inválidos recusados, foto de outra escola recusada, pessoa sem autorização
invisível e com foto bloqueada, conta sem vínculo recusada, visitante sem
acesso à tabela).
