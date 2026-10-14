const SESSION_KEY = 'wfr.session.v1';
export function readSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
export function storeSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  for (const key of ['responseData', 'usertype', 'dadosTabela']) localStorage.removeItem(key);
}
export async function api(path, { method = 'GET', body, signal } = {}) {
  const session = readSession();
  const response = await fetch('/api' + path, { method, signal, headers: { ...(session?.token ? { Authorization: 'Bearer ' + session.token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (response.status === 401 && path !== '/auth/login') {
    storeSession(null);
    window.dispatchEvent(new Event('wfr:unauthorized'));
  }
  if (!response.ok) throw new Error(response.status === 403 ? 'Sem permissão para esta operação.' : data.message || data.error || 'Não foi possível concluir o pedido.');
  return data;
}
