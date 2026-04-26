// 矢印設定（Private）
const _ArrowSettings = {
    // color: "blue",
    color: "var(--brand-lvl5)",
    weight: 10,
    size: '10px',
    frequency: '50px',
    fill: true,
    yawn: 30,
    opacity: 0.5
};

// マーカー・矢印・ポップアップの物理操作（Privateコア）
const _MarkerCore = {
    _map: null,
    _markerList: [],
    _arrowList: [],
    locationMarker: null,
    _highlightCircle: null,
    // 初期化
    init(map) {
        if (!this.locationMarker) {
            this._map = map;
            this.clearAll();
            this.locationMarker = L.marker(this._map.getCenter(), { draggable: true }).addTo(this._map);
        }
        this.locationMarker.on("dragend", (e) => {
            if ($App.AppData.System.ScreenMode !== $Const.SCREEN_MODE.CREATE) return;
            this.generateArrowToCurrent();
        });
    },
    // 画面モード変更時
    changeScreenMode(){
        // 業務ルール（画面モード）に基づく初期分岐
        switch ($App.AppData.System.ScreenMode) {
            case $Const.SCREEN_MODE.CREATE:
                // 新規登録
                break;
            case $Const.SCREEN_MODE.ARCHIVE:
			case $Const.SCREEN_MODE.ARCHIVE_PUB:
                // まとめ参照
                break;
            case $Const.SCREEN_MODE.SEARCH:
                // 地図検索
                break;
            default:
                break;
        }
    },
    // 地図上の描画要素をクリア
    clearAll() {
        this.clearPointMarker();
        this.clearArrow();
        this.highlightMarker(false);
        this.toggleMarkerPopup(false);
    },
    // マーカーを物理削除
    clearPointMarker() {
        this._markerList.forEach(marker => marker.remove());
        this._markerList = [];
    },
    // 矢印を物理削除
    clearArrow() {
        this._arrowList.forEach(arrow => arrow.remove());
        this._arrowList = [];
    },
    // マーカー生成（まとめて）
    generatePointMarkerList(details, callbacks) {
        details.forEach((row, index) => {
            // 32pxの絵文字を中央配置（ひし形の対角線に合わせてコンテナを52pxに調整）
            const iconHtml = `
                <div class="flex items-center justify-center" style="width: 52px; height: 52px;">
                    <div class="bg-white/50 w-9 h-9 border-2 border-brand-1 shadow-brand flex items-center justify-center" 
                        style="transform: rotate(45deg);">
                        <span class="text-[32px] e" style="transform: rotate(-45deg); display: block; line-height: 1;">
                            ${row.face_emoji || '😀'}
                        </span>
                    </div>
                </div>`;
            const customIcon = L.divIcon({
                html: iconHtml,
                className: '', 
                iconSize: [52, 52],
                iconAnchor: [26, 26] 
            });
            const marker = L.marker([row.latitude, row.longitude], {
                icon: customIcon,
                draggable: true
            }).addTo(this._map);
            // イベント登録（インデックスのみをコールバックで返す）
            marker.on('click', () => callbacks.onClick(index));
            marker.on('dragend', (e) => callbacks.onDragEnd(index, e.target.getLatLng()));
            this._markerList.push(marker);
            // 【根本対応】データにマーカー実体への参照を保持させる
            row.marker = marker;
        });
    },
    // 現在地マーカーの更新
    refreshCurrentLocation() { // ★引数追加
        console.log("refreshCurrentLocation()");
        $Warn.CatchAsync(async () => {
            const pos = await $Util.GetCurrentPosition();
            const p = [pos.coords.latitude, pos.coords.longitude];
            // 現在地マーカー移動
            if (this.locationMarker) this.locationMarker.setLatLng(p);
            if ($App.AppData.System.ScreenMode == $Const.SCREEN_MODE.CREATE) {
                // マップ移動
                this.generateArrowToCurrent();
                this.focusToLocationMarker();
            }
        })();
    },
    // 矢印生成（まとめて）
    generateArrowList() {
        if ($App.AppData.System.ScreenMode == $Const.SCREEN_MODE.SEARCH) return;
        setTimeout(() => {
            for (let i = 1; i < this._markerList.length; i++) {
                const fromMarker = this._markerList[i - 1];
                const toMarker = this._markerList[i];
                const arrow = this.generateArrow(fromMarker, toMarker);
                this._arrowList.push(arrow);
            }
            if ($App.AppData.System.ScreenMode == $Const.SCREEN_MODE.CREATE) {
                this.generateArrowToCurrent();
            }
        }, 100);
    },
    // 矢印生成（単品）
    generateArrow(fromMarker, toMarker) {
        const from = fromMarker.getLatLng();
        const to = toMarker.getLatLng();
        const polyline = L.polyline([from, to], {
            color: _ArrowSettings.color,
            weight: _ArrowSettings.weight,
            opacity: _ArrowSettings.opacity,
        }).addTo(this._map);
        return polyline;
    },
    // 現在地まで矢印を描く
    generateArrowToCurrent(){
        if (this._markerList.length === 0) return; // 地点がなければ矢印は描かない
        const fromMarker = this._markerList[this._markerList.length - 1];
        const toMarker = this.locationMarker;
        const arrow = this.generateArrow(fromMarker, toMarker);
        // 矢印リストに入れる（一括クリアのため）
        this._arrowList.push(arrow);
        // 現在地マーカーと紐づける（矢印更新のため）
        if (this.locationMarker.arrow) this.locationMarker.arrow.remove();
        this.locationMarker.arrow = arrow;
    },
    // 物理的な強調表示
    highlightMarker(isShow, index = null) {
        if (this._highlightCircle) {
            this._highlightCircle.remove();
            this._highlightCircle = null;
        }
        if (isShow && index !== null) {
            const marker = this._markerList[index];
            this._highlightCircle = L.circleMarker(marker.getLatLng(), {
                radius: 30,
                color: "red",
                weight: 3,
                fillOpacity: 0,
            }).addTo(this._map);
        }
    },
    // 物理的なポップアップ表示（DOM生成含む）
    toggleMarkerPopup(isOpen, index = null, detail = null) {
        if (isOpen && index !== null) {
            const marker = this._markerList[index];
            const el = $Dom.GenerateTemplate("tpl-marker-popup");
            $Dom.QuerySelector(".index", el).textContent = (index + 1);
            // const dateStr = (detail.memo_date || "").replace(/-/g, '/');
            // $Dom.QuerySelector(".time", el).textContent = `${dateStr} ${detail.memo_time || ""}`;
            $Dom.QuerySelector(".time", el).textContent = detail.memo_date + '  ' + detail.memo_time
            $Dom.QuerySelector(".title", el).textContent = detail.title || "";
            const bodyEl = $Dom.QuerySelector(".body", el);
            if (bodyEl) {
                bodyEl.textContent = detail.body || "";
                // 改行コードを認識して表示するようにクラスを追加
                bodyEl.classList.add("whitespace-pre-wrap");
            }
            const btnAction = $Dom.QuerySelector("#btn-popup-action", el);
            const actionText = $Dom.QuerySelector(".js-action-text", el);
            // 画面モードによるアクションボタンの制御
            if ($App.AppData.System.ScreenMode === $Const.SCREEN_MODE.SEARCH) {
                if (actionText) actionText.textContent = detail.a_title || "VIEW ARCHIVE";
                if (btnAction) {
                    btnAction.onclick = (e) => {
                        e.stopPropagation();
                        $App.AppData.System.ScreenMode = detail.is_public ? $Const.SCREEN_MODE.ARCHIVE_PUB : $Const.SCREEN_MODE.ARCHIVE;
                        $App.AppData.System.TargetArchiveId = detail.archive_id;
                        $App.RefreshScreen();
                        this._map.closePopup();
                    };
                }
            } else {
                if (actionText) actionText.textContent = "VIEW SUMMARY";
                if (btnAction) {
                    btnAction.onclick = (e) => {
                        e.stopPropagation();
                        $DetailFrame.Open(detail);
                    };
                }
            }
            // ポップアップ
            L.popup({
                offset:[0, -50],
                minWidth: 240, // 新しい幅に合わせて調整
                maxWidth: 240,
                className: 'custom-popup',
                closeButton: false,
            }).setLatLng(marker.getLatLng()).setContent(el).openOn(this._map);
        } else {
            this._map.closePopup();
        }
    },
    // 指定インデックスのマーカー実体を取得
    getMarker(index) {
        return this._markerList[index];
    },
    // 自位置マーカーへのフォーカス
    focusToLocationMarker() {
        if (this.locationMarker) $Map.FocusToTargetMarker(this.locationMarker);
    },
    // マーカー座標の抽出
    getLocationMarkerPos(){
        return this.locationMarker?.getLatLng();
    },
};

