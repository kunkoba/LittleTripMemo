// UI操作
const _DetailFrameCore = {
    _elementId: "ui-detail-frame-id",
    // 初期化
    init() {
		if (!this.root) {
            // 要素取得
            {
                this.root = $Dom.GetElementById(this._elementId);
                this.btnEarth = $Dom.GetElementById("detail-btn-earth");
                this.btnMap  = $Dom.GetElementById("detail-btn-map");
                this.btnEdit = $Dom.GetElementById("detail-btn-edit");
                this.btnReport = $Dom.GetElementById("detail-btn-report");
                this.btnClose = $Dom.GetElementById("detail-btn-close");
                this.btnCancel = $Dom.GetElementById("detail-btn-cancel");
                this.btnSave = $Dom.GetElementById("detail-btn-save");
                // 下部ボタン
                this.groupMove = $Dom.GetElementById("detail-group-move");
                this.btnMoveFirst = $Dom.GetElementById("detail-btn-first");
                this.btnMovePrev = $Dom.GetElementById("detail-btn-prev");
                this.btnMoveNext = $Dom.GetElementById("detail-btn-next");
                this.btnMoveLast = $Dom.GetElementById("detail-btn-last");
                this.groupReaction = $Dom.GetElementById("detail-group-reaction");
                this.btnReactionFunny = $Dom.GetElementById("detail-btn-funny");
                this.btnReactionHelpful = $Dom.GetElementById("detail-btn-helpful");
                this.btnReactionSurprise = $Dom.GetElementById("detail-btn-surprise");
                this.btnReactionSad = $Dom.GetElementById("detail-btn-sad");
                // 
                this.mapBarrier = $Dom.GetElementById("ui-map-barrier");
            }
            // イベント登録
            {
                // Google Earth連携（追加）
                this.btnEarth.addEventListener("click", () => {
                    const data = $DetailContent.GetFormEditData();
                    if (data.latitude && data.longitude) {
                        const url = `https://earth.google.com/web/search/${data.latitude},${data.longitude}`;
                        window.open(url, '_blank');
                    } else {
                        $Notice.Warn("No location data.");
                    }
                });
                // googleMap連携
                this.btnMap.addEventListener("click", () => {
                    // 画面上の緯度経度を取得（getFormEditDataを利用）
                    const data = $DetailContent.GetFormEditData();
                    if (data.latitude && data.longitude) {
                        const url = `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`;
                        window.open(url, '_blank');
                    } else {
                        $Notice.Warn("No location data.");
                    }
                });
                // 通報ボタンクリック時の処理
                this.btnReport.addEventListener("click", () => {
                    const data = $DetailContent.GetFormEditData();
                    if (!data || !data.archive_id) return;
                    let targetUserId = data.user_id; // 明細に直接IDがあればそれを使う
                    const archive = $Data.Store.GetArchive();
                    // 現在開いているアーカイブが一致すれば、そこからオーナーIDを取得
                    if (archive && archive.archive_id === data.archive_id) {
                        targetUserId = archive.user_id;
                    }
                    if (!targetUserId) {
                        $Notice.Warn("ユーザー情報が取得できないため通報できません。");
                        return;
                    }
                    // 擬似的なarchiveオブジェクトを作ってダイアログへ渡す
                    $Dialog.ShowReportPost({
                        archive_id: data.archive_id,
                        user_id: targetUserId
                    });
                });
                // 編集切替ボタン
                this.btnEdit.addEventListener("click", () => {
                    const data = $DetailContent.GetFormEditData();
                    const currentData = $Data.Store.GetDetailByKey(data.archive_id, data.seq);
                    if (currentData && currentData.is_owner) {
                        $DetailContent.RenderDetail(currentData, true); // 編集モード
                        $Dom.ToggleShow(this.btnEdit, false); // 編集ボタン隠す
                        $Dom.ToggleShow(this.groupMove, false);
                        $Dom.ToggleShow(this.groupReaction, false);
                        // SAVEボタンとCANCELボタンを表示
                        $Dom.ToggleShow(this.btnSave, true);
                        $Dom.ToggleShow(this.btnCancel, true);
                    }
                });
                // 保存ボタン
                this.btnSave.addEventListener("click", async () => {
                    const detail = $DetailContent.GetFormEditData(); // フォームのデータを取得
                    // バリデーション実行 ---
                    const isValid = $DetailContent.Validate(detail);
                    if (!isValid) return; // 失敗時はここで中断（NoticeはValidate内で出している）
                    // 確認ダイアログ
                    const isOk = await $Dialog.ShowConfirm({
                        title: "保存前確認",
                        message: "保存してもよろしいですか？",
                        label: "OK"
                    });
                    if (!isOk) return;
                    await $Warn.CatchAsync(async () => {
                        const detail = $DetailContent.GetFormEditData();
                        // 永続化（完了を待機）
                        await $LocalDb.Detail.Save(detail);
                        // API更新
                        await $Data.Store.UpsertDetail(detail);
                        // 描画更新
                        $Marker.RefreshPointMarker();
                        $Marker.RefreshCurrentLocation();
                        // パネルを閉じる
                        this.toggleDetailPanel(false);
                        // 通知
                        $Notice.Info("Saved successfully.");
                    })();
                });
                this.btnClose.addEventListener("click", () => this.handleCloseOrCancel());
                this.btnCancel.addEventListener("click", () => this.handleCloseOrCancel());
                // 移動ボタン
                this.btnMoveFirst.addEventListener("click", () => this._moveAndRender(() => $Marker.FocusFirst()));
                this.btnMovePrev.addEventListener("click",  () => this._moveAndRender(() => $Marker.FocusPrev()));
                this.btnMoveNext.addEventListener("click",  () => this._moveAndRender(() => $Marker.FocusNext()));
                this.btnMoveLast.addEventListener("click",  () => this._moveAndRender(() => $Marker.FocusLast()));
                this.mapBarrier.addEventListener("click", () => this.handleCloseOrCancel());
                // リアクションボタン
                this.btnReactionFunny.addEventListener("click", () => this._onReactionClick("is_funny", 1));
                this.btnReactionHelpful.addEventListener("click", () => this._onReactionClick("is_love", 2));
                this.btnReactionSurprise.addEventListener("click", () => this._onReactionClick("is_surprise", 3));
                this.btnReactionSad.addEventListener("click", () => this._onReactionClick("is_sad", 4));
            }
        }
    },
    // キャンセル
    handleCloseOrCancel() {
        const data = $DetailContent.GetFormEditData();
        const isNew = (!data || !data.seq || data.seq == 0);
        const isEditMode = !this.btnSave.classList.contains("hidden");
        if (isNew) {
            this.toggleDetailPanel(false);
        } else if (isEditMode) {
            const currentData = $Data.Store.GetDetailByKey(data.archive_id, data.seq);
            $DetailFrame.Open(currentData); 
        } else {
            this.toggleDetailPanel(false);
        }
    },
    // 画面モード変更時
    changeScreenMode(){
        $Dom.ToggleShow(this.btnSave, false);
        $Dom.ToggleShow(this.groupMove, false);
        $Dom.ToggleShow(this.groupReaction, false);
        switch ($App.AppData.Context.ScreenMode) {
            case $Const.SCREEN_MODE.CREATE:
                // 新規登録
                $Dom.ToggleShow(this.btnSave, true);
                break;
            case $Const.SCREEN_MODE.ARCHIVE:
			case $Const.SCREEN_MODE.ARCHIVE_PUB:
                // まとめ参照
                $Dom.ToggleShow(this.groupMove, true);
                $Dom.ToggleShow(this.groupReaction, true);
                break;
            case $Const.SCREEN_MODE.SEARCH:
                // 地図検索
                break;
            default:
                // どれにも当てはまらないとき
                break;
        }
    },
    // 移動して詳細画面表示
    _moveAndRender(callback) {
        // 引数として渡された実行処理（アロー関数）を呼び出す
        callback();
        // 移動後のデータを取得して反映
        const detail = $Marker.GetDataWithCurrentIndex();
        $DetailContent.RenderDetail(detail);
        // リアクションも再描画する
        this.renderReactions(detail);
    },
    // 詳細パネルの開閉と関連UIの更新
    toggleDetailPanel(isShow) {
        // パネル占有サイズ設定
        const PANEL_WIDTH = '500px';
        const PANEL_HEIGHT = '80%';
        // 広告差分計算
        const isMobile = window.innerWidth < 768;
        // メイン処理
        if (isShow) {
            $Map.LockMap(true);
            // バリアを展開（マーカーへのタッチを防ぐ）
            if (this.mapBarrier) $Dom.ToggleShow(this.mapBarrier, true);
            // 詳細画面のサイズ
            if (isMobile) {
                this.root.style.height = PANEL_HEIGHT;
                this.root.style.width = "100%";
            } else {
                this.root.style.width = PANEL_WIDTH;
                this.root.style.height = "100%";
            }
            // this.root.style.borderWidth = "2px";
            this.root.classList.remove("opacity-0", "translate-y-full");
            this.root.classList.add("opacity-100", "translate-y-0");
        } else {
            // バリアを解除
            if (this.mapBarrier) $Dom.ToggleShow(this.mapBarrier, false);
            // パネルを閉じる時に環境エフェクトをオフにし、奥に戻す
            if (typeof Atmosphere !== 'undefined') {
                Atmosphere.hide();
                if (Atmosphere.canvas) Atmosphere.canvas.style.zIndex = '0';
            }
            $Map.LockMap(false);
            // 詳細画面のサイズ
            if (isMobile) {
                this.root.style.height = "0";
            } else {
                this.root.style.width = "0";
            }
            // 詳細画面のサイズ
            this.root.style.borderWidth = "0";
            this.root.classList.remove("opacity-100", "translate-y-0");
            this.root.classList.add("opacity-0", "translate-y-full");
        }
        // アイコン表示切替
        $UI.ToggleIconBar(!isShow);
        // 地図リサイズ
        $Map.ResizeMap();
    },
    // リアクションのカウントと状態を反映する
    async renderReactions(detail) {
        if (!detail) return;
        // --- 【追加】UIの初期化（リセット） ---
        const btns = [this.btnReactionFunny, this.btnReactionHelpful, this.btnReactionSurprise, this.btnReactionSad];
        btns.forEach(btn => {
            if (!btn) return;
            $Dom.QuerySelector('.js-count', btn).textContent = "..."; // 取得中表示
            btn.classList.remove('text-brand-5', 'border-brand-3', 'bg-brand-1', 'shadow-brand');
        });
        // 1. ローカルDBから自分のリアクション状態を取得
        const myLocal = await $LocalDb.Reaction.Get(detail.archive_id, detail.seq) || {};
        // 2. サーバー数値 + ローカルフラグ を加算
        const counts = {
            funny:    (detail.count_funny || 0)    + (myLocal.is_funny ? 1 : 0),
            helpful:  (detail.count_helpful || 0)  + (myLocal.is_love ? 1 : 0),
            surprise: (detail.count_surprise || 0) + (myLocal.is_surprise ? 1 : 0),
            sad:  (detail.count_sad || 0)  + (myLocal.is_sad ? 1 : 0)
        };
        // 3. UIに数値を反映
        if (this.btnReactionFunny)    $Dom.QuerySelector('.js-count', this.btnReactionFunny).textContent = counts.funny;
        if (this.btnReactionHelpful)  $Dom.QuerySelector('.js-count', this.btnReactionHelpful).textContent = counts.helpful;
        if (this.btnReactionSurprise) $Dom.QuerySelector('.js-count', this.btnReactionSurprise).textContent = counts.surprise;
        if (this.btnReactionSad)  $Dom.QuerySelector('.js-count', this.btnReactionSad).textContent = counts.sad;
        // 4. 自分の状態を反映
        const states = [
            { el: this.btnReactionFunny,    active: myLocal.is_funny },
            { el: this.btnReactionHelpful,  active: myLocal.is_love },
            { el: this.btnReactionSurprise, active: myLocal.is_surprise },
            { el: this.btnReactionSad,  active: myLocal.is_sad }
        ];
        states.forEach(item => {
            if (!item.el) return;
            if (item.active) {
                item.el.classList.add('text-brand-5', 'border-brand-3', 'bg-brand-1', 'shadow-brand');
            }
        });
    },
    // リアクションボタンクリック
    async _onReactionClick(propName, unusedType) {
        const detail = $DetailContent.GetFormEditData();
        if (!detail || !detail.archive_id) return;
        // 1. 自分のまとめの場合は何もしない
        if (detail.is_owner) {
            $Notice.Warn("You cannot react to your own memories.");
            return;
        }
        // 2. 現在のローカル状態を取得
        let myLocal = await $LocalDb.Reaction.Get(detail.archive_id, detail.seq);
        if (!myLocal) {
            myLocal = {
                archive_id: Number(detail.archive_id),
                seq: Number(detail.seq),
                is_funny: false, is_love: false, is_surprise: false, is_sad: false
            };
        }
        // 3. 押されたボタンに対応するフラグを反転
        myLocal[propName] = !myLocal[propName];
        // 4. 送信フラグを 0 (未送信) に設定
        myLocal.send_flag = 0;
        // 5. ローカルDBへ保存 ＆ UIを即座に再描画
        await $LocalDb.Reaction.Save(myLocal);
        await this.renderReactions(detail);
    },
};

