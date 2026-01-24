// グローバル変数
let _map;
let _MainMarker; // 現在地を示すマーカー
let _PointList = [];    // ルートマーカー地点データ
let _CurrentIndex = 0;     // 選択している地点（０：直近
let _RouteArrowList = []; // すべてのルート矢印を保持
let renderCircle;
let circleRadius;    // マーカー用サークルの半径
let markerOffset = null; // マップ中心とマーカーの差分
// グローバル定数
const _mapOffset = [0, -150];   // 位置情報のずれ調整
const _popupOffset = [0, -150] // 
const _ArrowSettings = {
    color: "blue",   // 矢印の色（デフォルト赤）
    weight: 1,          // 線の太さ
    size: '10px',        // 矢印のサイズ
    frequency: '50px',  // 矢印の頻度（200m、200px、2[均等]）
    fill: true,         // 塗りつぶし
    yawn: 30,            // 矢印の幅
};


// 【現在地】現在位置の取得（position.coords.latitude, position.coords.longitude）
async function getLocation(move = true) {
    waitingDisplay(true); // 処理開始時に待機画面表示
    try {
        if (navigator.geolocation) {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        let pos = position.coords;
                        // メインマーカー生成（OR 移動）
                        createMainMarker(pos.latitude, pos.longitude, move);
                        // 
                        resolve(position.coords); // 成功時に位置情報を返す
                    },
                    (error) => {
                        displayToastWaning("位置情報の取得に失敗しました");
                        reject(null); // エラー時はNULLを返す
                    }
                , {
                    enableHighAccuracy: true,  // リスクが大きい
                    timeout: 5000,  // ms
                    maximumAge: 0   // 
                });
            });
        } else {
            displayToastWaning("位置情報がサポートされていません");
            return null;
        }
    } finally {
        waitingDisplay(false); // 処理終了時に待機画面解除
    }
}



let watchId = null; // 監視IDを管理
// 【現在地】位置情報の監視を開始
function startTrackingLocation(move = true) {
    if (!watchId && navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                let pos = position.coords;
                createMainMarker(pos.latitude, pos.longitude, move); // メインマーカーの更新
            },
            (error) => {
                displayToastWaning("位置情報の取得に失敗しました");
            },
            {
                enableHighAccuracy: true,  // 高精度測位
                timeout: 5000,  // ms
                maximumAge: 0   // 最新情報を取得
            }
        );
        console.log("位置情報の監視を開始しました");
        displayToast("位置情報の監視を開始しました");
    }
}
// 【現在地】監視を一時的に中断（測位は保持）
function pauseTrackingLocation() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null; // IDをクリア
        console.log("位置情報の監視を一時中断しました");
    }
}
// // 【現在地】監視を完全に停止（測位データも破棄）
// function stopTrackingLocation() {
//     if (watchId) {
//         navigator.geolocation.clearWatch(watchId);
//         watchId = null;
//         console.log("位置情報の監視を終了しました（完全停止）");
//     }
// }








// メインマーカーを作成（ドラッグ不可）
async function createMainMarker(lat, lng, move) {
    if (!lat) {
        lat = _map.getCenter().lat;
        lng = _map.getCenter().lng;
    }
    let targetLatLng = [lat, lng];
    // 既存の _MainMarker が存在する場合は位置を更新
    if (_MainMarker) {
        _MainMarker.setLatLng(targetLatLng); // マーカーの位置を更新
    } else {
        // 新しくマーカーを作成
        _MainMarker = L.marker(targetLatLng, { draggable: false }).addTo(_map);
    }
    // オプションで地図を移動
    if (move) {
        _map.setView(targetLatLng, _map.getZoom(), { animate: true, duration: 1 });
    }
}

// mapの初期化（マーカ１つ、移動可能）
async function initMap(lat, lng, zoom = 18) {
    if (!lat) {
        lat = 35;
        lng = 135;
    }
    if (!_map) {
        // console.log("initMap: ", lat, lng, zoom);
        await new Promise((resolve) => {
            // マップを初期化して、指定された緯度と経度に中心を設定
            _map = L.map('mapArea', {
                zoomControl: false,
                doubleClickZoom: true // ダブルクリックズーム
            }).setView([lat, lng], zoom);
            resolve();  // 完了通知
        });
        _map.on('zoom', () => {
            setTimeout(() => {
                // console.log("ズーム後の処理を遅延実行: 現在のズームレベル", _map.getZoom());
            }, 100); // 100ms遅延
        });
        // ズーム変更時にサークルの半径を更新
        _map.on('zoomend', function() {
            resetCircle();
        });
        // // 縮尺コントロールを追加
        // L.control.scale({
        //     position: 'bottomleft', // 表示位置
        //     metric: true,             // メートル表示
        //     imperial: true            // マイル非表示
        // }).addTo(_map);
        // リサイズイベントリスナーを追加
        window.addEventListener('resize', async function() {
            if(_map){
                if(AppStatus.isOnLine){
                    await delay(100); // 100msの遅延
                    const currentCenter = _map.getCenter();
                    _map.invalidateSize();  // タイル再読み込み
                    _map.setView(currentCenter);
                }
            }
        });
    }
    // タイルレイヤーを追加（オンラインの場合のみ）
    if (AppStatus.isOnLine) {
        await new Promise((resolve) => {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(_map);
            // L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            // attribution: '&copy; OpenStreetMap contributors & CartoDB'
            // }).addTo(_map);
            resolve();  // 完了通知
        });
    }
}

