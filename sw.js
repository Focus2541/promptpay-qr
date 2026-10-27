/* QR พร้อมเพย์ — service worker
   เปลี่ยน VERSION ทุกครั้งที่อัปไฟล์ใหม่ขึ้น GitHub แอปจะขึ้นแถบ "มีเวอร์ชันใหม่" ให้กดอัปเดต */
var VERSION = '1.0.2';
var CACHE = 'promptpayqr-' + VERSION;
var FILES = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // cache: 'reload' = ข้าม HTTP cache ของ GitHub Pages ให้ได้ไฟล์ล่าสุดจริง
      return Promise.all(FILES.map(function (f) {
        return fetch(new Request(f, { cache: 'reload' })).then(function (r) {
          if (!r.ok) throw new Error(f + ' ' + r.status);
          return c.put(f, r);
        });
      }));
    })
  );
  // ไม่ skipWaiting เอง — รอผู้ใช้กด "อัปเดต" เพื่อไม่ให้หน้าจอเปลี่ยนกลางคันขณะโชว์ QR
});

self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf('promptpayqr-') === 0 && k !== CACHE;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// cache-first: ทุกอย่างอยู่ในเครื่อง ใช้ได้แม้ไม่มีเน็ต
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html', { ignoreSearch: true }).then(function (r) {
        return r || fetch(req);
      })
    );
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (r) {
      return r || fetch(req);
    })
  );
});
