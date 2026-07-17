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
                // 追加：マーカー切替スイッチ
                this.btnMarkerEmoji = $Dom.GetElementById('btn-marker-mode-emoji');
                this.btnMarkerFeel = $Dom.GetElementById('btn-marker-mode-feel');
            }
            // イベント登録
            {
                this.btnArchiveTitle.addEventListener('click', (e) => {
                    $Dialog.ShowArchiveInfo();
                });
                // 追加：マーカー切替イベント
                [this.btnMarkerEmoji, this.btnMarkerFeel].forEach(btn => {
                    btn.addEventListener('click', () => {
                        const mode = btn.dataset.mode;
                        this.updateMarkerMode(mode);
                    });
                });
                this.sortField.addEventListener("click", (e) => {
                    const btn = e.target.closest("button");
                    if (!btn) return;
                    this.sortField.querySelectorAll("button").forEach((b) => {
                        b.classList.remove("bg-brand-3");
                        b.classList.add("bg-brand-0");
                    });
                    btn.classList.remove("bg-brand-0");
                    btn.classList.add("bg-brand-3");
                    const val = btn.dataset.value;
                    if (this.sortReaction) $Dom.ToggleShow(this.sortReaction, val === '3');
                    if (this.sortWord) $Dom.ToggleShow(this.sortWord, val === '4');
                });
                if (this.sortReaction) {
                    const reactionTypes = Object.values($Const.REACTION_TYPE);
                    this.sortReaction.innerHTML = reactionTypes.map((type, idx) => `
                        <button data-value="${type.id}" class="ui-btn h-full px-3 transition-colors ${idx === 0 ? 'bg-brand-3' : 'bg-brand-0'}">
                            ${type.emoji}
                        </button>
                    `).join('');
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
    // 追加：マーカー表示モードの更新
    updateMarkerMode(mode) {
        $App.AppData.Context.MarkerMode = mode;
        const isEmoji = mode === $Const.MARKER_MODE.EMOJI;
        
        // UIの更新（背景色）
        this.btnMarkerEmoji.classList.toggle('bg-brand-3', isEmoji);
        this.btnMarkerEmoji.classList.toggle('bg-brand-0', !isEmoji);
        this.btnMarkerFeel.classList.toggle('bg-brand-3', !isEmoji);
        this.btnMarkerFeel.classList.toggle('bg-brand-0', isEmoji);

        // 地図の再描画
        $Marker.RefreshPointMarker();
    },
    // ... (以下既存の changeScreenMode, changeTitle 等)