// ルートマーカーをすべてクリア
function clearRouteMarker() {
    if (!_PointList || _PointList.length == 0) return;
    return new Promise((resolve, reject) => {
        try {
            // console.log("■clearRouteMarker");
            if (_PointList) {
                _PointList.forEach(point => {
                    const marker = point.marker;
                    if (!marker) return;
                    // ポップアップのイベントと解除を徹底
                    const popup = marker.getPopup();
                    if (popup) {
                        popup.off(); // ポップアップのイベントを解除
                        popup.remove(); // ポップアップ自体を削除
                    }
                    marker.unbindPopup();
                    // マーカーのイベント解除
                    marker.off();
                    marker.remove(); // マーカー自体を削除
                    _map.removeLayer(marker); // マップから削除
                });
                // 配列を完全にクリア
                _PointList.length = 0;
            }
            if (_RouteArrowList) {
                _RouteArrowList.forEach(arrow => arrow.remove()); // 各マーカーを削除
                _RouteArrowList = []; // 配列を空にして管理をリセット
            }
            if (renderCircle) {
                _map.removeLayer(renderCircle); // 地図から円を削除
                renderCircle = null; // 参照をクリア
            }
            // console.log("■clearRouteMarker: 完了");
            resolve(); // 処理が正常終了した場合
        } catch (error) {
            errorProc("clearRouteMarker" ,error);
            reject(error); // エラーが発生した場合
        }
    });
}



// マーカーの差分を計算する
function updateMarkerOffset() {
    const center = _map.getCenter();
    if (!_MainMarker) return;
    const markerLatLng = _MainMarker.getLatLng();
    markerOffset = {
        lat: markerLatLng.lat - center.lat,
        lng: markerLatLng.lng - center.lng
    };
}
// マップ移動時にマーカーを更新
function updateMarkerPositionOnMapMove() {
    // if (!markerOffset) return; // 差分が未設定の場合はスキップ
    const center = _map.getCenter();
    const adjustedLatLng = {
        // lat: center.lat + markerOffset.lat,
        // lng: center.lng + markerOffset.lng
        lat: center.lat,
        lng: center.lng,
    };
    _MainMarker.setLatLng(adjustedLatLng);
}


// イベント追加（メインマーカー追従）
function addEventToMapMove() {
    if (_map && _MainMarker) {
        _map.on('move', updateMarkerPositionOnMapMove); // マップ移動時
        _MainMarker.on('dragend', updateMarkerOffset);    // マーカー移動完了時
    }
}
// イベント削除（メインマーカー追従）
function removeEventToMapMove() {
    if (_map && _MainMarker) {
        _map.off('move', updateMarkerPositionOnMapMove); // マップ移動時
    }
}


// 地図を指定したマーカーに合わせる
async function moveMapToMarker(marker, zoom = null){
    if(marker){
        // 地図の中心に
        await moveMapTo(marker.getLatLng().lat, marker.getLatLng().lng, zoom, 1);
    }
}
// 地図をメインマーカーに合わせる
async function moveMapToMainMarker(zoom = null){
    if (_MainMarker) await moveMapToMarker(_MainMarker, zoom);
}
// // 地図を現在のマーカーに合わせる
// async function moveMapToCurrentMarker(zoom = null){
//     let point = _PointList[_CurrentIndex];
//     let marker = point.marker;
//     if (marker) await moveMapToMarker(marker, zoom);
// }
// // ２点間の距離を比較（極めて近い値なら同じ位置と判定する）
// function isCenterLocation(lat, lng) {
//     const center = _map.getCenter(); // マップの中心座標を取得
//     const centerLat = center.lat;
//     const centerLng = center.lng;
//     // 誤差の範囲
//     const threshold = 0.0001; // 約 11m の誤差
//     // 計算
//     const latDiff = Math.abs(lat - centerLat);
//     const lngDiff = Math.abs(lng - centerLng);
//     // 判定結果
//     return latDiff <= threshold && lngDiff <= threshold;
// }



// ズームを設定する
function setZoom(zoom){
    if (_map) {
        _map.setZoom(zoom)
    }
}



// マップデータからルートを作成する（矢印付き）
function createRoute(mapData) {
    // console.log("createRoute >> start");
    return new Promise((resolve) => {
        try {
            if (!mapData || mapData.length == 0) {
                resolve(true);
            }
            // マーカークリア
            clearRouteMarker();
            // グローバル変数初期化
            _PointList = mapData;
            _CurrentIndex = 0;
            // マーカーの作成、ルート線の作成
            createAnyMarkerWithArrow(_PointList);
            // mapのズームレベルを変更する（矢印を再描画）
            _map.setZoom(_map.getZoom());
            // 成功した場合
            // console.log("createRoute >> end", _PointList);
            resolve(true);
        } catch (error) {
            // エラーが発生した場合
            errorProc("createRoute", error);
            resolve(true);
        }
    });
}

// 現在のマーカ位置
function changeCurrentIndex(targetValue = 0){
    let result = targetValue;
    const min = 0;
    const max = _PointList.length - 1;
    if((result >= min && result <= max)){
        _CurrentIndex = result;
    }else if(result < min){
        // 最小値（スタート）
        _CurrentIndex = min;
    }else if(result > max){
        // 最大値（スタート）
        _CurrentIndex = max;
    }
    // console.log("_CurrentIndex: ", _CurrentIndex);
}
// 配列データから、ルートマーカーと矢印を作成する
function createAnyMarkerWithArrow(_PointList) {
    // console.log("createAnyMarkerWithArrow: ", _PointList);
    let previousPoint = null;
    // 位置情報を取得してマーカーを作成
    for (let i = 0; i < _PointList.length; i++) {
        createMarker(i);
        // 矢印描画
        if (previousPoint) {
            // 現在のポイントから前のポイントまで線を引く
            drawLineWithArrow({ lat: _PointList[i].latitude, lng: _PointList[i].longitude }, previousPoint);
        }
        // 前のポイントを保持
        previousPoint = { lat: _PointList[i].latitude, lng: _PointList[i].longitude };
    }
}





