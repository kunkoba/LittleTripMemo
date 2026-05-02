// UI操作
const _DetailContentCore = {
    _elementId: "ui-detail-content-id",
    // 初期化
    init() {
        if (!this.root) {
            // 要素取得
            this.root = $Dom.GetElementById(this._elementId);
            {
                // --- 参照用（Displayモード） ---
                {
                    this.displayRoot = $Dom.GetElementById("detail-display");
                    this.displayDate = $Dom.GetElementById("detail-display-memo_date");
                    this.displayTime = $Dom.GetElementById("detail-display-memo_time");
                    this.displayFaceEmoji = $Dom.GetElementById("detail-display-face_emoji");
                    this.displayWeatherEmoji = $Dom.GetElementById("detail-display-weather_code");
                    this.displayTitle = $Dom.GetElementById("detail-display-title");
                    this.displayBody = $Dom.GetElementById("detail-display-body");
                    this.displayPrice = $Dom.GetElementById("detail-display-memo_price");
                    this.displayPriceUnit = $Dom.GetElementById("detail-display-price-unit");
                    this.displayUrlText = $Dom.GetElementById("detail-display-link_url");
                    // 追加：表示制御用ラッパー
                    this.displayPriceWrapper = $Dom.GetElementById("detail-display-price-wrapper");
                    // this.displayPriceLabel = $Dom.GetElementById("detail-display-price-label");
                    this.displayUrlWrapper = $Dom.GetElementById("detail-display-url-wrapper");
                }
                // --- 編集用（Editモード） ---
                {
                    this.editRoot = $Dom.GetElementById("detail-edit");
                    this.editDate = $Dom.GetElementById("detail-edit-memo_date");
                    this.editTime = $Dom.GetElementById("detail-edit-memo_time");
                    this.editTitle = $Dom.GetElementById("detail-edit-title");
                    this.editBody = $Dom.GetElementById("detail-edit-body");
                    this.editUrl = $Dom.GetElementById("detail-edit-link_url");
                    this.editArchiveId = $Dom.GetElementById("detail-edit-archive_id");
                    this.editSeq = $Dom.GetElementById("detail-edit-seq");
                    this.editLat = $Dom.GetElementById("detail-edit-latitude");
                    this.editLng = $Dom.GetElementById("detail-edit-longitude");
                    this.editPrice = $Dom.GetElementById("detail-edit-memo_price");
                    // 
                    this.editFaceEmoji = $Dom.GetElementById("detail-edit-face_emoji");
                    this.editFaceTrigger = $Dom.GetElementById("btn-face-trigger");
                    this.editFacePreview = $Dom.GetElementById("span-face-preview"); // IDを span 用のものに修正
                    // 
                    this.btnAtmosphereTrigger = $Dom.GetElementById("btn-atmosphere-trigger");
                    this.spanAtmospherePreview = $Dom.GetElementById("span-atmosphere-preview");
                    this.editWeatherEmoji = $Dom.GetElementById("detail-edit-weather_code");
                    if (this.btnAtmosphereTrigger) {
                        this.btnAtmosphereTrigger.addEventListener('click', () => {
                            const currentCode = this.editWeatherEmoji.value || "0000";
                            $Dialog.ShowAtmospherePicker(currentCode, (code) => {
                                this.spanAtmospherePreview.textContent = code;
                                this.editWeatherEmoji.value = code;
                            });
                        });
                    }
                    this.btnAddress = $Dom.GetElementById("btn-address-name");
                    if (this.btnAddress) {
                        this.btnAddress.addEventListener('click', async () => {
                            const data = $DetailContent.GetFormEditData();
                            console.log(data)
                            const addressName = await $Util.GetAddressName(data.latitude, data.longitude, "jp");
                            this.editTitle.value = addressName;
                        });
                    }
                    this.editPricePlus = $Dom.GetElementById("detail-edit-price_plus");
                    this.editPriceMinus = $Dom.GetElementById("detail-edit-price_minus");
                    this.countTitle = $Dom.GetElementById("detail-count-title");
                    this.countBody = $Dom.GetElementById("detail-count-body");
                    this.countUrl = $Dom.GetElementById("detail-count-url");
                }
            }
            // イベント登録
            {
                // 絵文字アイコン選択ボタンのクリックイベント
                this.editFaceTrigger.addEventListener('click', () => {
                    $Dialog.ShowEmojiPicker((emoji) => {
                        // プレビュー（span等）のテキストを更新
                        this.editFacePreview.textContent = emoji;
                        // 隠しフィールド（face_emoji）に直接絵文字をセット
                        this.editFaceEmoji.value = emoji;
                    });
                });
                // プラスに入力されたらマイナスをクリア
                this.editPricePlus.addEventListener('input', () => {
                    this.editPriceMinus.value = "";
                    this.editPrice.value = this.editPricePlus.value;
                });
                // マイナスに入力されたらプラスをクリア
                this.editPriceMinus.addEventListener('input', () => {
                    this.editPricePlus.value = "";
                    this.editPrice.value = this.editPriceMinus.value * -1;
                });
                // 文字数カウント連動（入力イベント）
                const elements =
                [
                    { input: this.editTitle, count: this.countTitle },
                    { input: this.editBody,  count: this.countBody },
                    { input: this.editUrl,   count: this.countUrl },
                ]
                elements.forEach(detail => {
                    if (detail.input && detail.count) {
                        detail.input.addEventListener("input", () => {
                            // 入力文字数をカウントして表示を更新
                            detail.count.textContent = detail.input.value.length;
                        });
                    }
                });
            }
        }
    },
    // 画面モード変更時
    changeScreenMode(){
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
                // どれにも当てはまらないとき
                break;
        }
    },
    // フォームに値反映
    renderDetail(detail, isEdit = false) {
        // 要素の取得チェック
        if (!this.root) this.init();
        // 引数 detail の有無で「新規作成」かどうかを判定
        const isNew = !detail;
        if (isNew) {
            // 新規入力
            $Dom.ToggleShow(this.editRoot, true);
            $Dom.ToggleShow(this.displayRoot, false);
            this._initEditForm();
        } else {
            // 既存データ
            $Dom.ToggleShow(this.editRoot, isEdit);
            $Dom.ToggleShow(this.displayRoot, !isEdit);
            // 両方のフォームにデータを流し込む（裏側で準備しておく）
            this._renderDisplayMode(detail);
            this._renderEditMode(detail);
        }
        // 環境エフェクトをオンにする
        if (typeof Atmosphere !== 'undefined') {
            if (Atmosphere.canvas) Atmosphere.canvas.style.zIndex = '1005'; // 詳細パネル(1002)より手前
            const code = detail?.weather_code || "0000";
            Atmosphere.show(code);
        }
        // ▼ 画面を開く前にポップアップを閉じる
        $Marker.ClosePopup();
    },
    // 参照用反映
    _renderDisplayMode(detail) {
        this.displayDate.textContent = detail.memo_date;
        this.displayTime.textContent = detail.memo_time;
        this.displayTitle.textContent = detail.title;
        this.displayBody.textContent = detail.body;
        // 金額の表示制御
        const price = Number(detail.memo_price || 0);
        if (price !== 0) {
            $Dom.ToggleShow(this.displayPriceWrapper, true);
            this.displayPrice.textContent = price.toLocaleString();
            // 通貨単位の決定ロジック
            let displayCurrency = $App.AppData.Owner.currency_unit || 'JPY';
            if (detail.archive_id > 0) {
                // 親アーカイブの情報をStoreから探す（一覧または現在開いているアーカイブ）
                const archiveList = $Data.Store.GetArchiveList() ||[];
                const targetArc = archiveList.find(a => a.archive_id === detail.archive_id) || $Data.Store.GetArchive();
                if (targetArc && targetArc.archive_id === detail.archive_id && targetArc.currency_unit) {
                    displayCurrency = targetArc.currency_unit; // 親の通貨で上書き
                }
            }
            this.displayPriceUnit.textContent = displayCurrency;
            // マイナスなら赤、プラスなら青に色分け
            if (price < 0) {
                this.displayPrice.className = "text-xl font-black text-red-500";
                // this.displayPriceLabel.className = "text-[10px] font-black uppercase tracking-wider text-red-500";
            } else {
                this.displayPrice.className = "text-xl font-black text-blue-500";
                // this.displayPriceLabel.className = "text-[10px] font-black uppercase tracking-wider text-blue-500";
            }
        } else {
            $Dom.ToggleShow(this.displayPriceWrapper, false);
        }

        // URLの表示制御
        if (detail.link_url) {
            $Dom.ToggleShow(this.displayUrlWrapper, true);
            this.displayUrlText.textContent = detail.link_url;
            // this.displayUrlText.href = detail.link_url;
            this.displayUrlWrapper.onclick = () => {
                const keyword = detail.link_url.trim();
                // Google検索URLへエンコードして渡す
                const searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(keyword);
                window.open(searchUrl, "_blank", "noopener,noreferrer");
            };
        } else {
            $Dom.ToggleShow(this.displayUrlWrapper, false);
        }

        this.displayFaceEmoji.textContent = detail.face_emoji || '😀';
        // this.displayWeatherEmoji.textContent = detail.weather_code || 'はれ'; // デフォルトを文字に
        this.displayWeatherEmoji.textContent = detail.weather_code || '0000';
    },
    // 編集用反映
    _renderEditMode(detail) {
        // 表示系の入力項目
        this.editDate.value = detail.memo_date;
        this.editTime.value = detail.memo_time;
        this.editTitle.value = detail.title;
        this.editBody.value = detail.body;
        this.editPrice.value = detail.memo_price;
        this.editUrl.value = detail.link_url;
        // 金額
        const price = Number(detail.memo_price || 0);
        this.editPrice.value = price; // 隠しフィールドにはそのままセット
        // 一旦両方をクリア
        this.editPricePlus.value = "";
        this.editPriceMinus.value = "";
        if (price > 0) {
            // プラスならプラス枠に
            this.editPricePlus.value = price;
        } else if (price < 0) {
            // マイナスなら絶対値（-を取った数字）にしてマイナス枠に
            this.editPriceMinus.value = Math.abs(price);
        }
        // 表情・天気IDとプレビュー画像
        this.editFaceEmoji.value = detail.face_emoji || '😀';
        this.editFacePreview.textContent = detail.face_emoji || '😀';
        // this.editWeatherEmoji.value = detail.weather_code || 'はれ'; // select の value に直接セット
        this.editWeatherEmoji.value = detail.weather_code || '0000';
        this.spanAtmospherePreview.textContent = detail.weather_code || '0000';
        // 更新用隠しフィールド
        this.editArchiveId.value = detail.archive_id;
        this.editSeq.value = detail.seq;
        this.editLat.value = detail.latitude;
        this.editLng.value = detail.longitude;
        // 文字数カウンターの同期
        if (this.countTitle) this.countTitle.textContent = (detail.title || "").length;
        if (this.countBody)  this.countBody.textContent  = (detail.body || "").length;
        if (this.countUrl)   this.countUrl.textContent   = (detail.link_url || "").length;
    },
    // 新規入力前状態を作る
    _initEditForm() {
        if (!this.editRoot) return;
        // フォーム内の全入力をリセット（input, textarea）
        this.editRoot.reset();
        // 現在の日付と時刻を取得してセット
        const now = new Date();
        const dateStr = $Util.FormatDate();
        const timeStr = now.toTimeString().slice(0, 5);  // hh:mm
        this.editDate.value = dateStr;
        this.editTime.value = timeStr;
        // 隠しフィールド（ID・座標など）を完全に空にする
        this.editArchiveId.value = "";
        this.editSeq.value = "0";
        // 金額の隠しフィールドと入力枠を確実にリセット
        this.editPrice.value = "0";
        this.editPricePlus.value = "";
        this.editPriceMinus.value = "";
        // 現在地マーカーから現在地を取得
        const pos = $Marker.GetLocationMarkerPos();
        this.editLat.value = pos.lat;
        this.editLng.value = pos.lng;
        this.editFaceEmoji.value = '😀';
        this.editFacePreview.textContent = '😀';
        // this.editWeatherEmoji.value = 'はれ'; // 新規時は「はれ」を選択
        this.editWeatherEmoji.value = '0000';
        this.spanAtmospherePreview.textContent = '0000';
        // 文字数カウンターを0にリセット
        if (this.countTitle) this.countTitle.textContent = "0";
        if (this.countBody)  this.countBody.textContent  = "0";
        if (this.countUrl)   this.countUrl.textContent   = "0";
    },
    // フォーム上のデータをまとめて取得
    getFormEditData(){
        // FormDataを使用して全入力を一括取得し、オブジェクトに変換
        const formData = new FormData(this.editRoot);
        const data = Object.fromEntries(formData.entries());
        // 数値項目（金額）を文字列から数値型に変換しておく
        // 空文字 "" の場合は 0 になるように ( || 0 ) を入れています
        data.seq = Number(data.seq || 0);
        data.archive_id = Number(data.archive_id || 0);
        data.latitude = Number(data.latitude || 0);
        data.longitude = Number(data.longitude || 0);
        data.memo_price = Number(data.memo_price || 0);
        // データストアから元の明細データを取得（新規作成時(seq=0)は空オブジェクト）
        let originalData = {};
        if (data.seq > 0) {
            originalData = $Data.Store.GetDetailByKey(data.archive_id, data.seq) || {};
        }
        // 元データとフォームデータをマージ
        const mergedData = { ...originalData, ...data };
        // 【重要】IndexedDB保存時・JSON化時のエラーを防ぐため、マーカー実体を削除
        delete mergedData.marker;
        //
        return mergedData;
    },
};

// 窓口
const DetailContentController = {
    // 初期化
	Init(){
        _DetailContentCore.init();
	},
    // 画面モード変更時
    ChangeScreenMode(){
		_DetailContentCore.changeScreenMode();
	},
    // 値反映
    RenderDetail(detail, isEdit = false){
        _DetailContentCore.renderDetail(detail, isEdit);
    },
    // フォーム上のデータをまとめて取得
    GetFormEditData(){
        return _DetailContentCore.getFormEditData();
    },
};

// Public
export default DetailContentController;
