import { useState } from 'react';
export default function Numpad({ count, onSelect, disabled = false }) {
  const [type, setType] = useState('Turn');
  return <section className="numpad-panel" aria-labelledby="numpad-title"><div className="section-heading"><div><p className="eyebrow">REGISTO RÁPIDO</p><h2 id="numpad-title">Numpad</h2></div></div>
    <div className="numpad-types" role="group" aria-label="Tipo de ponto de pista">{[['Turn','Curva'],['Post','Posto'],['Camera','Camera']].map(([value,label]) => <button key={value} type="button" className={type===value?'active':'secondary'} aria-pressed={type===value} onClick={()=>setType(value)}>{label}</button>)}</div>
    {disabled ? <p className="empty" role="status">A carregar pontos…</p> : count ? <div className="numpad-grid">{Array.from({length:Math.min(count,500)},(_,index) => index+1).map(number => <button className="numpad-key" key={number} onClick={() => onSelect(type,number)}><span>{type === 'Turn' ? 'CURVA' : type === 'Post' ? 'POSTO' : 'CAMERA'}</span>{number}</button>)}</div> : <p className="empty">Configure o número de pontos em Configurações.</p>}
    <p className="hint">Atalhos: 1–9 para registar uma curva. P: Start · R: Red Flag · S: Slow Flag.</p></section>;
}
