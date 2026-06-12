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
				this.groupMove = $Dom.GetElementById('bot-group-move');
				this.btnFirst = $Dom.GetElementById('btn-bot-move-first');
				this.btnPrev = $Dom.GetElementById('btn-bot-move-prev');
				this.btnOpen = $Dom.GetElementById('btn-bot-move-open');
				this.btnNext = $Dom.GetElementById('btn-bot-move-next');
				this.btnLast = $Dom.GetElementById('btn-bot-move-last');
                this.badgeSysMenu = $Dom.GetElementById('badge-sys-menu');
			}
			// イベント登録
			{
				this.btnAppMenu.addEventListener('click', (e) => {
					// アプリメニュー
					$Dialog.ShowAppMenu();
				});
				this.btnCreate.addEventListener('click', () => {
					$Marker.RefreshCurrentArrow();
                    // まず現在地を画面中央にする
                    $Marker.FocusToLocationMarker();
                    // 50ミリ秒待ってから詳細画面を開く
                    setTimeout(() => {
						$DetailFrame.Open();
                    }, 50);
				});
				this.btnSearch.addEventListener('click', async () => {
					// 検索範囲（緯度経度）を取得
					const range = $Map.GetSearchRange(0.8);
					// TopBar から新しい構造のソート設定を取得
					const sortSetting = $TopBar.GetSortSetting();
					// ▼ 修正: C# 側の引数名に合わせて searchWord をパラメータに追加
					const params = {
						...range,
						sortField: sortSetting.sortField,
						reactionType: sortSetting.reactionType,
						keyword: sortSetting.keyword,
						limit: 50
					};
					// 通信処理（Public と Private でエンドポイントを分岐）
					const isSuccess = await $Data.Access.SearchByLocationPub(params);
					if (!isSuccess) return;
					// 検索結果のリスト表示、またはマーカーの再描画
					$Marker.RefreshPointMarker();
					// 検索結果が0件だった場合の通知（任意）
					const details = $Data.Store.GetDetailsSortByTimeline();
					if (details.length === 0) {
						$Notice.Info("条件に一致するメモが見つかりませんでした。");
					}
				});
				// 移動ボタン
				this.btnFirst.addEventListener('click', () => { $Marker.FocusFirst(); });
				this.btnPrev.addEventListener('click',  () => { $Marker.FocusPrev();  });
				this.btnNext.addEventListener('click',  () => { $Marker.FocusNext();  });
				this.btnLast.addEventListener('click',  () => { $Marker.FocusLast();  });
				this.btnOpen.addEventListener('click',  () => {
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
		switch ($App.AppData.Context.ScreenMode) {
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
    // 通知の未読バッジ（赤丸）をシステムアイコンに付ける
    updateNoticeBadge(count) {
        if (this.badgeSysMenu) {
            // システム通知 と 個人メッセージ の未読数を合算
            const totalUnread = ($App.AppData.Context.UnreadNoticeCount || 0) + 
                                ($App.AppData.Context.UnreadMailCount || 0);
            // 合計が 1 以上なら赤丸を表示
            $Dom.ToggleShow(this.badgeSysMenu, totalUnread > 0);
        }
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
    // ボトムバーコントローラー窓口の末尾に追加
    UpdateNoticeBadge(count){
        _BottomCore.updateNoticeBadge(count);
    },
};

// Public
export default BottomBarController;
