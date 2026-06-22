// UI操作
const _BottomCore = {
    _elementId: "ui-bottom-bar",
    // 初期化
	init() {
		if (!this.root) {
			this.root = $Dom.GetElementById(this._elementId);
			
			// --- 1. 要素取得 (メニューボタン 4種) ---
			this.btnSysMenu  = $Dom.GetElementById('btn-sys-menu');
			this.btnUserMenu = $Dom.GetElementById('btn-user-menu');
			this.btnDataMenu = $Dom.GetElementById('btn-data-menu');
			this.btnAppMenu  = $Dom.GetElementById('btn-app-menu');

			// --- 2. 要素取得 (動的エリア・バッジ) ---
			this.btnCreate     = $Dom.GetElementById('btn-create');
			this.btnSearch     = $Dom.GetElementById('btn-search');
			this.groupMove     = $Dom.GetElementById('bot-group-move');
			this.badgeSysMenu  = $Dom.GetElementById('badge-sys-menu');
			this.badgeUserMenu = $Dom.GetElementById('badge-user-menu');

			// --- 3. 要素取得 (移動ボタン群：既存維持) ---
			this.btnFirst = $Dom.GetElementById('btn-bot-move-first');
			this.btnPrev  = $Dom.GetElementById('btn-bot-move-prev');
			this.btnOpen  = $Dom.GetElementById('btn-bot-move-open');
			this.btnNext  = $Dom.GetElementById('btn-bot-move-next');
			this.btnLast  = $Dom.GetElementById('btn-bot-move-last');

			// --- 4. イベント登録 (4つのメニュー) ---
			this.btnSysMenu.addEventListener('click',  () => $Dialog.ShowSystemMenu());
			this.btnUserMenu.addEventListener('click', () => $Dialog.ShowUserMenu());
			this.btnDataMenu.addEventListener('click', () => $Dialog.ShowDataMenu());
			this.btnAppMenu.addEventListener('click',  () => $Dialog.ShowActionMenu());

			// --- 5. イベント登録 (メインアクション・移動ボタン：既存維持) ---
			this.btnCreate.addEventListener('click', () => {
				$Marker.RefreshCurrentArrow();
				$Marker.FocusToLocationMarker();
				setTimeout(() => $DetailFrame.Open(), 50);
			});

			this.btnSearch.addEventListener('click', async () => {
				const range = $Map.GetSearchRange(0.8);
				const sortSetting = $TopBar.GetSortSetting();
				const params = { ...range, ...sortSetting, limit: 20 };
				$Data.Clear();
				if (await $Data.Access.SearchByLocationPub(params)) {
					$Marker.RefreshPointMarker();
				}
			});

			this.btnFirst.onclick = () => $Marker.FocusFirst();
			this.btnPrev.onclick  = () => $Marker.FocusPrev();
			this.btnNext.onclick  = () => $Marker.FocusNext();
			this.btnLast.onclick  = () => $Marker.FocusLast();
			this.btnOpen.onclick  = () => {
				const detail = $Marker.GetDataWithCurrentIndex();
				$DetailFrame.Open(detail);
			};
		}
	},
	changeScreenMode() {
		const mode = $App.AppData.Context.ScreenMode;

		// 上段の動的要素を一旦すべて隠す
		$Dom.ToggleShow(this.groupMove, false);
		$Dom.ToggleShow(this.btnCreate, false);
		$Dom.ToggleShow(this.btnSearch, false);

		// 画面モードに応じて必要なものだけ表示
		switch (mode) {
			case $Const.SCREEN_MODE.CREATE:
				$Dom.ToggleShow(this.btnCreate, true);
				break;
			case $Const.SCREEN_MODE.SEARCH:
				$Dom.ToggleShow(this.btnSearch, true);
				break;
			case $Const.SCREEN_MODE.ARCHIVE:
			case $Const.SCREEN_MODE.ARCHIVE_PUB:
				$Dom.ToggleShow(this.groupMove, true);
				break;
		}
	},
    // アイコンバーの表示切替
    toggleRoot(isOpen){
        $Dom.ToggleShow(this.root, isOpen);
    },
    // 小さなポップアップ（テーマ/レイヤー）の開閉
    togglePopList(el) {
        // 今そのポップが隠れているかどうか
        const isHidden = el.classList.contains('hidden');
        $UI.CloseAllPop();
        // 元々隠れていた場合のみ開く（トグル動作）
        if (isHidden) $Dom.ToggleShow(el, true);
    },
    // 通知の未読バッジ（赤丸）をシステムアイコンに付ける
	updateNoticeBadge() {
		// システム通知の未読数
		const unreadNotice = $App.AppData.Context.UnreadNoticeCount || 0;
		// 個人メッセージの未読数
		const unreadMail = $App.AppData.Context.UnreadMailCount || 0;
		
		if (this.badgeSysMenu) {
			$Dom.ToggleShow(this.badgeSysMenu, unreadNotice > 0);
		}
		if (this.badgeUserMenu) {
			$Dom.ToggleShow(this.badgeUserMenu, unreadMail > 0);
		}
	}
};

// 窓口
const BottomBarController = {
    // 初期化
	Init(){
		_BottomCore.init();
	},
    // 画面モード変更時
    ChangeScreenMode(){
		_BottomCore.changeScreenMode();
	},
    // 表示切替
    ToggleRoot(isOpen){
        _BottomCore.toggleRoot(isOpen);
    },
    // ボトムバーコントローラー窓口の末尾に追加
    UpdateNoticeBadge(count){
        _BottomCore.updateNoticeBadge(count);
    },
};

// Public
export default BottomBarController;
