// キャッシュのバージョン（アップデート時はこの数値を変更する）
const CACHE_VERSION = 'v0.0.4';
// キャッシュ名の定義
const CACHE_KEYS = {
    STATIC: `static-cache-${CACHE_VERSION}`,   // 変更がないもの用（Cache First）
    DYNAMIC: `dynamic-cache-${CACHE_VERSION}`  // 頻繁に変わるもの用（Network First）
};
// キャッシュ優先（Cache First）にする外部ドメイン群
const STATIC_DOMAINS = [
    'cdn.tailwindcss.com',
    'unpkg.com',
    'www.gstatic.com', // Firebase
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.simpleicons.org'
];
// キャッシュ優先（Cache First）にする拡張子
const STATIC_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
// キャッシュから除外するもの（API通信など）
const isApiRequest = (url) => {
    return url.includes('/api/') || url.includes('ngrok-free.app') || url.includes('localhost:5000');
};
// 静的リソース（Cache First対象）の判定
const isStaticRequest = (urlStr) => {
    const url = new URL(urlStr);
    // 地図タイル等の重いリソースはキャッシュしない（ブラウザ任せ）
    if (url.hostname.includes('tile.openstreetmap') || url.hostname.includes('arcgisonline.com')) return false;
    // ドメイン判定
    if (STATIC_DOMAINS.some(domain => url.hostname.includes(domain))) return true;
    // 拡張子判定
    if (STATIC_EXTENSIONS.some(ext => url.pathname.toLowerCase().endsWith(ext))) return true;
    return false;
};
// 1. インストール処理
self.addEventListener('install', (event) => {
    // console.log("★SW >> install");
    // 待機状態をスキップし、即座に新しいSWをインストールする（確実なバージョンアップのため）
    self.skipWaiting();
});
// 2. アクティベート処理
self.addEventListener('activate', (event) => {
    // console.log("★SW >> activate");
    // すべてのクライアント（開いているタブ）の制御を即座に奪う
    event.waitUntil(self.clients.claim());
    // バージョンが異なる古いキャッシュを全て物理削除する
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    const expectedKeys = Object.values(CACHE_KEYS);
                    if (!expectedKeys.includes(cacheName)) {
                        console.log(`[SW] 古いキャッシュを削除しました: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
// 3. リクエストの横取り（Fetchイベント）
self.addEventListener('fetch', (event) => {
    // console.log("★SW >> fetch");
    const req = event.request;
    const url = new URL(req.url);
    // GETメソッド以外（POST等）や、API通信はSWで干渉せずそのまま流す
    if (req.method !== 'GET' || isApiRequest(req.url)) {
        return;
    }
    // 【戦略B：Cache First】（外部CDNや画像など変更がないもの）
    if (isStaticRequest(req.url)) {
        event.respondWith(
            caches.match(req).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse; // キャッシュがあれば即返す
                // 無ければネットワークへ取りに行き、キャッシュに保存して返す
                return fetch(req).then((networkResponse) => {
                    return caches.open(CACHE_KEYS.STATIC).then((cache) => {
                        cache.put(req, networkResponse.clone());
                        return networkResponse;
                    });
                }).catch(() => { /* 失敗時は何もしない */ });
            })
        );
        return;
    }
    // 【戦略A：Network First】（index.html、自作JS・CSSなど変更されるもの）
    event.respondWith(
        fetch(req).then((networkResponse) => {
            // ネットワーク通信成功：最新版をキャッシュに上書きして返す
            return caches.open(CACHE_KEYS.DYNAMIC).then((cache) => {
                cache.put(req, networkResponse.clone());
                return networkResponse;
            });
        }).catch(() => {
            // ネットワーク通信失敗（オフライン時）：キャッシュから返す
            return caches.match(req);
        })
    );
});
