import { useState } from 'react';
export default function Numpad({ count, onSelect }) {
  const [type, setType] = useState('Turn');
  return <section className="numpad-panel"><div className="section-heading"><div><p className="eyebrow">REGISTO RÁPIDO</p><h2>Pontos de pista</h2></div><label>Tipo<select value={type} onChange={event => setType(event.target.value)}><option value="Turn">Curva</option><option value="Post">Posto</option><option value="Camera">Camera</option></select></label></div>
    {count ? <div className="numpad-grid">{Array.from({length:Math.min(count,500)},(_,index) => index+1).map(number => <button className="numpad-key" key={number} onClick={() => onSelect(type,number)}><span>{type === 'Turn' ? 'CURVA' : type === 'Post' ? 'POSTO' : 'CAMERA'}</span>{number}</button>)}</div> : <p className="empty">Configure o número de pontos em Configurações.</p>}
    <p className="hint">Atalhos: 1–9 para registar uma curva. P: Start · R: Red Flag · S: Slow Flag.</p></section>;
}
