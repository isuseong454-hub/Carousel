/* 캐러셀 공장 — 서비스 워커
   ⚠️ 배포할 때마다 CACHE_NAME 숫자를 반드시 올릴 것.
   바이트가 똑같으면 브라우저가 «안 바뀐 걸로» 보고 옛 화면을 계속 띄운다. */
const CACHE_NAME = 'carousel-factory-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c=> c.addAll(ASSETS)).catch(()=>{}));
});

self.addEventListener('activate', e=>{
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=> k!==CACHE_NAME).map(k=> caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 화면 파일은 «새것 먼저» — 배포한 게 바로 보이게
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')){
    e.respondWith(
      fetch(req).then(r=>{
        const copy = r.clone();
        caches.open(CACHE_NAME).then(c=> c.put(req, copy));
        return r;
      }).catch(()=> caches.match(req).then(r=> r || caches.match('./index.html')))
    );
    return;
  }
  // 나머지는 «있으면 캐시 먼저»
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r=>{
      const copy = r.clone();
      caches.open(CACHE_NAME).then(c=> c.put(req, copy));
      return r;
    }))
  );
});
