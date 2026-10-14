import { useCallback, useEffect, useRef, useState } from 'react';
import { api, readSession, storeSession } from './services/api';
import useRaceData from './hooks/useRaceData';
import Login from './components/Login';
import IncidentTable from './components/IncidentTable';
import IncidentForm, { timeNow } from './components/IncidentForm';
import Numpad from './components/Numpad';
import Settings from './components/Settings';
import UserManagement from './components/UserManagement';
import { exportExcel } from './services/exportExcel';
function RaceControl({ session, onLogout, onSessionChanged }) {
  const { incidents, settings, observations, race, raceSessions, error, loading, refresh } = useRaceData();
  const [query,setQuery]=useState(''); const [field,setField]=useState('curva'); const [raceFilter,setRaceFilter]=useState('');
  const [modal,setModal]=useState(null);
  const [notice,setNotice]=useState(''); const [busy,setBusy]=useState(false); const [clock,setClock]=useState(new Date());
  const canConfigure=['admin','operator'].includes(session.usertype);
  const current=settings.at(-1); const raceNumber=current?.numberCorrida || 1;
  // Reordering table rows must not change which race event actually happened last.
  const lastRaceEvent = incidents.filter(item => item.corrida === raceNumber && ['Start','Red Flag'].includes(item.curva))
    .sort((a,b) => String(a._id).localeCompare(String(b._id))).at(-1);
  const canStartRace = lastRaceEvent?.curva !== 'Start';
  const startBlockReason = 'Corrida em curso. Registe uma Red Flag antes de dar novo Start.';
  const openNew=useCallback(selected=>setModal({type:'incident',selected}),[]);
  const starting = useRef(false);
  const creatingRace = useRef(false);
  async function newRace() {
    if (creatingRace.current || busy || loading) return;
    if (!window.confirm('Criar uma nova corrida? Os registos das corridas anteriores serão mantidos. O Start será dado separadamente.')) return;
    creatingRace.current = true; setBusy(true); setNotice('');
    try {
      const created = await api('/races/new', { method: 'POST', body: { currentRace: raceNumber } });
      setRaceFilter(String(created.number)); setQuery('');
      await refresh();
    } catch (error) { setNotice(error.message); await refresh(); }
    finally { creatingRace.current = false; setBusy(false); }
  }
  // Button and keyboard share a single immediate POST; the ref blocks repeated keys/clicks.
  const startRace = useCallback(async () => {
    if (starting.current || busy || loading || !canConfigure) return;
    if (!canStartRace) { setNotice(startBlockReason); return; }
    starting.current = true;
    setBusy(true); setNotice('');
    try {
      await api('/incidents', { method: 'POST', body: {
        corrida: raceNumber, camera: '', curva: 'Start', hora: timeNow(),
        video: false, report: false, nfa: null, priority: false, obs: `Race Nº:${raceNumber}`
      } });
      await refresh();
    } catch (error) { setNotice(error.message); }
    finally { starting.current = false; setBusy(false); }
  }, [busy, loading, canConfigure, canStartRace, raceNumber, refresh]);
  useEffect(()=>{const timer=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    const keydown=event=>{
      if(modal || event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
      if(/^[1-9]$/.test(event.key) && Number(event.key)<=(current?.numberButtons || 0)){event.preventDefault();openNew('Turn '+event.key);}
      else if(canConfigure && event.key.toLowerCase()==='p'){event.preventDefault();startRace();}
      else if(canConfigure && ['r','s'].includes(event.key.toLowerCase())){event.preventDefault();openNew({r:'Red Flag',s:'Slow Flag'}[event.key.toLowerCase()]);}
    };
    window.addEventListener('keydown',keydown);return()=>window.removeEventListener('keydown',keydown);
  },[modal,current?.numberButtons,canConfigure,openNew,startRace]);
  const filtered=incidents.filter(item=>(!raceFilter || String(item.corrida)===raceFilter) && String(item[field] || '').toLowerCase().includes(query.toLowerCase()));
  const races=[...new Set([raceNumber, ...raceSessions.map(item=>item.number), ...incidents.map(item=>item.corrida)])].sort((a,b)=>a-b);
  async function save(body,id){
    // The API validates starts and edits against current database history, including other users.
    await api(id?'/incidents/'+id:'/incidents',{method:id?'PATCH':'POST',body});await refresh();
  }
  async function remove(id){await api('/incidents/'+id,{method:'DELETE'});await refresh();}
  async function move(item,adjacent){setBusy(true);setNotice('');try{await api('/incidents/reorder',{method:'POST',body:{id:item._id,adjacentId:adjacent._id}});await refresh();}catch(error){setNotice(error.message);}finally{setBusy(false);}}
  async function exportData(){setBusy(true);setNotice('');try{await exportExcel(filtered,race);}catch(error){setNotice(/dynamically imported module|Importing a module script failed|Loading chunk/i.test(error.message) ? 'A aplicação foi atualizada. Atualize a página e volte a exportar para Excel.' : 'Não foi possível exportar para Excel: '+error.message);}finally{setBusy(false);}}
  return <><header className="app-header"><a href="/" aria-label="WFR RaceTech"><img src="/images/unnamed.png" alt="WFR RaceTech"/></a><div className="event-title"><p className="eyebrow">RACE CONTROL · CORRIDA {raceNumber}</p><h1>{race || 'WFR RaceTech'}</h1></div><div className="session"><strong>{session.username}</strong><span>{session.usertype} · {clock.toLocaleTimeString('en-GB')}</span><button className="plain" onClick={onLogout}>Sair</button></div></header>
    <main className="dashboard"><section className="toolbar"><h2 className="incidents-heading">Incidentes <span className="badge">{incidents.length}</span></h2><div className="actions"><button className="secondary" disabled={busy} onClick={exportData}>Exportar Excel</button>{session.usertype==='admin' && <button className="secondary" onClick={()=>setModal({type:'users'})}>Utilizadores</button>}{canConfigure && <button className="secondary" onClick={()=>setModal({type:'settings'})}>Configurações</button>}<button onClick={()=>openNew('')}>+ Novo incidente</button></div></section>
      <div className="race-workspace">
      <section className="incident-panel" aria-label="Lista de incidentes">
      <section className="filters"><label>Pesquisar<input placeholder="Pesquisar incidentes…" value={query} onChange={event=>setQuery(event.target.value)}/></label><label>Pesquisar em<select value={field} onChange={event=>setField(event.target.value)}><option value="curva">Curva / posto</option><option value="hora">Hora</option><option value="obs">Observações</option><option value="camera">Camera</option></select></label><label>Corrida<select value={raceFilter} onChange={event=>setRaceFilter(event.target.value)}><option value="">Todas as corridas</option>{races.map(number=><option key={number} value={number}>Race {number}</option>)}</select></label><span className="result-count">{filtered.length} incidentes</span></section>
      {(error || notice) && <p role="alert" className="error">{error || notice}</p>}
      {loading ? <p role="status" className="empty">A carregar dados…</p> : <IncidentTable incidents={filtered} onEdit={incident=>setModal({type:'incident',incident})} onMove={move} busy={busy}/>}
      </section>
      <aside className="quick-entry" aria-label="Registo rápido de incidentes">
      <Numpad count={current?.numberButtons || 0} disabled={loading} onSelect={(type,number)=>setModal({type:'incident',selected:type+' '+number,camera:type==='Camera'?String(number):''})}/>
      {canConfigure && <section className="flag-actions"><span>Controlo da corrida</span><button className="new-race secondary" disabled={busy || loading} onClick={newRace}>+ Nova corrida</button><button className="start" disabled={busy || loading || !canStartRace} title={canStartRace ? 'Registar início da corrida' : startBlockReason} onClick={startRace}>Start <kbd>P</kbd></button><button className="red" onClick={()=>openNew('Red Flag')}>Red Flag <kbd>R</kbd></button><button className="slow" onClick={()=>openNew('Slow Flag')}>Slow Flag <kbd>S</kbd></button><p className="race-state" role="status">{loading ? 'A verificar estado da corrida…' : !canStartRace ? startBlockReason : lastRaceEvent?.curva === 'Red Flag' ? 'Red Flag registada. Novo Start disponível.' : 'Primeiro Start disponível.'}</p></section>}
      </aside>
      </div>
      <footer>WFR RaceTech · {clock.toLocaleDateString('pt-PT')} · Atualização automática a cada 2 segundos</footer>
    </main>
    {modal?.type==='incident' && <IncidentForm key={modal.incident?._id || modal.selected || 'new'} incident={modal.incident} selected={modal.selected} camera={modal.camera} raceNumber={raceNumber} observations={observations} onSave={save} onDelete={remove} onClose={()=>setModal(null)}/>}
    {modal?.type==='settings' && <Settings settings={settings} observations={observations} race={race} role={session.usertype} onRefresh={refresh} onClose={()=>setModal(null)}/>}
    {modal?.type==='users' && session.usertype==='admin' && <UserManagement currentUser={session} onSelfChanged={user=>{if(user.passwordChanged)onLogout();else onSessionChanged({...session,username:user.username,usertype:user.usertype});}} onClose={()=>setModal(null)}/>}</>;
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
  const sessionChanged = data => { storeSession(data); setSession(data); };
  return session?<RaceControl session={session} onLogout={logout} onSessionChanged={sessionChanged}/>:<Login onLogin={sessionChanged}/>;
}
