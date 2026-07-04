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
                this.sortField = $Dom.GetElementById('sort-field');
                this.sortReaction = $Dom.GetElementById('sort-reaction');
                this.sortWord = $Dom.GetElementById('sort-word');
            }
            // イベント登録
            {
                this.btnArchiveTitle.addEventListener('click', (e) => {
                    // まとめ親編集
                    $Dialog.ShowArchiveInfo();
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
                    const val = btn.dataset.value;
                    if (this.sortReaction) $Dom.ToggleShow(this.sortReaction, val === '3');
                    if (this.sortWord) $Dom.ToggleShow(this.sortWord, val === '4');
                });
                // リアクション種別（アイコン）のクリックイベント
                if (this.sortReaction) {
                    // 1. 定数に基づいてボタンを生成（1番目を初期選択にする）
                    const reactionTypes = Object.values($Const.REACTION_TYPE);
                    this.sortReaction.innerHTML = reactionTypes.map((type, idx) => `
                        <button data-value="${type.id}" class="ui-btn h-full px-3 transition-colors ${idx === 0 ? 'bg-brand-3' : 'bg-brand-0'}">
                            ${type.emoji}
                        </button>
                    `).join('');
                    // 2. イベント登録
                    this.sortReaction.addEventListener("click", (e) => {
                        const btn = e.target.closest("button");
                        if (!btn) return;
                        this.sortReaction.querySelectorAll("button").forEach((b) => {
                            b.classList.remove("bg-brand-3");
                            b.classList.add("bg-brand-0");
                        });
                        btn.classList.remove("bg-brand-0");
                        btn.classList.add("bg-brand-3");
                    });
                }
            }
        }
    },
    // 画面モード変更時
    changeScreenMode(){
        // 初期化
        $Dom.ToggleShow(this.btnArchiveTitle, false);
        $Dom.ToggleShow(this.uiSortGroup, false);
        switch ($App.AppData.Context.ScreenMode) {
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
    // 並び順取得ロジック（サーバー側のAPI仕様に合わせる）
    getSortSetting(){
        const sortField = this._getSelectedValue("sort-field"); 
        let reactionType = null;
        let searchWord = null;
        // 常にPublic前提のロジック
        if (sortField === '3') {
            reactionType = this._getSelectedValue("sort-reaction");
        }
        if (sortField === '4') {
            const input = $Dom.GetElementById('input-sort-word');
            if (input) searchWord = input.value.trim();
        }
        //
        return {
            isPublic: true, // 常にtrue
            sortField: parseInt(sortField || '1', 10),
            reactionType: reactionType ? parseInt(reactionType, 10) : null,
            keyword: searchWord,
        };
    },
    // 選択されているボタンの data-value を取得する
    _getSelectedValue(containerId) {
        const container = $Dom.GetElementById(containerId);
        if (!container) return null;
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