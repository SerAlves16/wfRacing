import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
// Replace the old worker and remove cached legacy pages. API data is never cached.
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.getRegistrations().then(async registrations => {
  for (const registration of registrations) if (registration.active?.scriptURL.includes('/pwa/service-worker.js')) await registration.unregister();
  await caches.delete('pwa-cache');
  await navigator.serviceWorker.register('/service-worker.js');
}).catch(console.error);