// マップデータからマーカーを作成する（矢印なし、検索用）
function createPointMarker(mapData) {
    // マーカークリア
    clearRouteMarker();
    // マーカー生成
    _PointList = mapData;
    for (let i = 0; i < _PointList.length; i++) {
		createMarker(i, true);
    }
}
// マーカーを作成する
async function createMarker(indexValue, isSearch = false) {
    try {
        const pointData = _PointList[indexValue];
        const image = getImgDataByFaceId(pointData.faceId);
        if(!image) {
            console.log("image nothing!! >> ", pointData.faceId);
            return;
        }
        let iconSize = 24;
        const customIcon = L.icon({
            iconUrl: image.imgUrl, // アイコンの画像のURL
            iconSize: [iconSize, iconSize], // アイコンのサイズ [幅, 高さ]
            iconAnchor: [iconSize/2, iconSize/2], // アイコンのアンカー [x, y]
            popupAnchor: _popupOffset, // ポップアップのアンカー [x, y]
        });
        // マーカーの作成とカスタムアイコンの設定
        const routeMarker = L.marker([pointData.latitude, pointData.longitude], {
            icon: customIcon ,
            draggable: true,
            zIndexOffset: 600    // マーカーを前面に表示
        }).addTo(_map);
        // カスタムデータの設定
        routeMarker.customData = {
            index: indexValue
        };
        // ポップアップ生成
        routeMarker.bindPopup(
            createPopupHtml(pointData, isSearch)
        ).addTo(_map);
        // ポップアップイベント
        routeMarker.off('popupopen').on('popupopen', async function(event) {
            // イベント設定
            if (AppStatus.isPublish) {
                // ローカルDBからデータ取得
                let data = await getDataByArchiveSeq(pointData.archiveId, pointData.seq);
                // console.log("getDataByArchiveSeq >>", data, pointData);
                if (data) {
                    pointData.val_Good = data.good;
                    pointData.val_Bad = data.bad;
                    // pointData.val_Alert = data.alert;
                }
                // イベント登録
                if (!pointData.isOwnData) {
                    // console.log("isOwnData");
                    addEventReActionIcon(DEF_ICO_GOOD,  pointData);
                    addEventReActionIcon(DEF_ICO_BAD,   pointData);
                    // addEventReActionIcon(DEF_ICO_ALERT, pointData);
                }
                // いいねアイコン反映
                renderReActionIconAll(pointData);
            }
        });
        // マーカーのクリックイベント
        routeMarker.off('click').on('click', function() {
            // ポップアップが開いている場合はイベントをスキップ
            if (routeMarker.isPopupOpen()) return;
            _CurrentIndex = routeMarker.customData.index;
            moveMarkerToCurrent();
        });
        const archiveIdSeq = `${pointData.archiveId}-${pointData.seq}`;
        // 通報ボタン
        $(document).off('click', `#alertBtn-${archiveIdSeq}`)
                .on('click', `#alertBtn-${archiveIdSeq}`, function (event) {
            event.stopPropagation(); // イベントが親要素に伝播しないようにする
            if (AppStatus.isAnonymous) {
                ShowWelcomeScreen();
            } else {
                // フィードバック画面表示
                openDialogFeedback(true, pointData);
            }
        });
        // 編集ボタン
        $(document).off('click', `#editBtn-${archiveIdSeq}`)
            .on('click', `#editBtn-${archiveIdSeq}`, function (event) {
            event.stopPropagation(); // イベントが親要素に伝播しないようにする
            // 入力画面を表示
            openInputForm(false);
        });
        // ドアップボタン
        $(document).off('click', `#zoopMax-${archiveIdSeq}`)
            .on('click', `#zoopMax-${archiveIdSeq}`, function (event) {
            event.stopPropagation(); // イベントが親要素に伝播しないようにする
            // 画面遷移
            moveMarkerToCurrent(18);
        });
        // googleMapボタン
        $(document).off('click', `#gotoGoogleMap-${archiveIdSeq}`)
            .on('click', `#gotoGoogleMap-${archiveIdSeq}`, async function (event) {
            event.stopPropagation(); // イベントが親要素に伝播しないようにする
            let ret = await openDialogOKCancel("googleマップで表示しますか？");
            if (!ret) return;
            // 画面遷移
            jumpGoogleMap();
        });
        // まとめへのリンク
        $(document).off('click', `#archiveLinkBtn-${archiveIdSeq}`)
            .on('click', `#archiveLinkBtn-${archiveIdSeq}`, async function() {
            let ret = await openDialogOKCancel("まとめ参照画面で表示しますか？");
            if (!ret) return;
            AppStatus.archiveId = pointData.archiveId;
            AppStatus.seq = pointData.seq;
            // 画面遷移
            initArchiveMemo();
        });
        // サイズアップ
        $(document).off('click', `#sizeUpBtn-${archiveIdSeq}`)
            .on('click', `#sizeUpBtn-${archiveIdSeq}`, async function() {
            // popupHeight += 50; // ボタンクリックごとに高さを増やす
            document.querySelector(".card").style.height = `300px`;
        });
        // まとめから除外ボタン
        $(document).off('click', `#removeBtn-${archiveIdSeq}`)
            .on('click', `#removeBtn-${archiveIdSeq}`, async function () {
            // オフラインチェック
            if (!OfflineCheck()) return false;
            // 処理前確認
            let ret = await openDialogOKCancel("このメモだけ まとめから除外しますか？");
            if (!ret) return;
            // サーバ更新
            await RemoveFromArchive(pointData.archiveId, pointData.seq);
            $(this).closest('.modal').modal('hide');
            // まとめ画面へ遷移
            initArchiveMemo();
        });
        // まとめから削除ボタン
        $(document).off('click', `#deleteBtn-${archiveIdSeq}`)
            .on('click', `#deleteBtn-${archiveIdSeq}`, async function () {
            // オフラインチェック
            if (!OfflineCheck()) return false;
            // 処理前確認
            let ret = await openDialogOKCancel("このメモだけ 削除しますか？<br>（元には戻せません）");
            if (!ret) return;
            // サーバ更新
            await DeleteMemoPublish(pointData.archiveId, pointData.seq);
            $(this).closest('.modal').modal('hide');
            initArchiveMemo();  // まとめ画面へ遷移
        });
        // SNSリンクボタン
        $(document).off('click', `#memoLinkBtn-${archiveIdSeq}`)
            .on('click', `#memoLinkBtn-${archiveIdSeq}`, async function () {
            // SNSリンク
            const url = pointData.linkUrl;
            const iconKind = getSocialMediaIcon(url);
            console.log("memoLinkBtn: ", iconKind, url);
            var ret = await openDialogOKCancel(`リンクを開きますか？（${iconKind}）<br><br>${url}`);
            if (ret) {
                window.open(url, '_blank');    // 新しいタブでリンクを開く
            } else {
                copyToClipboard(url);
                displayToast("URLをクリップボードに転送しました");
            }
        });
        // 作成されたまとめマーカーを配列へ格納
        pointData.marker = routeMarker;
        // console.log("createMarker: ", indexValue);
    } catch (error) {
        errorProc("createMarker", error);
    }
}
// ポップアップ用の HTML生成
function createPopupHtml(pointData, isSearch ){
    const isPublish = AppStatus.isPublish;
    const times = pointData.memoDate + '     ' + pointData.memoTime;
    const body = convertNewlinesTag(pointData.body);
	// let dispBadgePublish = `<span class="badge bg-success text-light rounded-pill me-1 ">公開中</span>`;
	let dispBadgeOwn = `<span class="badge bg-info text-light rounded-pill me-1 ">My</span>`;
	if(!pointData.isOwnData) dispBadgeOwn = "";
    // 表示切替
	let dispGood = " d-none ";
	let dispBad = " d-none ";
	let dispEdit = " d-none ";
	let dispArchiveLink = " d-none ";
    let dispRemove = " d-none ";
    let dispDelete = " d-none ";
    let iconColor = " text-dark ";
	let dispAlert = " d-none ";
	let dispMemoLink = " d-none ";
    let dispPrice = " d-none ";
    if (Number(pointData.memoPrice) != 0) dispPrice = "";
    // SNSリンク
    const url = pointData.linkUrl;
    // 表示切り替え
    if(isSearch){
		// まとめリンク
        dispArchiveLink = "";
    } else {
        if (pointData.isOwnData) {
            // 編集アイコン
            dispEdit = "";
            if (!isPublish && pointData.archiveId > 0) {
                // 除外アイコン
                dispRemove = "";
            }
            if (isPublish) {
                // 削除アイコン
                dispDelete = "";
            }
        } else {
            // 通報アイコン
            dispAlert = "";
        }
        if (url && url != "") {
            dispMemoLink = "";
        }
    }
	if(isPublish){
        // 公開バッチ
        dispBadgePublish = "";
        // いいねアイコン
        dispGood = "";
        dispBad = "";
        if (pointData.isOwnData) {
            // アイコンの色
            iconColor = " text-gray "
        } else {
            // // 通報アイコン
            // dispAlert = "";
        }
	}
    // オフライン対応
    if (!AppStatus.isOnLine){
        // 編集アイコン
        dispEdit = "";
    }
    // const iconKind = getSocialMediaIcon(url);
    // html
    const popupHeight = 300;
    return `
        <div class="card text-left" style="height:${popupHeight}px;">
            <div class="card-header card-title d-flex align-items-center justify-content-between p-0 ps-2 " >
				<div class="d-flex align-items-center fw-bold fs-6" style="line-height: 1;">
					地点メモ
				</div>
                <div>
                    ${dispBadgeOwn}
					<!-- sizeUp -->
					<div class="btn p-0 px-2 " >
						<div id="sizeUpBtn-${pointData.archiveId}-${pointData.seq}">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-arrows-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7l4 -4l4 4" /><path d="M8 17l4 4l4 -4" /><path d="M12 3l0 18" />
                            </svg>
						</div>
					</div>
                    <!-- ドアップ -->
                    <div id="zoopMax-${pointData.archiveId}-${pointData.seq}" class="btn px-0 me-2" type="button">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8""  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-zoom-scan"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /><path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M16 16l-2.5 -2.5" />
                        </svg>
                    </div>
                    <!-- googleリンク -->
                    <div id="gotoGoogleMap-${pointData.archiveId}-${pointData.seq}" class="btn px-0 me-3" type="button">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-map-search"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11 18l-2 -1l-6 3v-13l6 -3l6 3l6 -3v7.5" /><path d="M9 4v13" /><path d="M15 7v5" /><path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M20.2 20.2l1.8 1.8" />
                        </svg>
                    </div>
                </div>
            </div>
            <div class="card-body overflow-auto-y p-0 p-2 d-flex flex-column">
                <!-- タイトル -->
                <div class="d-flex align-items-center justify-content-between">
                    <div class="fw-bold text-md1 text-truncate my-1 fs-6">
                        ${times}
                    </div>
                    <div class="d-flex flex-nowrap align-items-center">
                        <img src="${getImgDataByFaceId(pointData.faceId).imgUrl}" class="ms-2 icon-sm side-to-side-icon">
                        <img src="${getImgDataByWeatherId(pointData.weatherId).imgUrl}" class="ms-2 icon-md">
                    </div>
                </div>
                <!-- 本文 -->
                <div class="p-1 text-sm3_ flex-grow-1">
                    <div class="fw-bold text-md1_ text-truncate_ my-0 fs-6">
                        ${pointData.title}
                    </div>
                    <div class="m-2 text-md1">
                        ${body}
                    </div>
                </div>
                <!-- 金額表示 -->
                <div class="d-flex justify-content-center my-2 ${dispPrice}">
                    <div class="border-bottom d-flex justify-content-between w-50_ px-2" style="height:30px;">
                        <span class="text-md2 ">￥</span>
                        <span class="text-md2 text-end text-red">${Number(pointData.memoPrice).toLocaleString()}</span>
                    </div>
                </div>
            </div>
			<div class="card-footer d-flex justify-content-between align-items-center p-1 ">
				<div>
					<!-- good -->
					<div id="goodBtn-${pointData.archiveId}-${pointData.seq}" class="btn p-0 px-2 ${dispGood} ${iconColor}">
						<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-thumb-up"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" /></svg>
						<span id="goodCount-${pointData.archiveId}-${pointData.seq}">${pointData.count_Good}</span>
					</div>
					<!-- bad -->
					<div id="badBtn-${pointData.archiveId}-${pointData.seq}" class="btn p-0 px-2 ${dispBad} ${iconColor}">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-thumb-down"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 13v-8a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v7a1 1 0 0 0 1 1h3a4 4 0 0 1 4 4v1a2 2 0 0 0 4 0v-5h3a2 2 0 0 0 2 -2l-1 -5a2 3 0 0 0 -2 -2h-7a3 3 0 0 0 -3 3" /></svg>
						<span id="badCount-${pointData.archiveId}-${pointData.seq}">${pointData.count_Bad}</span>
					</div>
					<!-- remove -->
					<div class="btn p-0 px-2 ${dispRemove} " >
						<div id="removeBtn-${pointData.archiveId}-${pointData.seq}">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8""  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-backspace"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M20 6a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-11l-5 -5a1.5 1.5 0 0 1 0 -2l5 -5z" /><path d="M12 10l4 4m0 -4l-4 4" />
                            </svg>
						</div>
					</div>
				</div>
				<div>
					<!-- memoLink -->
					<div class="btn p-0 px-2 ${dispMemoLink} " >
						<div id="memoLinkBtn-${pointData.archiveId}-${pointData.seq}">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8""  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-world"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M3.6 9h16.8" /><path d="M3.6 15h16.8" /><path d="M11.5 3a17 17 0 0 0 0 18" /><path d="M12.5 3a17 17 0 0 1 0 18" />
                            </svg>
						</div>
					</div>
					<!-- archiveLink -->
					<div class="btn p-0 px-2 ${dispArchiveLink} " >
						<div id="archiveLinkBtn-${pointData.archiveId}-${pointData.seq}">
							<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-share-3"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c-.037 .206 5.384 -5.962 10 -6v4l8 -7l-8 -7z" />
                            </svg>
						</div>
					</div>
					<!-- alert -->
					<div id="alertBtn-${pointData.archiveId}-${pointData.seq}" class="btn p-0 px-2 ${dispAlert} text-dark ">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-alert-triangle"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /><path d="M12 16h.01" />
                        </svg>
					</div>
					<!-- edit -->
					<div class="btn p-0 px-2 ${dispEdit} " >
                        <div id="editBtn-${pointData.archiveId}-${pointData.seq}" _data-bs-toggle="modal" _data-bs-target="#inputArea">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24"  height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon><line x1="3" y1="22" x2="21" y2="22"></line>
                            </svg>
                        </div>
                    </div>
					<!-- delete -->
					<div class="btn p-0 px-2 ${dispDelete} " >
						<div id="deleteBtn-${pointData.archiveId}-${pointData.seq}">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                            </svg>
						</div>
					</div>
				</div>
			</div>
        </div>
    `;
}


