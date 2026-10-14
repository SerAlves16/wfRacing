import { useState } from 'react';
import { api } from '../services/api';
export default function Login({ onLogin }) {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { onLogin(await api('/auth/login', { method: 'POST', body: { username, password } })); }
    catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <main className="login-page"><form className="login-card" onSubmit={submit}>
    <img src="/images/unnamed.png" alt="WFR RaceTech"/><p className="eyebrow">RACE CONTROL</p><h1>Entrar no RaceTech</h1><p>Registo e acompanhamento de incidentes em pista.</p>
    <label>Utilizador<input autoComplete="username" required value={username} onChange={event => setUsername(event.target.value)}/></label>
    <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)}/></label>
    {error && <p role="alert" className="error">{error}</p>}<button disabled={busy}>{busy ? 'A entrar…' : 'Entrar'}</button>
  </form></main>;
}
