import { useState } from 'react';
import Modal from './Modal';
export const timeNow = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
export default function IncidentForm({ incident, raceNumber, selected, camera, observations, onSave, onDelete, onClose }) {
  const editing = Boolean(incident);
  const [form, setForm] = useState(() => ({ corrida: incident?.corrida || raceNumber || 1, camera: incident?.camera || camera || '', curva: incident?.curva || selected || '', hora: incident?.hora || timeNow(), video: Boolean(incident?.video), report: Boolean(incident?.report), nfa: Boolean(incident?.nfa), priority: Boolean(incident?.priority), obs: incident?.obs || '' }));
  const [preset, setPreset] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value, ...(key === 'report' && value ? { nfa: false } : {}), ...(key === 'nfa' && value ? { report: false } : {}) }));
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await onSave({ ...form, corrida: Number(form.corrida), obs: [form.obs, preset].filter(Boolean).join(' - ') }, incident?._id); onClose(); }
    catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm('Eliminar este incidente?')) return;
    setBusy(true); setError('');
    try { await onDelete(incident._id); onClose(); } catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <Modal title={editing ? 'Editar incidente' : 'Novo incidente'} onClose={onClose} busy={busy}><form onSubmit={save}>
    <div className="form-grid">
      <label>Corrida<input type="number" min="1" required value={form.corrida} onChange={event => change('corrida', event.target.value)}/></label>
      <label>Hora<input required placeholder="HH:MM:SS" value={form.hora} onChange={event => change('hora', event.target.value)}/></label>
      <label>Camera<input value={form.camera} maxLength="100" onChange={event => change('camera', event.target.value)}/></label>
      <label>Curva / posto<input value={form.curva} required maxLength="100" onChange={event => change('curva', event.target.value)}/></label>
    </div>
    <fieldset className="checks"><legend>Estado do incidente</legend>{[['video','Vídeo'],['report','Report'],['nfa','N.F.A.'],['priority','Prioridade']].map(([key,label]) => <label key={key}><input type="checkbox" checked={form[key]} onChange={event => change(key,event.target.checked)}/>{label}</label>)}</fieldset>
    <label>Observações<textarea rows="4" maxLength="10000" value={form.obs} onChange={event => change('obs',event.target.value)}/></label>
    <label>Observação predefinida<select value={preset} onChange={event => setPreset(event.target.value)}><option value="">Selecionar…</option>{observations.map(item => <option key={item._id} value={item.descricao}>{item.descricao}</option>)}</select></label>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="actions">{editing && <button type="button" className="danger" disabled={busy} onClick={remove}>Eliminar</button>}<button type="button" className="secondary" disabled={busy} onClick={onClose}>Cancelar</button><button disabled={busy}>{busy ? 'A guardar…' : 'Guardar incidente'}</button></div>
  </form></Modal>;
}