// いいねボタンIDを取得（めんどくさー）
function getReActionElementId(reAction, pointData, kind){
    return `${reAction}${kind}-${pointData.archiveId}-${pointData.seq}`;
}
// いいねアイコン　０クリア
function allClearDataReActionIcon(pointData){
    pointData.val_Good = 0;
    pointData.val_Bad = 0;
    // pointData.val_Alert = 0;
    // console.log("allClearDataReActionIcon", pointData);
}
// いいねアイコン　一括反映
async function renderReActionIconAll(pointData){
    const icons = [DEF_ICO_GOOD, DEF_ICO_BAD];
    icons.forEach(icon => {
        renderReActionIcon(icon, pointData);
    });
    // ローカルDB登録
    const data = {
        [DEF_ICO_GOOD]: pointData.val_Good,
        [DEF_ICO_BAD]: pointData.val_Bad,
        // [DEF_ICO_ALERT]: pointData.val_Alert,
        archiveId: pointData.archiveId, // archiveId の定義を pointData から取得
        seq: pointData.seq, // seq の定義を pointData から取得
    };
    await UpsertReactionLocalDB(data);
}
// いいねアイコン 反映
function renderReActionIcon(reAction, pointData){
    // いいねボタン
    const isActive = getReActionVal(reAction, pointData);
    const elementId_Btn = getReActionElementId(reAction, pointData, 'Btn');
	const element_Btn = $(`#${elementId_Btn}`);
	// const pathElement = element_Btn.find("svg");
	// pathElement.attr("stroke", isActive == 1 ? "black" : "gray");
    let iconHtml = getReActionIconHtml(reAction, isActive);
    let newIcon = $(iconHtml);  // jQueryオブジェクトに変換
    let oldIcon = element_Btn.find("svg"); // jQueryでSVGを探す
    if (oldIcon.length) {
        oldIcon.replaceWith(newIcon);
    }
    // いいねカウント
    const count = getReActionCountBase(reAction, pointData);
    const elementId_Count = getReActionElementId(reAction, pointData, 'Count');
	const element = $(`#${elementId_Count}`);
    const sum = count + isActive;
	element.text(sum);
}
// いいねアイコン　データ取得
function getReActionVal(reAction, pointData){
    switch (reAction) {
        case DEF_ICO_GOOD:
            return pointData.val_Good;
        case DEF_ICO_BAD:
            return pointData.val_Bad;
        // case DEF_ICO_ALERT:
        //     return pointData.val_Alert;
    }
}
// いいねアイコン　データセット
function setReActionVal(reAction, pointData, val){
    switch (reAction) {
        case DEF_ICO_GOOD:
            pointData.val_Good = val;
            break;
        case DEF_ICO_BAD:
            pointData.val_Bad = val;
            break;
        // case DEF_ICO_ALERT:
        //     pointData.val_Alert = val;
        //     break;
    }
}
// いいねアイコン　総数取得
function getReActionCountBase(reAction, pointData){
    switch (reAction) {
        case DEF_ICO_GOOD:
            return pointData.count_Good;
        case DEF_ICO_BAD:
            return pointData.count_Bad;
        // case DEF_ICO_ALERT:
        //     return pointData.count_Alert;
    }
}
// いいねアイコン　クリックイベント設定（自分以外の場合のみ）
function addEventReActionIcon(reAction, pointData) {
    // console.log("addEventReActionIcon: ", pointData);
    const elementId_Btn = getReActionElementId(reAction, pointData, 'Btn');
    // 既存のクリックイベントを解除してから新しいイベントを登録
    $(document).off('click', `#${elementId_Btn}`).on('click', `#${elementId_Btn}`, function () {
        if (AppStatus.isAnonymous) {
            ShowWelcomeScreen();
        } else {
            // dataに新しい値をセット（反転）
            const newState = getReActionVal(reAction, pointData) == 1 ? 0 : 1;
            // アイコン初期化（１の時だけ）
            if (newState == 1) allClearDataReActionIcon(pointData);
            // element_Btn.data('val', newState);
            setReActionVal(reAction, pointData, newState);
            // アイコン反映
            renderReActionIconAll(pointData);
        }
    });
}
// いいねアイコンSVG取得
function getReActionIconHtml(reAction, isActive){
    // console.log("getReActionIconHtml: ", reAction, isActive);
    let htmlIcon;
    switch (reAction) {
        case DEF_ICO_GOOD:
            if (isActive) htmlIcon = `
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-thumb-up"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 3a3 3 0 0 1 2.995 2.824l.005 .176v4h2a3 3 0 0 1 2.98 2.65l.015 .174l.005 .176l-.02 .196l-1.006 5.032c-.381 1.626 -1.502 2.796 -2.81 2.78l-.164 -.008h-8a1 1 0 0 1 -.993 -.883l-.007 -.117l.001 -9.536a1 1 0 0 1 .5 -.865a2.998 2.998 0 0 0 1.492 -2.397l.007 -.202v-1a3 3 0 0 1 3 -3z" /><path d="M5 10a1 1 0 0 1 .993 .883l.007 .117v9a1 1 0 0 1 -.883 .993l-.117 .007h-1a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-7a2 2 0 0 1 1.85 -1.995l.15 -.005h1z" /></svg>
            `;
            else htmlIcon = `
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-thumb-up"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" /></svg>
            `;
            break;
        case DEF_ICO_BAD:
            if (isActive) htmlIcon = `
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-thumb-down"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 21.008a3 3 0 0 0 2.995 -2.823l.005 -.177v-4h2a3 3 0 0 0 2.98 -2.65l.015 -.173l.005 -.177l-.02 -.196l-1.006 -5.032c-.381 -1.625 -1.502 -2.796 -2.81 -2.78l-.164 .008h-8a1 1 0 0 0 -.993 .884l-.007 .116l.001 9.536a1 1 0 0 0 .5 .866a2.998 2.998 0 0 1 1.492 2.396l.007 .202v1a3 3 0 0 0 3 3z" /><path d="M5 14.008a1 1 0 0 0 .993 -.883l.007 -.117v-9a1 1 0 0 0 -.883 -.993l-.117 -.007h-1a2 2 0 0 0 -1.995 1.852l-.005 .15v7a2 2 0 0 0 1.85 1.994l.15 .005h1z" /></svg>
            `;
            else htmlIcon = `
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-thumb-down"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 13v-8a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v7a1 1 0 0 0 1 1h3a4 4 0 0 1 4 4v1a2 2 0 0 0 4 0v-5h3a2 2 0 0 0 2 -2l-1 -5a2 3 0 0 0 -2 -2h-7a3 3 0 0 0 -3 3" /></svg>
            `;
            break;
        default:
            break;
    }
    return htmlIcon;
}
// ローカルDBにいいねデータを保存（一括登録）
async function mapDataToLocalDB(mapData) {
    if (!mapData || mapData.length == 0) return;
    for (const pointData of mapData) {
        const data = {
            [DEF_ICO_GOOD]: pointData.val_Good,
            [DEF_ICO_BAD]: pointData.val_Bad,
            // [DEF_ICO_ALERT]: pointData.val_Alert,
            archiveId: pointData.archiveId,
            seq: pointData.seq,
            status: DEF_STS_COMPLETED
        };
        await UpsertReactionLocalDB(data, true); // 1つずつ順番に処理
    }
}




