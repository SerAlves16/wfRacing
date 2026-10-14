// The legacy pages share one API client until the React conversion.
window.WFR_API_BASE = window.location.origin + '/';
(() => {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, options = {}) => {
    const target = new URL(typeof input === 'string' ? input : input.url, window.location.href);
    if (target.origin !== window.location.origin) return nativeFetch(input, options);
    let session;
    try { session = JSON.parse(localStorage.getItem('responseData') || 'null'); } catch { localStorage.removeItem('responseData'); }
    const headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
    if (session?.token) headers.set('Authorization', 'Bearer ' + session.token);
    return nativeFetch(input, { ...options, headers }).then(response => {
      if (response.status === 401 && target.pathname !== '/auth/login') {
        localStorage.removeItem('responseData');
        localStorage.removeItem('usertype');
        window.location.replace('/index.html');
      }
      if (response.status === 403) window.alert('Sem permissao para realizar esta operacao.');
      if (!response.ok) throw new Error('API request failed (' + response.status + ')');
      return response;
    });
  };
})();


