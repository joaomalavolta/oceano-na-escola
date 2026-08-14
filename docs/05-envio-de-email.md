# Envio de e-mail

*(14/08/2026)*

A plataforma manda um e-mail só: o **convite** para entrar, de
`oceanonaescola@ecosurf.org.br`. Tudo o mais que chega por e-mail — confirmação de cadastro,
recuperação de senha — vem do Supabase Auth e é configurado no painel dele, não aqui.

## Onde o envio acontece

No servidor, em `app/api/convite/route.ts`. Precisa ser lá porque a credencial do remetente não
pode chegar ao navegador de ninguém.

**A rota não decide quem pode convidar.** Ela chama `admin_cria_convite` com o token de quem
pediu, e é o banco que confere o papel — a mesma função, a mesma regra, o mesmo lugar de sempre.
A rota só acrescenta o envio. Consequência prática: **a chave `service_role` continua não
existindo em lugar nenhum do projeto**, nem no servidor.

Ordem dos acontecimentos, e ela importa: **o convite é criado primeiro, o e-mail depois**. Se o
e-mail falhar, o convite já existe e o link volta na resposta para o Ecosurf mandar à mão. E-mail
que não sai nunca pode custar o convite.

## Dois caminhos, escolhidos pelas variáveis

`lib/email.ts` olha o ambiente e decide. Se nada estiver configurado, o convite é criado do mesmo
jeito e a tela explica que o link tem de ir à mão — é situação prevista, não defeito.

### Caminho A — SMTP da caixa que já existe

O mais curto se `oceanonaescola@ecosurf.org.br` **já é uma caixa de verdade** (Google Workspace,
Zoho, cPanel). Não mexe em DNS: a entregabilidade é a que o domínio já tem.

| Variável | Para que serve |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com`, `smtp.zoho.com`, o do provedor da caixa |
| `SMTP_PORT` | `587` (padrão) ou `465` |
| `SMTP_USER` | `oceanonaescola@ecosurf.org.br` |
| `SMTP_PASS` | a senha da caixa — no Google Workspace, uma **senha de app**, não a senha da conta |
| `SMTP_FROM` | opcional; só se o remetente tiver de ser diferente do usuário |

Sobre a porta: `465` é TLS desde o primeiro byte, `587` abre em claro e sobe com STARTTLS. Errar
qual é dá "connection timeout" sem dizer por quê — é dos erros mais caros de diagnosticar aqui, e
por isso o código deriva o modo da porta em vez de ter uma variável a mais para errar.

### Caminho B — Resend

Serviço transacional. Exige verificar `ecosurf.org.br` por SPF e DKIM, e em troca dá relatório de
entrega e não depende de senha de caixa.

| Variável | Para que serve |
|---|---|
| `RESEND_API_KEY` | a chave da conta |
| `RESEND_FROM` | opcional; o padrão é `oceanonaescola@ecosurf.org.br` |

O SMTP tem precedência: com os dois configurados, vale o SMTP.

## Onde preencher

Na Vercel, em **Settings → Environment Variables**, para Production e Preview.

**Nenhuma delas leva o prefixo `NEXT_PUBLIC_`.** O prefixo publica a variável no JavaScript que
vai ao navegador, e aí a senha da caixa de e-mail do Ecosurf estaria legível para qualquer
visitante do site. Estas são de servidor e assim devem ficar.

Marque `SMTP_PASS` e `RESEND_API_KEY` como **Sensitive** — são segredos de verdade, ao contrário
das variáveis `NEXT_PUBLIC_*` do Supabase, que são públicas por natureza e não devem ser marcadas
assim.

## O texto do convite

Está em `lib/email-convite.ts`, com versão em HTML e em texto puro — cliente de e-mail
corporativo desarma botão com frequência, e aí o endereço em texto é o único caminho que sobra.

Quem recebe esse e-mail **não pediu nada**: chega um link de remetente desconhecido pedindo para
criar uma senha, que é a forma exata de um golpe. O que separa um do outro é o texto dizer quem
manda, para quê, para qual endereço vale e até quando — e não pedir nada além de abrir o link.
Nunca pede senha, nunca pede dado, nunca tem urgência. Há testes em
`lib/email-convite.test.ts` que seguram cada uma dessas promessas, para que uma reescrita futura
não apague sem querer o que torna o e-mail confiável.

O recado que o Ecosurf escreve no painel entra dentro do HTML e é escapado (`escaparHtml`): sem
isso, um apóstrofo já bastaria para quebrar o e-mail.

## O que foi verificado

Contra um servidor SMTP falso, em memória: o remetente sai como
`oceanonaescola@ecosurf.org.br`, o envelope leva o destinatário certo, o corpo vai em
`multipart/alternative` com as duas versões, o link aparece inteiro e o `&` do recado chega
escapado.

E as duas falhas previstas, nenhuma delas lançando exceção: sem configuração nenhuma, devolve o
motivo escrito para a tela; com servidor inexistente, devolve o erro cru — `ENOTFOUND` e
`Invalid login` dizem coisas diferentes a quem vai arrumar, e escondê-los atrás de "falha no
envio" faria alguém abrir um chamado para descobrir o que já estava escrito.
