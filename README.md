# Cápsula — mobile

Aplicativo React Native (Expo SDK 57, Expo Router, TypeScript) do Cápsula do
Tempo: o usuário cria cápsulas com uma mensagem e uma data de entrega, e a API
envia o conteúdo por e-mail quando o momento chega.

## Funcionalidades

- Cadastro, login e restauração de sessão (token JWT guardado no SecureStore).
- **Minhas cápsulas:** listagem paginada da API, contadores por status
  (agendadas, enviadas, com falha), filtro por status, puxar para atualizar,
  estados de carregamento, vazio e erro.
- **Nova cápsula:** formulário em três passos (mensagem, data de entrega com
  atalhos, destinatário — o próprio usuário ou outra pessoa), com validação
  local e exibição dos erros devolvidos pela API.
- Navegação por duas abas (listar / criar) e rotas protegidas pela sessão.

Fora do escopo por enquanto: detalhe, edição e exclusão de cápsulas, anexos
(a API já tem endpoints de arquivos) e refresh de token.

## Pré-requisitos

- Node.js 20 ou superior e npm.
- A API do repositório [`backend/`](../backend) rodando, com PostgreSQL. Veja
  o README dele; o resumo está abaixo.
- Um destes para abrir o app: celular com o app **Expo Go**, emulador
  Android (Android Studio), simulador iOS (somente macOS) ou navegador.

## Como rodar

### 1. Subir a API

Em outro terminal, a partir de `backend/`:

```powershell
Copy-Item .env.example .env
docker volume create capsula-api_postgres_data
docker volume create capsula-api_minio_data
docker compose up -d
npm install
npm run db:generate
npm run db:deploy
npm run dev
```

Os dois `docker volume create` só são necessários na primeira vez. A API sobe
em `http://localhost:3000`; confira com `curl http://localhost:3000/health`.
O envio dos e-mails só funciona com `RESEND_API_KEY` preenchida no `.env` do
backend, mas cadastro, login e criação/listagem de cápsulas funcionam sem ela.

### 2. Configurar e iniciar o app

A partir de `mobile/`:

```powershell
npm ci
Copy-Item .env.example .env
npm start
```

Edite o `.env` e defina `EXPO_PUBLIC_API_URL` com a **origem da API, sem
`/api`**. O valor depende de onde o app roda:

| Onde o app roda | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| Celular físico (Expo Go) | `http://<IP-do-computador>:3000` — mesma rede Wi-Fi |
| Emulador Android | `http://10.0.2.2:3000` |
| Simulador iOS / navegador | `http://localhost:3000` |

Para descobrir o IP do computador no Windows, use `ipconfig` (endereço IPv4 do
adaptador Wi-Fi). Se o celular não alcançar a API, libere a porta 3000 no
firewall do Windows. Se celular e computador estiverem em redes diferentes,
`npx expo start --tunnel` expõe o Metro por ngrok, mas **não** a API — ela
continua precisando ser alcançável pelo celular.

A variável é embutida no bundle em tempo de build: **reinicie o Expo** (de
preferência com `npx expo start -c`) depois de alterar o `.env`. Sem ela o app
falha ao iniciar com a mensagem `EXPO_PUBLIC_API_URL não definida`. Em
produção, use HTTPS.

Com o Metro aberto no terminal:

- escaneie o QR code com o Expo Go (Android) ou a câmera (iOS);
- ou pressione `a` (Android), `i` (iOS) ou `w` (web).

Atalhos equivalentes: `npm run android`, `npm run ios`, `npm run web`.

## Scripts

| Script | Descrição |
| --- | --- |
| `npm start` | Inicia o Metro/Expo |
| `npm run android` / `ios` / `web` | Inicia e abre na plataforma indicada |
| `npm run typecheck` | Verifica a tipagem (`tsc --noEmit`) |
| `npm test` | Roda os testes (`tsx --test tests/*.test.ts`) |

## Autenticação

- Cadastro: `POST /api/auth/register`, com nome, e-mail e senha.
- Login: `POST /api/auth/login`, com e-mail e senha.
- Resposta dos dois endpoints: `{ token, user: { id, name, email, createdAt } }`.
- Restauração: `GET /api/auth/me`, com `Authorization: Bearer <token>`;
  a resposta é `{ id, name, email, createdAt }`.
- O token é salvo exclusivamente por `expo-secure-store` em Android/iOS.
  Senhas e dados do formulário não são persistidos. O acesso às telas internas
  só é liberado depois de salvar o token com sucesso.
- Ao reabrir, o app valida o token antes de liberar a navegação. Erro de rede
  mantém o token salvo e apresenta uma opção para tentar novamente.
- Resposta 401 remove o token e volta ao login. O app não usa refresh token:
  depois do prazo configurado em `JWT_EXPIRES_IN` no backend (padrão 1h), é
  necessário entrar novamente.
- Sair remove o token do dispositivo. O backend atual não revoga JWTs emitidos.
- **Web:** usa somente memória; recarregar/fechar a página encerra a sessão.
  Não há fallback para localStorage ou AsyncStorage.
