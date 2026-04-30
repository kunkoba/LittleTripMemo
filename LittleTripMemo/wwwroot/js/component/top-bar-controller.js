// UI操作
const _TopCore = {
    _elementId: "ui-top-bar",
    // 初期化
    init() {
		if (!this.root) {
			// 要素取得
			{
				this.root = $Dom.GetElementById(this._elementId);
				this.btnArchiveTitle = $Dom.GetElementById('ui-archive-title');
				this.uiSortGroup = $Dom.GetElementById('ui-sort-group');
				this.sortKbn = $Dom.GetElementById('sort-kbn');
				this.sortField = $Dom.GetElementById('sort-field');
				this.btnSysMenu = $Dom.GetElementById('btn-sys-menu');
			}
			// イベント登録
			{
				this.btnArchiveTitle.addEventListener('click', (e) => {
					// まとめ親編集
					$Dialog.ShowArchiveInfo();
				});
				this.btnSysMenu.addEventListener('click', (e) => {
					// システムメニュー
					$Dialog.ShowSystemMenu();
				});
				this.sortKbn.addEventListener("click", (e) => {
					const btn = e.target.closest("button");
					if (!btn) return;
					// 全ボタンをリセット
					this.sortKbn.querySelectorAll("button").forEach((b) => {
						b.classList.remove("bg-brand-3");
						b.classList.add("bg-brand-0");
					});
					// 押されたボタンだけ強調
					btn.classList.remove("bg-brand-0");
					btn.classList.add("bg-brand-3");
				});
				this.sortField.addEventListener("click", (e) => {
					const btn = e.target.closest("button");
					if (!btn) return;
					// 全ボタンをリセット
					this.sortField.querySelectorAll("button").forEach((b) => {
						b.classList.remove("bg-brand-3");
						b.classList.add("bg-brand-0");
					});
					// 押されたボタンだけ強調
					btn.classList.remove("bg-brand-0");
					btn.classList.add("bg-brand-3");
				});
			}
		}
    },
    // 画面モード変更時
    changeScreenMode(){
		// 初期化
		$Dom.ToggleShow(this.btnArchiveTitle, false);
		$Dom.ToggleShow(this.uiSortGroup, false);
		switch ($App.AppData.System.ScreenMode) {
			case $Const.SCREEN_MODE.CREATE:
				// 新規登録
				break;
			case $Const.SCREEN_MODE.ARCHIVE:
			case $Const.SCREEN_MODE.ARCHIVE_PUB:
				// まとめ参照
				$Dom.ToggleShow(this.btnArchiveTitle, true);
				break;
			case $Const.SCREEN_MODE.SEARCH:
				// 地図検索
				$Dom.ToggleShow(this.uiSortGroup, true);
				break;
			case $Const.SCREEN_MODE.ANONYMOUS:
				// 匿名利用
				$Dom.ToggleShow(this.btnArchiveTitle, true);
				break;
			default:
				// どれにも当てはまらないとき
				break;
		}
    },
	// まとめ親タイトル変更
    changeTitle(title){
        const archive = $Data.Store.GetArchive();
        const iconEl = $Dom.QuerySelector('.js-icon', this.btnArchiveTitle);
        const textEl = $Dom.QuerySelector('.js-text', this.btnArchiveTitle);
        // テキストの更新
        if (textEl) textEl.textContent = title;
        if (archive) {
            // クラスを一旦すべてリセット
            this.btnArchiveTitle.classList.remove("bg-black/50", "bg-brand-5", "bg-slate-800/50");
            if (!archive.is_public) {
                // 🔒 Private（黒背景）
                this.btnArchiveTitle.classList.add("bg-black/50");
                if (iconEl) iconEl.textContent = "🔒";
            } else {
                if (archive.closed_flg) {
                    // Close
                    this.btnArchiveTitle.classList.add("bg-slate-800/50");
                    if (iconEl) iconEl.textContent = "－"; // 閉じた目の代わり
                } else {
                    // Open
                    this.btnArchiveTitle.classList.add("bg-brand-5");
                    if (iconEl) iconEl.textContent = "◎"; // 開いた目
                }
            }
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
	// 並び順取得
	getSortSetting(){
		const sortKbn = this._getSelectedValue("sort-kbn");       // 0（Private） or 1（Public）
		const sortField = this._getSelectedValue("sort-field");   // 1（登録日時）, 2（更新日時）, 3（評価）
		return {sortKbn, sortField};
	},
	// 選択されているボタンの data-value を取得する
	_getSelectedValue(containerId) {
		const container = $Dom.GetElementById(containerId);
		const selected = $Dom.QuerySelector("button.bg-brand-3", container);
		return selected ? selected.dataset.value : null;
	},
};

// 窓口
const TopBarController = {
    // 初期化
	Init(){
		_TopCore.init();
	},
    // 画面モード変更時
    ChangeScreenMode(){
		_TopCore.changeScreenMode();
	},
    // 表示切替
    ToggleRoot(isOpen){
        _TopCore.toggleRoot(isOpen);
    },
	// 並び順設定取得
	GetSortSetting(){
		return _TopCore.getSortSetting();
	},
	// まとめ親タイトル変更
	ChangeTitle(title){
		_TopCore.changeTitle(title);
	},
};

// Public
export default TopBarController;
