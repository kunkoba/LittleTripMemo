// UI操作
const _UI_Core = {
    // 初期化
    init() {
		// 要素取得
		this.noticeText = $Dom.GetElementById('notice-bar-text');
    },
	// カラーテーマの変更
	setTheme(theme){
        document.documentElement.setAttribute('data-theme', theme);
	},
	// すべてのポップメニューを閉じる
	closeAllPop(){
        document.querySelectorAll('[id^="pop-"]').forEach(el => el.classList.add('hidden'));
	},
	// 通知領域テキスト表示
	noticeUpdate(word){
		this.noticeText.textContent = word;
	}
};

// 窓口
const UI_Manager = {
    // カラーテーマ
    UI_THEME: {
        BLUE: 'blue',
        GREEN: 'green',
        RED: 'red',
        YELLOW: 'yellow',
    },
    // パーツ生成を担うジェネレータ
    Generator: {
        // 安全なドメインのホワイトリスト
        SAFE_DOMAINS: ['youtube.com', 'youtu.be', 'twitter.com', 'x.com', 'instagram.com', 'facebook.com', 'tiktok.com', 'github.com', 'google.com', 'google.co.jp', 'maps.app.goo.gl'],
        // URLの安全判定
        IsSafeUrl(url) {
            try {
                const hostname = new URL(url).hostname.toLowerCase();
                return this.SAFE_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
            } catch (e) { return false; }
        },
        // URLリンクボタンの生成
        LinkButton(url, params = null) {
            if (!url) return null;
            // テンプレートからボタン生成
            const btn = $Dom.GenerateTemplate("tpl-link-button", "ui-template-root");
            // アイコン注入（サイズは28px固定）
            btn.innerHTML = $Util.GetUrlIconHtml(url, 28);
            // クリックイベントの定義
            btn.onclick = async (e) => {
                e.stopPropagation();
                // 1. オンラインチェック
                if (!$App.AppData.Context.IsOnline) {
                    $Notice.Warn("オフライン中は、外部リンクを開けません。");
                    return;
                }
                // 2. 安全確認（移設したメソッドを呼び出し）
                const isSafe = this.IsSafeUrl(url);
                const title = isSafe ? "外部サイトを開く" : "セキュリティ警告";
                const message = isSafe ? `次のリンクを開きます。よろしいですか？\n\n${url}` : `安全性が確認されていないURLです。\n移動にはご注意ください。\n\n${url}`;
                // 3. 確認ダイアログ
                const isOk = await $Dialog.ShowConfirm({ title, message });
                if (!isOk) return;
                // 4. クリックログ送信（自分のデータでない場合のみ）
                if (params && !params.is_owner) {
                    $Data.Access.AddClick({ ...params, link_url: url });
                }
                // 5. 遷移
                window.open(url, '_blank', 'noopener,noreferrer');
            };
            return btn;
        },
		// ユーザ情報バッヂの生成
		UserBadge(profile, options = {}) {
			if (!profile) return null;
			const type = options.type || 'button'; // 'button' or 'badge'
			const isOwner = !!options.isOwner;
			// テンプレートの生成
			const tplId = (type === 'button') ? 'tpl-user-button' : 'tpl-user-badge';
			const el = $Dom.GenerateTemplate(tplId, "ui-template-root");
			// データの流し込み
			$Dom.QuerySelector(".js-icon", el).textContent = profile.icon || "👤";
			$Dom.QuerySelector(".js-name", el).textContent = profile.nick_name || "No Name";
			// ボタンタイプの場合のみイベントを付与
			if (type === 'button') {
				el.onclick = async (e) => {
					e.stopPropagation();
					if (isOwner) {
						// 自分の場合は保存済みのプロフを表示
						$Dialog.ShowUserProfile(profile, true);
					} else {
						// 他人の場合はAPIで詳細を取得して表示
						const isSuccess = await $Data.Access.GetUserProfile({ target_user_id: profile.user_id });
						if (isSuccess) $Dialog.ShowUserProfile($Data.resData, false);
					}
				};
			}
			return el;
		},
    },
	// 初期化
	Init(){
		// 本体初期化
		_UI_Core.init();
		// 初期処理
		this.ChangeTheme($App.AppData.Owner.Theme);
		// アイコンバー
		$TopBar.Init();
		$BotBar.Init();
		// 詳細画面
		$DetailFrame.Init();
		$DetailContent.Init();
		// 地図
		$Map.Init();
	},
    // 画面モード変更時
    ChangeScreenMode(){
		const mode = $App.AppData.Context.ScreenMode;
        // 通知バー
        switch (mode) {
            case $Const.SCREEN_MODE.CREATE:
                $UI.NoticeUpdate("「＋」ボタンで地点メモを作成することができます");
                break;
            case $Const.SCREEN_MODE.ARCHIVE:
                $UI.NoticeUpdate("画面下部の「操作ボタン」で各メモを移動できます");
                break;
            case $Const.SCREEN_MODE.ARCHIVE_PUB:
                $UI.NoticeUpdate("公開データは「Open」にしないと公開されません");
                break;
            case $Const.SCREEN_MODE.SEARCH:
                $UI.NoticeUpdate("画面範囲内のメモを検索できます");
                break;
            default:
				$Dialog.ShowLoginDialog();
                return;
        }
		// アイコンバー
		$TopBar.ChangeScreenMode();
		$BotBar.ChangeScreenMode();
		// 詳細画面
		$DetailFrame.ChangeScreenMode();
		$DetailContent.ChangeScreenMode();
		// 地図
		// $Marker.Clear();
		if (mode != $Const.SCREEN_MODE.SEARCH) {$Marker.RefreshPointMarker();}
	},
	// カラーテーマの変更
	ChangeTheme(theme){
        _UI_Core.setTheme(theme);
	},
	// すべてのポップメニューを閉じる
	CloseAllPop(){
        _UI_Core.closeAllPop();
	},
	// 通知領域テキスト表示
	NoticeUpdate(word){
		_UI_Core.noticeUpdate(word);
	},
	// アイコンバーの開閉
	ToggleIconBar(isShow){
		$TopBar.ToggleRoot(isShow);
		$BotBar.ToggleRoot(isShow);
	},
	// 通知バッジの更新
	UpdateNoticeBadge(count){
		$BotBar.UpdateNoticeBadge(count);
	},
	// フォントサイズの変更
	ChangeFontSize(size){
        // const sizes = { small: '14px', standard: '16px', large: '18px' };
        // document.documentElement.style.fontSize = sizes[size] || sizes.standard;
		document.documentElement.setAttribute('data-font-size', size || 'standard');
	},
};

// Public
export default UI_Manager;
