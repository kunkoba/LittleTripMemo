// UI操作
const _BottomCore = {
    _elementId: "ui-bottom-bar",
    // 初期化
    init() {
		if (!this.root) {
			// 要素取得
			{
				this.root = $Dom.GetElementById(this._elementId);
				this.btnCreate = $Dom.GetElementById('btn-create');
				this.btnSearch = $Dom.GetElementById('btn-search');
				this.btnAppMenu = $Dom.GetElementById('btn-app-menu');
				// this.popAppMenu = $Dom.GetElementById('pop-app-menu');
				this.groupMove = $Dom.GetElementById('bot-group-move');
				this.btnFirst = $Dom.GetElementById('btn-bot-move-first');
				this.btnPrev = $Dom.GetElementById('btn-bot-move-prev');
				this.btnOpen = $Dom.GetElementById('btn-bot-move-open');
				this.btnNext = $Dom.GetElementById('btn-bot-move-next');
				this.btnLast = $Dom.GetElementById('btn-bot-move-last');
			}
			// イベント登録
			{
				this.btnAppMenu.addEventListener('click', (e) => {
					// アプリメニュー
					$Dialog.ShowAppMenu();
				});
				this.btnCreate.addEventListener('click', () => {
					// 詳細画面開く
                    $Marker.FocusToLocationMarker();
					$Marker.RefreshCurrentArrow();
					$DetailFrame.Open();
				});
				this.btnSearch.addEventListener('click', async () => {
					const range = $Map.GetSearchRange(0.8);
					const sortSetting = $TopBar.GetSortSetting();
					const sortKbn = Number(sortSetting.sortKbn); // 0:Private, 1:Public
					const params = {
						...range,
						sort_field: Number(sortSetting.sortField), // 1:登録, 2:更新, 3:評価
						limit: 20
					};
					// 区分に応じて呼び出すAPIを切り替え
					let isSuccess = false;
					if (sortKbn === 0) {
						// Privateデータ検索
						isSuccess = await $Data.Access.SearchByLocation(params);
					} else {
						// Publicデータ検索
						isSuccess = await $Data.Access.SearchByLocationPub(params);
					}
					if (!isSuccess) return;
					// 検索結果のリスト表示、またはマーカーの再描画
					$Marker.RefreshPointMarker();
					// 検索結果が0件だった場合の通知（任意）
					const details = $Data.Store.GetAllDetails();
					if (details.length === 0) {
						$Notice.Info("No matching location found.");
					}
				});
				// 移動ボタン
				this.btnFirst.addEventListener('click', () => {$Marker.FocusFirst();});
				this.btnPrev.addEventListener('click', () => {$Marker.FocusPrev();});
				this.btnNext.addEventListener('click', () => {$Marker.FocusNext();});
				this.btnLast.addEventListener('click', () => {$Marker.FocusLast();});
				this.btnOpen.addEventListener('click', () => {
                    $Marker.FocusToCurrentMarker();
					$DetailFrame.Open($Marker.GetDataWithCurrentIndex());
				});
			}
		}
    },
    // 画面モード変更時
    changeScreenMode(){
		// 初期化
		$Dom.ToggleShow(this.btnCreate, false);
		$Dom.ToggleShow(this.btnSearch, false);
		$Dom.ToggleShow(this.groupMove, false);
		switch ($App.AppData.System.ScreenMode) {
			case $Const.SCREEN_MODE.CREATE:
				// 新規登録
				$Dom.ToggleShow(this.btnCreate, true);
				break;
			case $Const.SCREEN_MODE.ARCHIVE:
			case $Const.SCREEN_MODE.ARCHIVE_PUB:
				// まとめ参照
				$Dom.ToggleShow(this.groupMove, true);
				break;
			case $Const.SCREEN_MODE.SEARCH:
				// 地図検索
				$Dom.ToggleShow(this.btnSearch, true);
				break;
				// どれにも当てはまらないとき
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
};

// Public
export default BottomBarController;
