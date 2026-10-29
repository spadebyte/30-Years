// 서비스 워커: 게임 파일을 저장해 두어 인터넷이 없어도 열리게 한다.
// 열 때마다 저장해 둔 파일을 먼저 보여 주고, 뒤에서 새 파일을 받아 다음번에 쓴다.
// 게임 파일을 바꾸면 VERSION을 올려서 예전 저장본을 지운다.
const VERSION = 'gunsu30-v1';
const FILES = [
  './', 'index.html', 'engine.js', 'gamedata.js', 'choices.js', 'art.js', 'tour.js', 'explain.html',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;  // 글꼴 같은 바깥 파일은 그냥 둔다
  e.respondWith(caches.open(VERSION).then(async cache => {
    const saved = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then(res => {
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    }).catch(() => saved);
    return saved || fresh;
  }));
});