// googleMapへジャンプ
function jumpGoogleMap(){
    let point = _PointList[_CurrentIndex];
    let marker = point.marker;
    if(marker){
        if(!AppStatus.isOnLine){
            displayToastWaning('オフライン中は動作しません');
            return;
        }
        // Google MapsのURLを生成してジャンプ
        let googleMapsUrl = `https://www.google.com/maps?q=${point.latitude},${point.longitude}`;
        const encodedUrl = encodeURI(googleMapsUrl);
        console.log("jumpGoogleMap", encodedUrl);
        window.open(encodedUrl, '_blank');    // 新しいタブでGoogle Mapsを開く
    }
}
// マーカーに印（赤い円）を付与する
function createCircleWithMarker(marker){

    // 既存の円があれば削除（再クリックで円を消すため）
    if (renderCircle) {
        _map.removeLayer(renderCircle);
    }

    // マーカーの位置に円を追加
    renderCircle = L.circle([marker.getLatLng().lat, marker.getLatLng().lng], {
        color: 'red',        // 円の色
        fillColor: '#f03',     // 円の塗りつぶし色
        weight: 5,             // 線の太さ（ピクセル単位）
        fillOpacity: 0.1    // 塗りつぶしの透明度
        // radius: 100    // 円の半径（メートル）
    }).addTo(_map);
    resetCircle();
}
// マーカーに矢印を描画する
function drawLineWithArrow(startPoint, endPoint, kind = 0) {

    // 線を描画
    const polyline = L.polyline([startPoint, endPoint], { 
        color: _ArrowSettings.color, 
        weight: _ArrowSettings.weight, 
    }).addTo(_map);
    // 矢印を追加
    polyline.arrowheads({
        size: _ArrowSettings.size,    // 矢印のサイズ
        frequency: _ArrowSettings.frequency,    // 矢印の頻度（2000m、20px、endonly、allvertices）
        fill: _ArrowSettings.fill,
        yawn: _ArrowSettings.yawn,   // 矢印の幅？
        color: _ArrowSettings.color,    // 矢印の色
    });
    // kind を設定（通常: 0, メイン: 1）
    polyline.kind = kind;
    // 作成されたルート矢印を配列へ格納
    _RouteArrowList.push(polyline);
}
// メイン矢印を描画（メインマーカーまで矢印を引く）
function drawMainArrow(){
    if(_MainMarker && _PointList.length > 0){
        // 最後のマーカー
        const startPoint = { lat: _PointList[0].latitude, lng: _PointList[0].longitude };
        // メインマーカー
        const endPoint = {lat: _MainMarker.getLatLng().lat, lng: _MainMarker.getLatLng().lng};
        // 矢印描画
        removeMainArrow();  // すでにあれば削除
        drawLineWithArrow(startPoint, endPoint, 1); // 識別子を付与
    }
}
// メイン矢印を削除
function removeMainArrow() {
    for (let i = 0; i < _RouteArrowList.length; i++) {
        if (_RouteArrowList[i].kind === 1) {
            _map.removeLayer(_RouteArrowList[i]); // マップから削除
            _RouteArrowList.splice(i, 1); // 配列から削除
            break; // 最初に見つかった矢印だけ削除して終了
        }
    }
}

