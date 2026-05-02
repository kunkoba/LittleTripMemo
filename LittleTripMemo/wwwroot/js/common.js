// エラー（重度）※アプリとしては処理続行不可
window.$Err = {
	_errMode: "fatal",
	// エラー処理
    Handle(err, mode) {
		console.error(err);
        // DebugInfoがあれば出力
        if (err.debugInfo) console.error("DebugInfo:", err.debugInfo);
        $Notice.Warn(err.message || "Operation failed.");
        if (mode === this._errMode) {
			console.log("エラーページへジャンプ！");
			// window.location.href = "component/fatal-error.html";
        }
    },
	// エラースロー
    Throw(message, mode = this._errMode) {
        const err = new Error(message);
        this.Handle(err, mode);
        throw err;
    },
	// try～catchでラッピング
    Catch(fn, mode = this._errMode) {
        return (...args) => {
            try {
                // fn(...args);
                const result = fn(...args);
                return result !== undefined ? result : true;
            } catch (err) {
                this.Handle(err, mode);
                return false;
            }
        };
    },
	// try～catchでラッピング（非同期）
    CatchAsync(fn, mode = this._errMode) {
        return async (...args) => {
            try {
                // await fn(...args);
                const result = await fn(...args);
                return result !== undefined ? result : true;
            } catch (err) {
                this.Handle(err, mode);
                return false;
            }
        };
    }
};

// エラー処理のラッパー（警告用）※処理続行可能
window.$Warn = {
	_errMode: "warning",
    Throw(message) { return $Err.Throw(message, this._errMode); },
    Catch(fn) { return $Err.Catch(fn, this._errMode); },
    CatchAsync(fn) { return $Err.CatchAsync(fn, this._errMode); }
};

// UI標準操作
window.$Dom = {
    // 要素取得＋検証
    GetElementById(id) {
        const el = document.getElementById(id);
        if (!el) $Warn.Throw(`[Dom] 要素が見つかりません: #${id}`);
        return el;
    },
    // 要素取得＋検証
    QuerySelector(selector, parent = document) {
        const el = parent.querySelector(selector);
        if (!el) $Warn.Throw(`[Dom] 要素が見つかりません: ${selector}`);
        return el;
    },
    // 要素取得＋検証
    QuerySelectorAll(selector, parent = document) {
        const els = parent.querySelectorAll(selector);
        if (!els.length) $Warn.Throw(`[Dom] 要素が見つかりません: ${selector}`);
        return els;
    },
    // 表示切替
    ToggleShow(el, isOpen) {
		// true だと閉じる
        el.classList.toggle('hidden', !isOpen);
    },
    // テンプレート生成
    GenerateTemplate(templateHtml, rootHtml = 'ui-template-root', isAppend = true){
        const tpl = this.GetElementById(templateHtml);
        const root = this.GetElementById(rootHtml);
        const el = tpl.content.firstElementChild.cloneNode(true);
        if (!isAppend) root.innerHTML = "";
        root.appendChild(el);
        return el;
    },
};

// 汎用処理
window.$Util = {
    // 表情アイコン取得
    GetImgDataByFaceId(faceId) {
        // 定数リストから一致するfaceIdを持つ要素を検索
        const list = $Const.FACE_ICONS;
        const icon = list.find(item => item.faceId == faceId);
        // 見つかればそのオブジェクトを、なければリストの先頭（デフォルト）を返す
        return icon ? icon : list[0];
    },
    // 天気アイコン取得
    GetImgDataByWeatherId(weatherId) {
        // WEATHERについても同様に定数から検索
        const list = $Const.WEATHER_ICONS;
        const icon = list.find(item => item.weatherId == weatherId);
        // 見つからない場合はリストの先頭をデフォルトとして返す
        return icon ? icon : list[0];
    },
    // 日付オブジェクトを文字列に変換（デフォルトをハイフン区切りに変更）
    FormatDate(dateObj = new Date(), format = 'YYYY-MM-DD') {
        dateObj = new Date(dateObj);
        // 置換用パーツの作成
        const parts = {
            YYYY: dateObj.getFullYear(),
            MM: ('0' + (dateObj.getMonth() + 1)).slice(-2),
            M: dateObj.getMonth() + 1,
            DD: ('0' + dateObj.getDate()).slice(-2),
            D: dateObj.getDate(),
            HH: ('0' + dateObj.getHours()).slice(-2),
            mm: ('0' + dateObj.getMinutes()).slice(-2),
            ss: ('0' + dateObj.getSeconds()).slice(-2)
        };
        // 指定フォーマットに従って置換（ハイフンもそのまま維持される）
        // return format.replace(/YYYY|MM|M|DD|D/g, (match) => parts[match]);
        return format.replace(/YYYY|MM|M|DD|D|HH|mm|ss/g, (match) => parts[match]);
    },
    // GPSから現在地を取得する（純粋な座標取得のみ）
    async GetCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) reject(new Error("GPS非対応"));
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000
            });
        });
    },
    // 文字列から座標オブジェクトを解析して返す
    ParseLatLng(input) {
        if (!input) return null;
        const parts = input.replace(/[\(\)\s]/g, "").split(',');
        if (parts.length !== 2) return null;
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        return (isNaN(lat) || isNaN(lng)) ? null : { lat, lng };
    },
    // 住所名から座標を検索する（外部API使用）　※プラスコードは不可
    async SearchAddressByWord(keyword) {
        if (!keyword) return null;
        // OpenStreetMapの無料検索APIを利用
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(keyword)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
        return null;
    },
    // 地点情報から地点名を検索する
    async GetAddressName(lat, lng, lang = 'jp') {
        // オフライン時の制御
        if (typeof AppStatus !== 'undefined' && !AppStatus.isOnLine) {
            return "Offline...";
        }
        // 引数のバリデーション
        if (!lat || !lng || typeof lat === 'undefined' || typeof lng === 'undefined') {
            return "Invalid coordinates";
        }
        try {
            // 逆ジオコーディングAPIの実行
            const zoom = 18;
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=${zoom}&addressdetails=1&accept-language=${lang}`;
            // HTTPリクエストの送信
            const response = await fetch(url);
            if (!response.ok) throw new Error("API request failed");
            // レスポンスの解析
            const data = await response.json();
            if (!data.display_name) {
                return "Address not found";
            }
            // 住所文字列の分割処理
            const parts = data.display_name.split(',').map(p => p.trim());
            // 住所要素の抽出
            const primary = parts[0] || '';
            const secondary = parts[2] ? ` (${parts[2]})` : '';
            // 整形した文字列の返却
            return `${primary}${secondary}`;
        } catch (error) {
            // エラーハンドリング
            if (typeof errorProc === 'function') {
                errorProc("fetchAddress", error);
            }
            return "Error fetching address";
        }
    },
};
