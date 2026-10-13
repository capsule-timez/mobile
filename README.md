# Cápsula — mobile

Aplicativo React Native com Expo e Expo Router.

## Executar

```powershell
npm ci
Copy-Item .env.example .env
npm start
```

Em `.env`, configure `EXPO_PUBLIC_API_URL` com a **origem da API, sem /api**,
por exemplo `http://192.168.0.10:3000`. No celular, use o IP do computador
na mesma rede; no emulador Android, use `http://10.0.2.2:3000`.
Reinicie o Expo após mudar a variável. Em produção, use HTTPS.

O backend deve incluir o endpoint de cadastro da branch `codex/auth-register`
do repositório backend. Execute suas migrações e inicie a API conforme o README dele.

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
- Resposta 401 remove o token e volta ao login. A API atual não oferece refresh:
  depois do prazo configurado em `JWT_EXPIRES_IN` (padrão 1h), é necessário entrar novamente.
- Sair remove o token do dispositivo. O backend atual não revoga JWTs emitidos.
- **Web:** usa somente memória; recarregar/fechar a página encerra a sessão.
  Não há fallback para localStorage ou AsyncStorage.
- Os formulários usam área segura, rolagem, KeyboardAvoidingView e redimensionamento
  de janela no Android; o teclado permite avançar entre campos.

## Estrutura

```text
app/login.tsx, cadastro.tsx     telas públicas
app/_layout.tsx                restauração e proteção das rotas
app/index.tsx                  listagem de cápsulas (GET /api/capsules)
app/nova.tsx                   criação de cápsula (POST /api/capsules)
src/theme/tokens.ts            tokens de design (cores, bordas, sombras, fontes)
src/components/                kit de UI espelhando o da web (Button, FormField,
                               Card, Toast, Hero, CapsuleCard…) e AuthForm
src/auth/                      sessão, validação e SecureStore
src/services/                  cliente HTTP, autenticação e cápsulas
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
2. Cadastre uma conta; deve abrir Cápsulas. Repita o e-mail e confira o erro de duplicidade.
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

Referência: [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/).