// マーカー用サークルの大きさ調整
function resetCircle(){
    if(renderCircle){
        // console.log('resetCircle');
        const currentZoom = _map.getZoom();
        //
        let val = 20 - currentZoom;
        if (val < 1) val = 1
        circleRadius = 3 * Math.pow(2, val);
        // サークルの半径を更新
        renderCircle.setRadius(circleRadius);
    }
}



// ルートマーカーを前へ
function moveMarkerPrev(){
    // 現在インデックス調整
    changeCurrentIndex(_CurrentIndex + 1);
    moveMarkerToCurrent();
}
// ルートマーカーを次へ
function moveMarkerNext(){
    // 現在インデックス調整
    // add_CurrentIndex(-1);
    changeCurrentIndex(_CurrentIndex - 1);
    moveMarkerToCurrent();
}
// ルートマーカーを一番前へ
function moveMarkerStart(){
    // 現在インデックス調整
    // add_CurrentIndex(1000);
    changeCurrentIndex(_CurrentIndex + 1000);
    moveMarkerToCurrent();
}
// ルートマーカーを一番後ろへ
function moveMarkerEnd(){
    // 現在インデックス調整
    // add_CurrentIndex(-1000);
    changeCurrentIndex(_CurrentIndex - 1000);
    moveMarkerToCurrent();
}
// 指定したseqを探してカレントとする
function moveMarkerToSeq(archiveId, seq){
    // console.log("moveMarkerToSeq: ", archiveId, seq);
    let hit = 0;
    if (archiveId && seq) {
        for (let i = 0; i < _PointList.length; i++) {
            if (_PointList[i].archiveId == archiveId && _PointList[i].seq == seq) {
                hit = i; // 該当するインデックスを返す
                break;
            }
        }
    }
    // 現在インデックス調整
    changeCurrentIndex(hit);
    moveMarkerToCurrent();
}
// 現在地をマーカーに合わせる
async function moveMarkerToCurrent(zoom = null){
    // console.log("moveMarkerToCurrent: ", zoom);
    if (!_PointList) return;
    if(_CurrentIndex < 0) _CurrentIndex = 0;
    if (!_PointList[_CurrentIndex]) return;
    if (!zoom) zoom = _map.getZoom();
    const marker = _PointList[_CurrentIndex].marker;
    if(marker){
        // ポップアップが開いている場合はイベントをスキップ
        if (!marker.isPopupOpen()) {
            // マーカーのポップアップ表示
            marker.openPopup();
        }
        // マーカーに目印をつける
        createCircleWithMarker(marker);
        // 地図も移動
        await moveMapTo(marker.getLatLng().lat, marker.getLatLng().lng, zoom, 1);
        // console.log("moveMarkerToCurrent: end", zoom);
    }
}
// マップの位置再設定（非同期対応）
async function moveMapTo(lat, lng, zoom, offsetMode = 0) {
    return new Promise((resolve, reject) => {
        try {
            if (!zoom) zoom = _map.getZoom();
            // 位置ずらし
            let targetLatLng;
            switch (offsetMode) {
            case 0:
                targetLatLng = [lat, lng];
                break;
            case 1:
                targetLatLng = getPosMapOffset(lat, lng, zoom);
                break;
            case 2:
                targetLatLng = getPosMapOffsetRev(lat, lng, zoom);
                break;
            }
            // console.log("targetLatLng: ", targetLatLng, offsetMode);
            // 地図移動
            _map.setView(targetLatLng, zoom, { animate: true, duration: 1 });
            // moveend イベントが発生したら解決
            _map.once('moveend', function () {
                // マーカー位置のずれを保持
                updateMarkerOffset();
                // resolve(_map.getCenter()); // 移動後の位置を返す
                resolve();
            });
        } catch (error) {
            reject(error); // エラーを捕捉して返す
        }
    });
}

