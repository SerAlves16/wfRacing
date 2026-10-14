import { useState } from 'react';
import Modal from './Modal';
import { api } from '../services/api';
export default function Settings({ settings, race, observations, role, onRefresh, onClose }) {
  const canConfigure=['admin','operator'].includes(role);
  const current=settings.at(-1);
  const [buttons,setButtons]=useState(current?.numberButtons || 12); const [number,setNumber]=useState(current?.numberCorrida || 1);
  const [title,setTitle]=useState(race); const [option,setOption]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function perform(action) {setBusy(true);setError('');try {await action();await onRefresh();}catch(error){setError(error.message);}finally{setBusy(false);}}
  function saveSettings(event){event.preventDefault();perform(()=>api(current?'/settings/'+current._id:'/settings',{method:current?'PATCH':'POST',body:{numberButtons:Number(buttons),numberCorrida:Number(number)}}));}
  function saveTitle(event){event.preventDefault();perform(()=>api('/races',{method:'POST',body:{race:title}}));}
  function addOption(event){event.preventDefault();perform(async()=>{await api('/observations',{method:'POST',body:{descricao:option}});setOption('');});}
  return <Modal title="Configurações" onClose={onClose} busy={busy}>
    {canConfigure ? <><form onSubmit={saveSettings}><h3>Operação em pista</h3><div className="form-grid"><label>Número de pontos<input type="number" min="1" max="500" required value={buttons} onChange={event=>setButtons(event.target.value)}/></label><label>Corrida atual<input type="number" min="1" required value={number} onChange={event=>setNumber(event.target.value)}/></label></div><button disabled={busy}>Guardar numpad</button></form>
      <form onSubmit={saveTitle}><label>Nome do evento<input required maxLength="300" value={title} onChange={event=>setTitle(event.target.value)}/></label><button disabled={busy}>Guardar nome</button></form>
      <form onSubmit={addOption}><label>Nova observação predefinida<input required maxLength="1000" value={option} onChange={event=>setOption(event.target.value)}/></label><button disabled={busy}>Adicionar observação</button></form>
      <ul className="option-list">{observations.map(item=><li key={item._id}><span>{item.descricao}</span><button className="plain small" disabled={busy} aria-label={'Eliminar observação '+item.descricao} onClick={()=>{if(window.confirm('Eliminar esta observação?'))perform(()=>api('/observations/'+item._id,{method:'DELETE'}));}}>Eliminar</button></li>)}</ul>
      {role==='admin' && <div className="danger-zone"><h3>Limpar incidentes</h3><p>Esta ação elimina todos os incidentes guardados. Exporte os dados antes de continuar.</p><button className="danger" disabled={busy} onClick={()=>{if(window.confirm('Eliminar TODOS os incidentes? Esta ação não pode ser desfeita.'))perform(()=>api('/incidents',{method:'DELETE'}));}}>Eliminar todos os incidentes</button></div>}</> : <p>As configurações são geridas pelos administradores e operadores.</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </Modal>;
}
