import { useCallback, useEffect, useState } from 'react';
import { api, readSession, storeSession } from './services/api';
import useRaceData from './hooks/useRaceData';
import Login from './components/Login';
import IncidentTable from './components/IncidentTable';
import IncidentForm from './components/IncidentForm';
import Numpad from './components/Numpad';
import Settings from './components/Settings';
import { exportExcel } from './services/exportExcel';
function RaceControl({ session, onLogout }) {
  const { incidents, settings, observations, race, error, loading, refresh } = useRaceData();
  const [query,setQuery]=useState(''); const [field,setField]=useState('curva'); const [raceFilter,setRaceFilter]=useState('');
  const [view,setView]=useState(session.usertype==='user'?'numpad':'table'); const [modal,setModal]=useState(null);
  const [notice,setNotice]=useState(''); const [busy,setBusy]=useState(false); const [clock,setClock]=useState(new Date());
  const canConfigure=['admin','operator'].includes(session.usertype);
  const current=settings.at(-1); const raceNumber=current?.numberCorrida || 1;
  const openNew=useCallback(selected=>setModal({type:'incident',selected}),[]);
  useEffect(()=>{const timer=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    const keydown=event=>{
      if(modal || event.ctrlKey || event.altKey || event.metaKey || event.target.closest('input,textarea,select,button'))return;
      if(/^[1-9]$/.test(event.key) && Number(event.key)<=(current?.numberButtons || 0)){event.preventDefault();openNew('Turn '+event.key);}
      else if(canConfigure && ['p','r','s'].includes(event.key.toLowerCase())){event.preventDefault();openNew({p:'Start',r:'Red Flag',s:'Slow Flag'}[event.key.toLowerCase()]);}
    };
    window.addEventListener('keydown',keydown);return()=>window.removeEventListener('keydown',keydown);
  },[modal,current?.numberButtons,canConfigure,openNew]);
  const filtered=incidents.filter(item=>(!raceFilter || String(item.corrida)===raceFilter) && String(item[field] || '').toLowerCase().includes(query.toLowerCase()));
  const races=[...new Set(incidents.map(item=>item.corrida))].sort((a,b)=>a-b);
  async function save(body,id){
    if(!id && body.curva==='Start'){
      const previous=incidents.filter(item=>item.corrida===body.corrida && ['Start','Red Flag'].includes(item.curva)).at(-1);
      if(previous?.curva==='Start')throw new Error('Esta corrida já foi iniciada. Registe Red Flag antes de reiniciar.');
    }
    await api(id?'/incidents/'+id:'/incidents',{method:id?'PATCH':'POST',body});await refresh();
  }
  async function remove(id){await api('/incidents/'+id,{method:'DELETE'});await refresh();}
  async function move(item,adjacent){setBusy(true);setNotice('');try{await api('/incidents/reorder',{method:'POST',body:{id:item._id,adjacentId:adjacent._id}});await refresh();}catch(error){setNotice(error.message);}finally{setBusy(false);}}
  async function exportData(){setBusy(true);setNotice('');try{await exportExcel(filtered,race);}catch(error){setNotice(error.message);}finally{setBusy(false);}}
  return <><header className="app-header"><a href="/" aria-label="WFR RaceTech"><img src="/images/unnamed.png" alt="WFR RaceTech"/></a><div className="event-title"><p className="eyebrow">RACE CONTROL · CORRIDA {raceNumber}</p><h1>{race || 'WFR RaceTech'}</h1></div><div className="session"><strong>{session.username}</strong><span>{session.usertype} · {clock.toLocaleTimeString('en-GB')}</span><button className="plain" onClick={onLogout}>Sair</button></div></header>
    <main className="dashboard"><section className="toolbar"><div className="view-switch"><button className={view==='table'?'active':'secondary'} onClick={()=>setView('table')}>Incidentes <span>{incidents.length}</span></button><button className={view==='numpad'?'active':'secondary'} onClick={()=>setView('numpad')}>Numpad</button></div><div className="actions"><button className="secondary" disabled={busy} onClick={exportData}>Exportar Excel</button>{canConfigure && <button className="secondary" onClick={()=>setModal({type:'settings'})}>Configurações</button>}<button onClick={()=>openNew('')}>+ Novo incidente</button></div></section>
      <section className="filters"><label>Pesquisar<input placeholder="Pesquisar incidentes…" value={query} onChange={event=>setQuery(event.target.value)}/></label><label>Pesquisar em<select value={field} onChange={event=>setField(event.target.value)}><option value="curva">Curva / posto</option><option value="hora">Hora</option><option value="obs">Observações</option><option value="camera">Camera</option></select></label><label>Corrida<select value={raceFilter} onChange={event=>setRaceFilter(event.target.value)}><option value="">Todas as corridas</option>{races.map(number=><option key={number} value={number}>Race {number}</option>)}</select></label><span className="result-count">{filtered.length} incidentes</span></section>
      {(error || notice) && <p role="alert" className="error">{error || notice}</p>}
      {loading ? <p role="status" className="empty">A carregar dados…</p> : view==='table' ? <IncidentTable incidents={filtered} onEdit={incident=>setModal({type:'incident',incident})} onMove={move} busy={busy}/> : <Numpad count={current?.numberButtons || 0} onSelect={(type,number)=>setModal({type:'incident',selected:type+' '+number,camera:type==='Camera'?String(number):''})}/>}
      {canConfigure && <section className="flag-actions"><span>Controlo da corrida</span><button className="start" onClick={()=>openNew('Start')}>Start <kbd>P</kbd></button><button className="red" onClick={()=>openNew('Red Flag')}>Red Flag <kbd>R</kbd></button><button className="slow" onClick={()=>openNew('Slow Flag')}>Slow Flag <kbd>S</kbd></button></section>}
      <footer>WFR RaceTech · {clock.toLocaleDateString('pt-PT')} · Atualização automática a cada 2 segundos</footer>
    </main>
    {modal?.type==='incident' && <IncidentForm key={modal.incident?._id || modal.selected || 'new'} incident={modal.incident} selected={modal.selected} camera={modal.camera} raceNumber={raceNumber} observations={observations} onSave={save} onDelete={remove} onClose={()=>setModal(null)}/>}
    {modal?.type==='settings' && <Settings settings={settings} observations={observations} race={race} role={session.usertype} onRefresh={refresh} onClose={()=>setModal(null)}/>}</>;
}
export default function App(){
  const [session,setSession]=useState(readSession);const [checking,setChecking]=useState(Boolean(readSession()));
  const logout=useCallback(()=>{storeSession(null);setSession(null);},[]);
  useEffect(()=>{
    window.addEventListener('wfr:unauthorized',logout);
    const storage=event=>{if(event.key==='wfr.session.v1')setSession(readSession());};window.addEventListener('storage',storage);
    return()=>{window.removeEventListener('wfr:unauthorized',logout);window.removeEventListener('storage',storage);};
  },[logout]);
  useEffect(()=>{
    const controller=new AbortController();
    if(!session?.token){setChecking(false);return;}
    api('/auth/protected',{signal:controller.signal}).then(({user})=>{
      if(controller.signal.aborted)return;
      const current={...session,...user};storeSession(current);setSession(current);setChecking(false);
    }).catch(()=>{if(!controller.signal.aborted){logout();setChecking(false);}});
    return()=>controller.abort();
  },[session?.token,logout]);
  if(checking)return <main className="login-page"><p role="status">A verificar sessão…</p></main>;
  return session?<RaceControl session={session} onLogout={logout}/>:<Login onLogin={data=>{storeSession(data);setSession(data);}}/>;
}
