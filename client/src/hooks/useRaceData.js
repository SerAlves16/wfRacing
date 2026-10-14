import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
// MongoDB is the source of truth. Refresh state without reloading pages or losing forms.
export default function useRaceData() {
  const [data, setData] = useState({ incidents: [], settings: [], observations: [], race: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async (signal) => {
    try {
      const [incidents, settings, observations, current] = await Promise.all([
        api('/incidents', { signal }), api('/settings', { signal }), api('/observations', { signal }),
        api('/races/current', { signal }).catch(error => { if (error.message === 'Nenhuma corrida encontrada') return {}; throw error; })
      ]);
      if (!signal?.aborted) { setData({ incidents, settings, observations, race: current.lastRaceText || '' }); setError(''); setLoading(false); }
    } catch (error) { if (!signal?.aborted) { setError(error.message); setLoading(false); } }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let timer;
    const poll = async () => {
      if (!document.hidden) await refresh(controller.signal);
      if (!controller.signal.aborted) timer = setTimeout(poll, 2000);
    };
    poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [refresh]);
  return { ...data, error, loading, refresh };
}
