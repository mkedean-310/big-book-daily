const CACHE='bbd-v17';
const ASSETS=['./','index.html','styles.css','app.js','data.json','manifest.webmanifest','favicon.svg','icons/icon-master.svg','icons/icon-maskable.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  // network-first for data & html so updates arrive; fall back to cache offline
  const fresh=req.mode==='navigate'||url.pathname.endsWith('data.json')||url.pathname.endsWith('app.js')||url.pathname.endsWith('styles.css');
  if(fresh){
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'index.html':req,cp));return r;})
      .catch(()=>caches.match(req.mode==='navigate'?'index.html':req,{ignoreSearch:true}).then(r=>r||caches.match('./'))));
  } else {
    e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r||fetch(req).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));return res;})));
  }
});