// // 地図のずらしを元に戻す
// async function moveMapByOffset(zoom) {
//     if (!zoom) zoom = map.getZoom();
//     const lat = _map.getCenter().lat;
//     const lng = _map.getCenter().lng;
//     // オフセット反転
//     const mapOffset = _mapOffset.map(value => value * -1);
//     const targetLatLng = getAdjustedLatLng(lat, lng, mapOffset);
//     // マップを移動
//     _map.setView(targetLatLng, zoom, { animate: true, duration: 1 });
// }


// 共通変数分、位置をずらす
function getPosMapOffset(lat, lng, zoom){
    return getAdjustedLatLng(lat, lng, _mapOffset, zoom);
}
// 共通変数分、位置を戻す
function getPosMapOffsetRev(lat, lng, zoom){
    const mapOffset = _mapOffset.map(value => value * -1);
    return getAdjustedLatLng(lat, lng, mapOffset, zoom);
}
// 位置情報のずれ調整
function getAdjustedLatLng(lat, lng, offset = [0, 0], zoom) {
    // console.log("getAdjustedLatLng: ", zoom);
    if (!zoom) zoom = _map.getZoom();
    const centerPoint = _map.project([lat, lng], zoom); // 基準となる緯度経度をピクセル座標に変換
    const targetPoint = centerPoint.add(offset); // ピクセルオフセットを加算
    return _map.unproject(targetPoint, zoom); // 新しいピクセル座標を緯度経度に戻す
}



