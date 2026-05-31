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
};

// Public
export default UI_Manager;