- Os formulários usam área segura, rolagem, KeyboardAvoidingView e redimensionamento
  de janela no Android; o teclado permite avançar entre campos.

## Cápsulas

- Listagem: `GET /api/capsules?page=&pageSize=`. O app percorre as páginas
  (100 por página, até 20) e filtra/ordena localmente.
- Criação: `POST /api/capsules` com `title`, `text`, `recipientEmail` e
  `scheduleDate` (ISO 8601 em UTC). A data deve estar no futuro.
- Detalhe: tocar em um card da lista abre `app/(app)/capsula/[id].tsx`, que
  consulta `GET /api/capsules/:id` e mostra título, status, data de entrega,
  destinatário, mensagem e anexos (imagens pela `downloadUrl` temporária; tocar
  abre o arquivo). Há skeleton no carregamento, "Cápsula não encontrada" para 404
  (id inexistente ou de outra conta) e "Tentar novamente" quando a API falha.
- O contrato completo está em `backend/docs/api/openapi.yaml`.

## Estrutura

```text
app/_layout.tsx                restauração da sessão, fontes e proteção das rotas
app/login.tsx, cadastro.tsx    telas públicas
app/(app)/_layout.tsx          abas das telas autenticadas
app/(app)/index.tsx            minhas cápsulas (GET /api/capsules)
app/(app)/nova.tsx             criação de cápsula (POST /api/capsules)
app/(app)/capsula/[id].tsx     detalhe da cápsula (GET /api/capsules/:id)
src/config/env.ts              leitura de EXPO_PUBLIC_API_URL
src/theme/tokens.ts            tokens de design (cores, bordas, sombras, fontes)
src/components/                kit de UI espelhando o da web (Button, FormField,
                               Card, Toast, Hero, CapsuleCard…) e AuthForm
src/auth/                      sessão, validação e SecureStore
src/services/                  cliente HTTP, autenticação e cápsulas
src/types/                     tipos da API
src/utils/                     datas em pt-BR, validação e ordenação (puros, testáveis)
tests/                         testes de sessão, HTTP, cápsulas e utilitários
```

## Interface

A UI segue o design da web (`frontend/`): visual neo-brutalista com bordas
grossas, sombras duras, paleta de papel/laranja/amarelo e as fontes Archivo
Black e Space Grotesk. O React Native não tem `box-shadow` sem desfoque, então
as sombras são uma camada sólida deslocada (`ShadowBox`). Ao mudar um
componente da web, replique a mudança no componente de mesmo nome em
`src/components/`.

O seletor de data usa os diálogos nativos no Android, a roda de seleção no iOS
e um campo de texto (`AAAA-MM-DD HH:mm`) no navegador.

## Verificar

```bash
npm run typecheck
npm test
npx expo export --platform android --platform ios --platform web
```

Os testes do mobile usam armazenamento e rede simulados. O export verifica os
bundles, mas não substitui a execução em dispositivo.

### Roteiro em Android/iOS com a API e PostgreSQL

1. Abra o app sem sessão: deve exibir login.
2. Cadastre uma conta; deve abrir Minhas cápsulas. Repita o e-mail e confira o erro de duplicidade.
3. Saia e entre com a conta criada. Senha incorreta deve mostrar erro.
4. Encerre o processo do app e reabra: deve recuperar a sessão sem pedir senha.
5. Encerre, desligue a rede e reabra: deve oferecer nova tentativa sem perder o token.
6. Reconecte e tente novamente: deve recuperar a sessão.
7. Saia, encerre e reabra: deve continuar na tela de login.
8. Com token expirado, reabra: deve voltar ao login.
9. Em tela pequena, abra o teclado em cada campo, especialmente confirmar senha,
   e confira a rolagem e o botão de envio.
10. Confirme que não há token nos logs, arquivos de configuração ou armazenamento
    comum do app. A persistência nativa deve ocorrer somente via SecureStore.
11. Em Nova cápsula, tente enviar vazio e com data no passado: os erros devem
    aparecer nos campos. Crie uma cápsula para você e outra para outro e-mail;
    depois de lacrar, o app volta à lista e a cápsula aparece como agendada.
12. Na lista, teste o filtro por status, puxar para atualizar e, com a API
    parada, o estado de erro com "Tentar novamente".
13. Toque em uma cápsula: o detalhe mostra os dados e as imagens anexadas. Com a
    API parada, deve aparecer o erro com "Tentar novamente"; com um id
    inexistente, "Cápsula não encontrada".

14. Mantenha uma cápsula agendada pressionada: deve abrir a confirmação de
    exclusão. Cancele e confira que ela permanece. Confirme: deve sumir da lista,
    atualizar os contadores e mostrar o toast de sucesso, sem recarregar a lista.
    Puxe para atualizar e confira que ela não retorna.
15. Mantenha cápsulas enviadas e com falha pressionadas: não devem oferecer
    exclusão. Com a API parada, tente excluir uma agendada: deve permanecer na
    lista e o toast deve mostrar o erro. Se a cápsula for enviada enquanto a
    confirmação estiver aberta, o conflito da API também deve aparecer no toast.

Referência: [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/).