// ポップアップを閉じる
function closePopup(){
    _PointList.forEach(point => {
        // 条件を満たしている場合にポップアップを閉じる
        if (point.marker.isPopupOpen()) {
            point.marker.closePopup(); // ポップアップを閉じる
        }
    });
}






// 地図上の画面[80%]領域の緯度・経度を取得する関数
function getRangeForSearch() {
    // console.log('getRangeForSearch');
    const mapContainer = document.getElementById('mapArea');
    if(!mapContainer) return;
    const mapCenter = _map.getCenter();
    if(!_map) return;
    // 地図のサイズを取得
    const width = mapContainer.offsetWidth;
    const height = mapContainer.offsetHeight;
    // 四角形のサイズ（80%）
    const late = 0.8;
    const rectWidth = width * late;
    const rectHeight = height * late;
    // 地図座標をピクセル座標に変換
    const centerPoint = _map.latLngToContainerPoint(mapCenter);
    const topLeft = L.point(centerPoint.x - rectWidth / 2, centerPoint.y - rectHeight / 2);
    const bottomRight = L.point(centerPoint.x + rectWidth / 2, centerPoint.y + rectHeight / 2);
    // ピクセル座標を緯度経度に変換
    const topLeftLatLng = _map.containerPointToLatLng(topLeft);
    const bottomRightLatLng = _map.containerPointToLatLng(bottomRight);
    // 最小・最大緯度経度を計算
    const minLat = Math.min(topLeftLatLng.lat, bottomRightLatLng.lat);
    const maxLat = Math.max(topLeftLatLng.lat, bottomRightLatLng.lat);
    const minLng = Math.min(topLeftLatLng.lng, bottomRightLatLng.lng);
    const maxLng = Math.max(topLeftLatLng.lng, bottomRightLatLng.lng);
    // MemoFilterRequestのようなデータを作成
    const searchRange = {
        latMin: minLat,     // 最小緯度
        latMax: maxLat,     // 最大緯度
        lngMin: minLng,     // 最小経度
        lngMax: maxLng,     // 最大経度
    };
    return searchRange;
}

// ズームアップ（拡大）
function zoomUpMap() {
    var currentZoom = _map.getZoom();
    _map.setZoom(currentZoom + 1);
}
// ズームダウン（縮小）
function zoomDownMap() {
    var currentZoom = _map.getZoom();
    _map.setZoom(currentZoom - 1);
}


// ルートマッピング
async function renderRouteMapping(){
    // console.log("renderRouteMapping >> start");
    const isPublish = AppStatus.isPublish;
    const archiveId = AppStatus.archiveId;
    const seq = AppStatus.seq;
    if (!_map) {
        // 地図作成
        await initMap();
    }
    // ルートクリア
    await clearRouteMarker();
    let mapData;
    if (AppStatus.isOnLine) {
        // データ取得してマッピング
        if (archiveId > 0) {
            if (AppStatus.isAnonymous) {
                // 匿名まとめデータ取得
                // mapData = AppStatus.memos;
                mapData = [...AppStatus.memos];    // コピーを作成
            } else {
                // まとめデータ取得
                mapData = await GetArchivesData();
            }
            if (!mapData || mapData.length == 0) return;
            // いいねアイコンのためにローカル㏈へ保存
            if (isPublish) await mapDataToLocalDB(mapData);
            // ルート生成
            await createRoute(mapData);
            // マーカー移動
            if(seq && seq > 0) moveMarkerToSeq(archiveId, seq);
            else moveMarkerStart();
        }else{
            // 当日データ取得
            mapData = await GetMemoByToday();
            if (!mapData || mapData.length == 0) return;
            // ルート生成（現在地まで矢印描画）
            await createRoute(mapData);
            // マーカー移動
            moveMapToMainMarker();
        }
    } else {
        // localDBからデータ取得
        mapData = await getAllRouteMemo()
        if (!mapData || mapData.length == 0) return;
        // ルート生成（現在地まで矢印描画）
        await createRoute(mapData);
        // マーカー移動
        moveMapToMainMarker();
    }
    if (AppStatus.screenId == DEF_SCREEN_CREATE) {
        // メインマーカーまでの矢印描画
        drawMainArrow();
    }
}

// マップデータ取得
async function getMapData() {
    let mapData;
    // データ取得
    if (AppStatus.isOnLine) {
        if (AppStatus.archiveId > 0) {
            mapData = AppStatus.isAnonymous ? [...AppStatus.memos] : await GetArchivesData();
        } else {
            mapData = await GetMemoByToday();   // 今日のデータ
        }
    } else {
        // local㏈から取得
        mapData = await getAllRouteMemo();
    }
    if (!mapData || mapData.length == 0) return null;
    // console.log("mapData: ", mapData);
    return mapData;
}

// マップ描画
async function renderMap(mapData) {
    if (!mapData) return;
    const archiveId = AppStatus.archiveId;
    const seq = AppStatus.seq;
    // 地図生成
    if (!_map) await initMap();
    // マーカー消去
    await clearRouteMarker();
    // ルート生成
    await createRoute(mapData);
    if (archiveId > 0) {
        // 指定したマーカーへジャンプ
        seq && seq > 0 ? moveMarkerToSeq(archiveId, seq) : moveMarkerStart();
        if (AppStatus.isOnLine) {
            // いいねアクションデータ保持
            if (AppStatus.isPublish) await mapDataToLocalDB(mapData); 
        }
    } else {
        // メインマーカーへジャンプ
        moveMapToMainMarker();
    }
    // メインマーカーまで矢印描画
    if (AppStatus.screenId == DEF_SCREEN_CREATE) drawMainArrow();
}
