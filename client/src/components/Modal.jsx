import { useEffect, useRef } from 'react';
// Native dialog provides keyboard focus containment and Escape handling.
export default function Modal({ title, onClose, children, busy = false }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="modal-heading"><h2 id="modal-title">{title}</h2><button type="button" className="plain" aria-label="Fechar" disabled={busy} onClick={onClose}>×</button></div>{children}
  </dialog>;
}
