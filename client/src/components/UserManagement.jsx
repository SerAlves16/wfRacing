import { useCallback, useEffect, useState } from 'react';
import Modal from './Modal';
import { api } from '../services/api';

const emptyForm = { username: '', password: '', usertype: 'user' };
const roleNames = { admin: 'Admin', operator: 'Operador', user: 'Utilizador' };
export default function UserManagement({ currentUser, onSelfChanged, onClose }) {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async signal => {
    const result = await api('/auth/users', { signal });
    if (!signal?.aborted) { setUsers(result); setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch(error => { if (!controller.signal.aborted) { setError(error.message); setLoading(false); } });
    return () => controller.abort();
  }, [load]);
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  function select(user) {
    setEditing(user); setForm({username:user.username,password:'',usertype:user.usertype}); setError(''); setNotice('');
  }
  function reset() { setEditing(null); setForm(emptyForm); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const body = { username: form.username, usertype: form.usertype, ...(!editing || form.password ? {password:form.password} : {}) };
    try {
      const user = await api(editing ? '/auth/edit/' + editing.id : '/auth/register', { method: editing ? 'PUT' : 'POST', body });
      if (user.id === currentUser.id) {
        onSelfChanged(user);
        if (user.passwordChanged) return;
      }
      await load(); setNotice(editing ? 'Utilizador atualizado.' : 'Utilizador criado.'); reset();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  async function remove(user) {
    if (!window.confirm(`Eliminar o utilizador «${user.username}»?`)) return;
    setBusy(true); setError(''); setNotice('');
    try { await api('/auth/delete/' + user.id, {method:'DELETE'}); await load(); if (editing?.id === user.id) reset(); setNotice('Utilizador eliminado.'); }
    catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <Modal title="Gestão de utilizadores" onClose={onClose} busy={busy}>
    <form onSubmit={save}><fieldset className="user-form" disabled={busy || loading}>
      <h3>{editing ? `Editar ${editing.username}` : 'Criar utilizador'}</h3>
      <div className="form-grid"><label>Nome de utilizador<input required maxLength="100" autoComplete="off" value={form.username} onChange={event=>change('username',event.target.value)}/></label>
        <label>Perfil<select value={form.usertype} disabled={editing?.id === currentUser.id} onChange={event=>change('usertype',event.target.value)}>{Object.entries(roleNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
      <label>{editing ? 'Nova password (opcional)' : 'Password'}<input type="password" minLength="8" maxLength="72" required={!editing} autoComplete="new-password" value={form.password} onChange={event=>change('password',event.target.value)}/></label>
      <p className="hint">{editing ? 'Deixe a password vazia para manter a atual. Alterá-la termina as sessões dessa conta.' : 'A password deve ter pelo menos 8 caracteres.'}</p>
      <div className="actions">{editing && <button type="button" className="secondary" onClick={reset}>Cancelar edição</button>}<button>{busy ? 'A guardar…' : editing ? 'Guardar utilizador' : 'Criar utilizador'}</button></div>
    </fieldset></form>
    {error && <p className="error" role="alert">{error}</p>}{notice && <p className="user-notice" role="status">{notice}</p>}
    {loading ? <p role="status">A carregar utilizadores…</p> : <div className="table-wrap user-table"><table><thead><tr><th scope="col">Utilizador</th><th scope="col">Perfil</th><th scope="col">Ações</th></tr></thead><tbody>{users.map(user=><tr key={user.id}><td>{user.username}{user.id === currentUser.id && <span className="badge">A sua conta</span>}</td><td>{roleNames[user.usertype] || user.usertype}</td><td className="row-actions"><button className="secondary small" disabled={busy} onClick={()=>select(user)} aria-label={'Editar utilizador '+user.username}>Editar</button><button className="plain small" disabled={busy || user.id === currentUser.id} onClick={()=>remove(user)} aria-label={'Eliminar utilizador '+user.username}>Eliminar</button></td></tr>)}</tbody></table></div>}
  </Modal>;
}
