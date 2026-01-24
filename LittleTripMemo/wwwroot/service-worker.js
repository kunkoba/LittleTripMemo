
// キャッシュ名と保存するリソースのリストを定義
const CACHE_NAME = 'app-cache-'; // キャッシュ名の指定

const urlsToCache = [
    '/',
    '/RouteMemo/CreateRouteMemo',
    '/service-worker.js',
    '/favicon.ico',
    '/loading.gif',
    '/manifest.json',
    '/css/appMain.css',
    '/css/bootstrap-icons.css',
    '/css/bootstrap.min.css',
    '/css/leaflet.css',
    '/css/images/layers-2x.png',
    '/css/images/layers.png',
    '/css/images/marker-icon-2x.png',
    '/css/images/marker-icon.png',
    '/css/images/marker-shadow.png',
    '/icons/flag.png',
    '/img/dizzy.png',
    '/img/face-angry-horns.png',
    '/img/face-anxious-sweat.png',
    '/img/face-confounded.png',
    '/img/face-disappointed.png',
    '/img/face-downcast-sweat.png',
    '/img/face-drooling.png',
    '/img/face-expressionless.png',
    '/img/flag.png',
    '/img/flushed.png',
    '/img/grin-alt.png',
    '/img/grin-hearts.png',
    '/img/laugh-squint.png',
    '/img/sad-tear.png',
    '/img/tired.png',
    '/img/plan/bed.png',
    '/img/plan/bike.png',
    '/img/plan/bus.png',
    '/img/plan/car.png',
    '/img/plan/plane.png',
    '/img/plan/tools-kitchen-2.png',
    '/img/plan/train.png',
    '/img/plan/walk.png',
    '/js/bootstrap.bundle.min.js',
    '/js/jquery-3.7.1.slim.min.js',
    '/js/leaflet-arrowheads.js',
    '/js/leaflet.geometryutil.js',
    '/js/leaflet.js',
    '/js/site.js',
    '/js/myApp/app-common.js',
    '/js/myApp/app-context.js',
    '/js/myApp/app-data.js',
    '/js/myApp/app-dialog.js',
    '/js/myApp/app-form.js',
    '/js/myApp/app-indexedDB.js',
    '/js/myApp/app-map.js',
    '/js/myApp/app-useLocalDB.js'
];


// Service Workerのインストールイベント
// 指定したリソースをキャッシュに保存する
self.addEventListener('install', event => {
    CACHE_NAME += AppContext.app_version;   // アプリバージョンに追従する
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('キャッシュをインストール中'); // デバッグ用メッセージ
            return cache.addAll(urlsToCache); // キャッシュにリストを追加
        })
    );
});

// タイルキャッシュ容量の上限を設定
const TILE_CACHE_NAME = 'tile-cache';
const TILE_CACHE_LIMIT = 1000; // タイルキャッシュの上限枚数

// キャッシュ容量を管理する関数
async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        await cache.delete(keys[0]); // 最古のキャッシュを削除（FIFO方式）
        console.log(`キャッシュサイズが${maxItems}を超えたため古いキャッシュを削除しました`);
    }
}

// リクエストに応じてキャッシュまたはネットワークからデータを取得
self.addEventListener('fetch', event => {
    // フラグがオフならば、処理をスキップ
    if (!USE_FLG) return; // リソースを返さず、何もしない
    const requestURL = event.request.url;
    if (requestURL.includes('tile.openstreetmap.org')) {
        // タイルデータのリクエストに対応
        event.respondWith(
            caches.open(TILE_CACHE_NAME).then(cache => {
                return cache.match(event.request).then(response => {
                    if (response) {
                        // キャッシュにタイルが存在する場合
                        return response;
                    }
                    // ネットワークから取得し、キャッシュに保存
                    return fetch(event.request).then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        // キャッシュ容量制限を適用
                        limitCacheSize(TILE_CACHE_NAME, TILE_CACHE_LIMIT);
                        return networkResponse;
                    });
                });
            })
        );
    } else {
        // 通常のキャッシュ戦略
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request).catch(() => {
                    // オフライン時はオフラインページを返す
                    // return caches.match('/offline.html');
                    return caches.match('/');
                });
            })
        );
    }
});

// サービスワーカーのアクティベートイベント
// 古いキャッシュを削除してキャッシュを最新状態に維持
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME, TILE_CACHE_NAME]; // 現在使用しているキャッシュ名のリスト
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('古いキャッシュを削除:', cacheName); // 古いキャッシュの削除
                        return caches.delete(cacheName); // 古いキャッシュを削除
                    }
                })
            );
        })
    );
});