// マーカー管理の窓口（状態管理と指示出し）
const MarkerController = {
    _currentIndex: 0,
    // 初期化
    Init(map) {
        _MarkerCore.init(map);
    },
    ClosePopup() {
        _MarkerCore.toggleMarkerPopup(false);
    },
    // 画面モード変更時
    ChangeScreenMode(){
		this.RefreshPointMarker();
	},
    // 描画リフレッシュ
    RefreshPointMarker() {
        const details = $Data.Store.GetAllDetails();
        if (!details) return;
        this.Clear();
        _MarkerCore.generateArrowList();
        // マーカー生成
        _MarkerCore.generatePointMarkerList(details, {
            onClick: (index) => {
                // クリック
                this._currentIndex = index;
                this.FocusToCurrentMarker();
            },
            onDragEnd: (index, latLng) => {
                // ドラッグ完了後
                _MarkerCore.clearArrow();
                details[index].latitude = latLng.lat;
                details[index].longitude = latLng.lng;
                if ($App.AppData.System.ScreenMode !== $Const.SCREEN_MODE.SEARCH) {
                    _MarkerCore.generateArrowList();
                }
                this._currentIndex = index;
                this.FocusToCurrentMarker();
            }
        });
    },
    // 画面モード変更時
    ChangeScreenMode(){
        switch ($App.AppData.System.ScreenMode) {
            case $Const.SCREEN_MODE.CREATE:
                _MarkerCore.refreshCurrentLocation();
                this.FocusToLocationMarker();
                break;
            case $Const.SCREEN_MODE.ARCHIVE:
            case $Const.SCREEN_MODE.ARCHIVE_PUB:
                this.FocusFirst();
                break;
        }
        // _MarkerCore.generateArrowList();
	},
    // クリア指示
    Clear() {
        _MarkerCore.clearAll();
    },
    // 現在の状態に基づくフォーカス実行
    FocusToCurrentMarker(delay = 100) {
        console.log("★FocusToCurrentMarker");
        const marker = _MarkerCore.getMarker(this._currentIndex);
        if (!marker) return;
        const details = $Data.Store.GetAllDetails();
        $Map.FocusToTargetMarker(marker, delay);
        _MarkerCore.toggleMarkerPopup(true, this._currentIndex, details[this._currentIndex]);
        // if ($App.AppData.System.ScreenMode == $Const.SCREEN_MODE.ARCHIVE) {
            // ハイライト
            _MarkerCore.highlightMarker(true, this._currentIndex);
        // }
    },
    // ナビゲーション
    FocusFirst() {
        this._currentIndex = 0;
        this.FocusToCurrentMarker();
    },
    FocusPrev() {
        if (this._currentIndex > 0) {
            this._currentIndex--;
            this.FocusToCurrentMarker();
        }
    },
    FocusNext() {
        const details = $Data.Store.GetAllDetails();
        if (details && this._currentIndex < details.length - 1) {
            this._currentIndex++;
            this.FocusToCurrentMarker();
        }
    },
    FocusLast() {
        const details = $Data.Store.GetAllDetails();
        if (details) {
            this._currentIndex = details.length - 1;
            this.FocusToCurrentMarker();
        }
    },
    FocusToLocationMarker() {
        _MarkerCore.focusToLocationMarker();
    },
    GetLocationMarkerPos() {
        return _MarkerCore.getLocationMarkerPos();
    },
    RefreshCurrentLocation() {
        _MarkerCore.refreshCurrentLocation();
    },
    RefreshCurrentArrow() {
        _MarkerCore.generateArrowToCurrent();
    },
    // カレントデータ取得
    GetDataWithCurrentIndex() {
        const details = $Data.Store.GetAllDetails();
        return details[this._currentIndex];
    },
    // 変更を破棄して元に戻す
    RestoreMarkers() {
        // 1. データを生データの状態に戻す
        $Data.Store.Restore();
        // 2. 戻ったデータで地図を全描き直し（これで marker 参照も再配布される）
        this.RefreshPointMarker();
    },
    // 指定インデックスの地点を選択してフォーカス
    SelectMarker(index) {
        this._currentIndex = index;
        this.FocusToCurrentMarker();
    },
    // GoogleMap連携（窓口業務）
    LinkGoogleMap() {
        const detail = this.GetDataWithCurrentIndex();
        if (detail) {
            const googleMapsUrl = `https://www.google.com/maps?q=${detail.latitude},${detail.longitude}`;
            window.open(encodeURI(googleMapsUrl), '_blank');
        }
    },
};

export default MarkerController;
