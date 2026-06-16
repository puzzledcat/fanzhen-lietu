/* ============================================================
 * 藩镇·裂土 - 音效系统 (v2.0)
 * 使用 Web Audio API 程序生成，无外部文件依赖
 * ============================================================ */

const SoundSystem = {
  ctx: null,
  enabled: true,
  volume: 0.3,
  initialized: false,

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio 不可用:', e);
      this.enabled = false;
    }
  },

  /**
   * 播放一个音调
   */
  _tone(freq, duration, type = 'sine', volume = this.volume, attack = 0.01) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration);
  },

  /**
   * 扫频音（用于骰子、风声等）
   */
  _sweep(fromFreq, toFreq, duration, type = 'sine', volume = this.volume) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(fromFreq, t);
    osc.frequency.exponentialRampToValueAtTime(toFreq, t + duration);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  },

  // ============ 8 种游戏音效 ============
  battleStart() { // 刀剑碰撞
    if (!this.enabled) return;
    this._tone(800, 0.1, 'sawtooth', 0.4);
    setTimeout(() => this._tone(600, 0.1, 'sawtooth', 0.3), 50);
    setTimeout(() => this._tone(1200, 0.15, 'triangle', 0.3), 100);
  },

  diceRoll() { // 骰子滚动
    if (!this.enabled) return;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => this._tone(200 + i * 100, 0.05, 'square', 0.2), i * 40);
    }
  },

  victory() { // 占领/胜利
    if (!this.enabled) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.3, 'triangle', 0.4), i * 100);
    });
  },

  defeat() { // 失败
    if (!this.enabled) return;
    this._sweep(400, 100, 0.6, 'sawtooth', 0.3);
  },

  coin() { // 金币
    if (!this.enabled) return;
    this._tone(1200, 0.1, 'triangle', 0.4);
    setTimeout(() => this._tone(1600, 0.15, 'triangle', 0.3), 80);
  },

  event() { // 事件卡
    if (!this.enabled) return;
    this._sweep(400, 800, 0.2, 'sine', 0.3);
    setTimeout(() => this._tone(800, 0.2, 'sine', 0.3), 200);
  },

  triumph() { // 游戏胜利
    if (!this.enabled) return;
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.4, 'triangle', 0.4), i * 150);
    });
    // 加个低音铺底
    setTimeout(() => this._tone(262, 1.0, 'sine', 0.3), 0);
  },

  lose() { // 游戏失败
    if (!this.enabled) return;
    this._sweep(400, 80, 1.0, 'sawtooth', 0.3);
  },

  recruit() { // 募兵
    if (!this.enabled) return;
    this._tone(440, 0.1, 'triangle', 0.3);
    setTimeout(() => this._tone(550, 0.1, 'triangle', 0.3), 80);
    setTimeout(() => this._tone(660, 0.1, 'triangle', 0.3), 160);
  },

  click() { // 按钮点击
    if (!this.enabled) return;
    this._tone(800, 0.05, 'square', 0.2);
  }
};

// 首次用户交互时初始化 audio context（浏览器要求）
window.addEventListener('click', () => SoundSystem.init(), { once: true });
window.addEventListener('keydown', () => SoundSystem.init(), { once: true });
