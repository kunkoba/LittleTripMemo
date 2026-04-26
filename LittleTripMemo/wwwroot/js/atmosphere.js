// Atmosphere Library Core
const Atmosphere = {
    canvas: null,
    ctx: null,
    particles: [],
    lightningAlpha: 0,
    
    // Private状態
    targetWindSpeed: 0,
    currentWindSpeed: 0,
    targetDensity: 0,
    currentDensity: 0,
    weatherType: 'clear', // 0:clear, 1:rain, 2:storm, 3:snow

    // 天気インデックスのマッピング
    weatherMap: ['clear', 'rain', 'storm', 'snow'],

    /**
     * ライブラリの初期化
     */
    init: function() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'atm-canvas';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.status = document.createElement('div');
        this.status.className = 'atm-status';
        document.body.appendChild(this.status);

        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.update();
    },

    /**
     * 3桁のコードで演出を表示
     * @param {string} code - "993" のような3桁の文字列
     */
    show: function(code) {
        if (typeof code !== 'string' || code.length !== 3) return;
        
        const wind = parseInt(code[0]);    // 0-9
        const density = parseInt(code[1]); // 0-9
        const weather = parseInt(code[2]); // 0-3

        // 目標値の設定
        this.targetWindSpeed = (wind / 9) * 45; // 最大45m/s
        this.targetDensity = (density / 9);     // 0.0 to 1.0
        this.weatherType = this.weatherMap[weather] || 'clear';

        // パーティクル密度の即時調整
        this.adjustParticles();
    },

    /**
     * 演出を終了（晴れ、無風へ）
     */
    hide: function() {
        this.show('000');
    },

    /**
     * キャンバスのリサイズ
     */
    resize: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    /**
     * パーティクル個数の調整
     */
    adjustParticles: function() {
        const baseCounts = { rain: 200, snow: 150, leaf: 20, petal: 20 };
        
        Object.keys(baseCounts).forEach(type => {
            const targetCount = Math.floor(baseCounts[type] * this.targetDensity);
            const currentCount = this.particles.filter(p => p.type === type).length;

            if (currentCount < targetCount) {
                for (let i = 0; i < (targetCount - currentCount); i++) {
                    this.particles.push(this.createParticle(type));
                }
            } else if (currentCount > targetCount) {
                let removed = 0;
                const diff = currentCount - targetCount;
                for (let i = this.particles.length - 1; i >= 0 && removed < diff; i--) {
                    if (this.particles[i].type === type) {
                        this.particles.splice(i, 1);
                        removed++;
                    }
                }
            }
        });
    },

    /**
     * 新規パーティクルの作成
     */
    createParticle: function(type) {
        return {
            type: type,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            l: Math.random() * 15 + 15,
            v: Math.random() * 5 + 3,
            s: Math.random() * 2 + 2,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: Math.random() * 0.1 - 0.05,
            color: type === 'leaf' ? '#4ade80' : '#f472b6'
        };
    },

    /**
     * メインループ
     */
    update: function() {
        // 風速のスムーズな補完
        this.currentWindSpeed += (this.targetWindSpeed - this.currentWindSpeed) * 0.05;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // ステータス表示の更新
        this.status.innerText = `Mode: ${this.weatherType.toUpperCase()} | Wind: ${this.currentWindSpeed.toFixed(1)}m/s | Pop: ${Math.round(this.targetDensity * 100)}%`;

        // 雷の点滅
        if (this.weatherType === 'storm') {
            if (Math.random() > 0.993) this.lightningAlpha = 0.8;
            if (this.lightningAlpha > 0) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningAlpha})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.lightningAlpha -= 0.08;
            }
        }

        // 描画
        this.particles.forEach(p => {
            if (p.type === 'rain' && (this.weatherType === 'rain' || this.weatherType === 'storm')) {
                this.drawRain(p);
            } else if (p.type === 'snow' && this.weatherType === 'snow') {
                this.drawSnow(p);
            } else if ((p.type === 'leaf' || p.type === 'petal') && this.currentWindSpeed > 2 && this.weatherType === 'clear') {
                this.drawDebris(p);
            }
        });

        requestAnimationFrame(() => this.update());
    },

    /**
     * 雨の描画
     */
    drawRain: function(p) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.v * 1.8, this.currentWindSpeed * 0.8) - Math.PI / 2);
        
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = p.s + 2;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, p.l); ctx.stroke();

        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = p.s;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, p.l); ctx.stroke();
        ctx.restore();

        p.y += p.v * 1.8;
        p.x += this.currentWindSpeed * 0.8;
        if (p.y > this.canvas.height) { p.y = -p.l; p.x = Math.random() * this.canvas.width; }
        if (p.x > this.canvas.width + 50) p.x = -50;
        if (p.x < -50) p.x = this.canvas.width + 50;
    },

    /**
     * 雪の描画
     */
    drawSnow: function(p) {
        const ctx = this.ctx;
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 2.5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 1.8, 0, Math.PI * 2); ctx.fill();

        p.y += p.v * 0.5;
        p.x += this.currentWindSpeed * 0.6;
        if (p.y > this.canvas.height) { p.y = -20; p.x = Math.random() * this.canvas.width; }
        if (p.x > this.canvas.width + 50) p.x = -50;
        if (p.x < -50) p.x = this.canvas.width + 50;
    },

    /**
     * 葉っぱ・花びらの描画
     */
    drawDebris: function(p) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        const outline = p.type === 'leaf' ? '#14532d' : '#9d174d';
        ctx.strokeStyle = outline;
        ctx.lineWidth = 3;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.l / 2, p.l / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        p.x += this.currentWindSpeed * 0.8 + 2;
        p.y += p.v * 0.3;
        p.rot += p.rotSpeed * (1 + this.currentWindSpeed * 0.05);
        if (p.x > this.canvas.width + 50) { p.x = -50; p.y = Math.random() * this.canvas.height; }
        if (p.y > this.canvas.height + 50) p.y = -50;
    }
};

// 初期化
Atmosphere.init();