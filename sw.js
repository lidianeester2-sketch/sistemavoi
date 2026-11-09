// Sistema VOI — service worker (o que faz o VOI virar aplicativo no celular)
// Sempre busca a versão mais nova na internet; só usa a cópia guardada se estiver sem internet.
// Não guarda dados do banco (Supabase): processos e logins nunca ficam salvos no aparelho.
const CACHE = 'voi-v1';
const BASICO = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASICO)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;  // Supabase e afins: direto, sem cópia
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      if (r.ok && new URL(req.url).pathname === '/') { const cp = r.clone(); caches.open(CACHE).then(c => c.put('/', cp)); }
      return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('/'))));
    return;
  }
  if (BASICO.includes(new URL(req.url).pathname)) e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
