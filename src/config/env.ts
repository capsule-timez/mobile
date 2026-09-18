/**
 * Variáveis de ambiente do app.
 *
 * Somente variáveis com o prefixo EXPO_PUBLIC_ chegam ao bundle do cliente, e
 * elas são substituídas em tempo de build — por isso o acesso precisa ser
 * literal (process.env.EXPO_PUBLIC_API_URL), nunca dinâmico.
 */
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL não definida. Copie .env.example para .env e informe a URL da API.'
  );
}

export const API_URL = apiUrl.replace(/\/+$/, '');
