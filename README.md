# Cápsula — mobile

Aplicativo mobile do Cápsula, construído com [Expo](https://expo.dev) (React Native + TypeScript)
e navegação por arquivos com [expo-router](https://docs.expo.dev/router/introduction/).

## Requisitos

- Node.js 20+
- App **Expo Go** instalado no celular (Android ou iOS)
- Celular e computador na **mesma rede Wi-Fi**

## Configuração

```bash
npm install
cp .env.example .env
```

Edite o `.env` e informe a URL da API:

```
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000
```

> Em dispositivo físico, `localhost` aponta para o próprio celular. Use o IP da
> sua máquina na rede local (`ipconfig` no Windows, `ifconfig` no macOS/Linux).

Apenas variáveis com o prefixo `EXPO_PUBLIC_` chegam ao bundle do app. Depois de
alterar o `.env`, reinicie o bundler com `npx expo start --clear`.

## Executando

```bash
npm start
```

Escaneie o QR code exibido no terminal com o app Expo Go (Android) ou com a
câmera (iOS). Se a rede bloquear a conexão direta, use o modo túnel:

```bash
npx expo start --tunnel
```

## Estrutura

```
app/                 rotas do expo-router
  _layout.tsx        Stack raiz e títulos das telas
  index.tsx          listagem de cápsulas
  nova.tsx           criação de cápsula
src/
  config/env.ts      leitura e validação das variáveis de ambiente
  services/http.ts   cliente HTTP (fetch) com a URL base da API
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o bundler do Expo |
| `npm run android` | Abre no emulador/dispositivo Android |
| `npm run ios` | Abre no simulador iOS (requer macOS) |
| `npm run web` | Abre no navegador |
| `npx tsc --noEmit` | Verifica os tipos |
