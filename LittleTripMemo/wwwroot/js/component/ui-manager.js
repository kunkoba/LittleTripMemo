// UI操作
const _UI_Core = {
    // 初期化
    init() {
		// 要素取得
		this.noticeText = $Dom.GetElementById('notice-bar-text');
		// イベント登録
		document.addEventListener('click', (e) => {
			if (!e.target.closest('#btn-sys-menu') && !e.target.closest('#btn-app-menu')) {
				this.closeAllPop();
			}
        });
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
		const mode = $App.AppData.System.ScreenMode;
		// // 通知バー
		// this.NoticeUpdate("りとめも（Littele Trip Memo） >> " + $App.AppData.System.ScreenMode);
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
	}
};

// Public
export default UI_Manager;
