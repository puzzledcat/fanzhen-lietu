/* ============================================================
 * 藩镇·裂土 - 事件卡场景 (v2.0)
 * 支持三种模式:
 *   1. 即时执行 (无选择)
 *   2. 选位置 (在地图上点击合法藩镇)
 *   3. 选项选择 (多个按钮)
 * ============================================================ */

class EventScene extends Phaser.Scene {
  constructor() { super('EventScene'); }

  init(data) {
    this.eventData = data.event;
    this.onComplete = data.onComplete || (() => {});
  }

  create() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.6)
      .setOrigin(0);

    const isGood = this.eventData.type === 'good';
    const cardColor = isGood ? 0x2e7d32 : 0xc62828;

    const card = this.add.rectangle(cx, cy, 500, 360, cardColor, 0.95);
    card.setStrokeStyle(4, 0xf4d03f);
    card.setScale(0);
    this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut' });

    // 标题
    this.add.text(cx, cy - 130, this.eventData.name, {
      fontSize: '30px', color: '#fff', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // 描述
    this.add.text(cx, cy - 60, this.eventData.desc, {
      fontSize: '18px', color: '#fff8e1',
      align: 'center', wordWrap: { width: 440 }, lineSpacing: 6
    }).setOrigin(0.5);

    // 分支处理
    if (this.eventData.options) {
      this._renderOptions(cx, cy + 30);
    } else if (this.eventData.needsSelection) {
      this._renderSelectionPrompt(cx, cy + 30);
    } else {
      this._renderOkButton(cx, cy + 80);
    }
  }

  // ============ 选项模式（多选一）============
  _renderOptions(cx, baseY) {
    this.add.text(cx, baseY, '请选择：', {
      fontSize: '14px', color: '#ffd54f', fontStyle: 'italic'
    }).setOrigin(0.5);

    this.eventData.options.forEach((opt, i) => {
      const btn = this.add.text(cx, baseY + 40 + i * 50, '【 ' + opt.text + ' 】', {
        fontSize: '18px', color: '#1a0e08',
        backgroundColor: '#f4d03f', padding: { x: 20, y: 8 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#fff' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#f4d03f' }));
      btn.on('pointerdown', () => {
        SoundSystem.click();
        opt.apply(gameState);
        SoundSystem.coin();
        this._finish();
      });
    });
  }

  // ============ 选位置模式 ============
  _renderSelectionPrompt(cx, baseY) {
    const text = this._getSelectionHint();
    this.add.text(cx, baseY, text, {
      fontSize: '15px', color: '#ffd54f', fontStyle: 'bold',
      align: 'center', wordWrap: { width: 440 }
    }).setOrigin(0.5);

    this.add.text(cx, baseY + 50, '⏳ 等待你点击地图...', {
      fontSize: '14px', color: '#fff8e1', fontStyle: 'italic'
    }).setOrigin(0.5);

    this.add.text(cx, baseY + 100, '【 取消 】', {
      fontSize: '14px', color: '#aaa', padding: { x: 12, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._finish());

    // 关闭事件场景，让 MapScene 监听点击
    this.time.delayedCall(800, () => {
      this.scene.stop();
      this.scene.get('MapScene').scene.resume();
      // 设置事件选择模式
      gameState.currentEvent = this.eventData;
      // 通知 MapScene 进入选择模式
      const mapScene = this.scene.get('MapScene');
      if (mapScene && mapScene._enterEventSelection) {
        mapScene._enterEventSelection(this.eventData);
      }
    });
  }

  _getSelectionHint() {
    const need = this.eventData.needsSelection;
    if (need === 'own') return '👆 请在地图上点击你的藩镇';
    if (need === 'enemy') return '👆 请在地图上点击对手的藩镇';
    if (need === 'neutral' || need === 'neutral_adjacent') return '👆 请在地图上点击中立藩镇';
    if (need === 'option') return '👆 请选择';
    if (need === 'auto') return '⏳ 自动执行中...';
    return '👆 请在地图上选择';
  }

  // ============ 立即确认按钮 ============
  _renderOkButton(cx, baseY) {
    const okBtn = this.add.text(cx, baseY + 50, '【 收 下 】', {
      fontSize: '22px', color: '#1a0e08',
      backgroundColor: '#f4d03f', padding: { x: 30, y: 8 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    okBtn.on('pointerover', () => okBtn.setStyle({ backgroundColor: '#fff', scale: 1.1 }));
    okBtn.on('pointerout', () => okBtn.setStyle({ backgroundColor: '#f4d03f', scale: 1 }));
    okBtn.on('pointerdown', () => {
      SoundSystem.click();
      this.eventData.effect(gameState);
      SoundSystem.coin();
      this._finish();
    });
  }

  _finish() {
    gameState.currentEvent = null;
    this.onComplete();
    this.scene.stop();
    if (this.scene.get('MapScene')) {
      this.scene.get('MapScene').scene.resume();
    }
  }
}