// 窓口
const DetailFrameController = {
    // 初期化
	Init(){
        _DetailFrameCore.init();
	},
    // 画面モード変更時
    ChangeScreenMode(){
		_DetailFrameCore.changeScreenMode();
	},
    // 開く
    Open(detail) {
        // ▼ 画面を開く前にポップアップを閉じる
        $Marker.ClosePopup();
        // 
        _DetailFrameCore.toggleDetailPanel(true);
        const isNew = !detail;
        const isOwner = detail?.is_owner ?? true;
        // ScreenMode または detailのプロパティでPublicデータか判定
        const isPublic = $App.AppData.Context.ScreenMode === $Const.SCREEN_MODE.ARCHIVE_PUB || detail?.is_public === true;
        if (isNew) {
            // 1. 新規入力時
            $DetailContent.RenderDetail(null, true); // 編集モードで描画
            $Dom.ToggleShow(_DetailFrameCore.btnEdit, false);
            $Dom.ToggleShow(_DetailFrameCore.btnReport, false);
            $Dom.ToggleShow(_DetailFrameCore.btnSave, true);
            $Dom.ToggleShow(_DetailFrameCore.btnCancel, true);
            $Dom.ToggleShow(_DetailFrameCore.groupMove, false);
            $Dom.ToggleShow(_DetailFrameCore.groupReaction, false);
        } else {
            // 2. 既存データ参照時
            $Dom.ToggleShow(_DetailFrameCore.btnEdit, isOwner);
            $Dom.ToggleShow(_DetailFrameCore.btnReport, !isOwner && isPublic);
            $DetailContent.RenderDetail(detail, false);
            $Dom.ToggleShow(_DetailFrameCore.btnSave, false);
            $Dom.ToggleShow(_DetailFrameCore.groupMove, true);
            // リアクションボタンの制御
            if (isPublic) {
                $Dom.ToggleShow(_DetailFrameCore.groupReaction, true);
                // リアクションカウントをボタンに描画
                _DetailFrameCore.renderReactions(detail);
                // 自データの場合はボタンを非活性（disabled）にする
                const reactionBtns = $Dom.QuerySelectorAll("button", _DetailFrameCore.groupReaction);
                reactionBtns.forEach(btn => btn.disabled = isOwner);
            } else {
                $Dom.ToggleShow(_DetailFrameCore.groupReaction, false);
            }
        }
    },
    // 閉じる
    Close() {
        _DetailFrameCore.toggleDetailPanel(false);
    },
    // 外部から安全に閉じる（または戻す）ための窓口
    HandleClose() {
        _DetailFrameCore.handleCloseOrCancel();
    },
    // マーカー移動アイコングループ切替え
    ToggleBtnGroupMove(isShow){
        _DetailFrameCore.toggleBtnGroupMove(isShow);
    }
};

// Public
export default DetailFrameController;
