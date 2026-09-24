// Studio Robson — service worker
// Bump VERSION bij elke deploy (zelfde nummer als APP_VERSION in index.html).
const VERSION = '2.1.0';
const CACHE   = 'studio-robson-v' + VERSION;

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './logo.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{})
  );
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message', e=>{
  if(e.data && e.data.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);

  // De app zelf: netwerk eerst, zodat een nieuwe versie meteen binnenkomt.
  const isShell = req.mode === 'navigate' ||
                  (url.origin === location.origin && url.pathname.endsWith('/index.html'));
  if(isShell){
    e.respondWith(
      fetch(req)
        .then(res=>{
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put('./index.html', copy)).catch(()=>{});
          return res;
        })
        .catch(()=>caches.match('./index.html').then(r=>r || caches.match('./')))
    );
    return;
  }

  // Google Fonts: uit cache serveren, op de achtergrond verversen.
  if(url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')){
    e.respondWith(
      caches.match(req).then(hit=>{
        const net = fetch(req).then(res=>{
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
          return res;
        }).catch(()=>hit);
        return hit || net;
      })
    );
    return;
  }

  // Eigen assets: cache eerst.
  if(url.origin === location.origin){
    e.respondWith(
      caches.match(req).then(hit=>hit || fetch(req).then(res=>{
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
        return res;
      }))
    );
  }
});
