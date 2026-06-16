/* ============================================================
 * 藩镇·裂土 - 主菜单场景 (v2.0)
 * ============================================================ */

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    // 标题
    this.add.text(cx, cy - 220, '藩 镇 · 裂 土', {
      fontSize: '64px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
      color: '#f4d03f',
      stroke: '#3d2418',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(cx, cy - 150, '— Nemo的乱世 —', {
      fontSize: '22px',
      color: '#c8a25a',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    this.add.text(cx, cy - 100, '☁️  ⚔️  🏯  ⚔️  ☁️', {
      fontSize: '28px'
    }).setOrigin(0.5);

    // 难度选择
    this.add.text(cx, cy - 50, '选择难度：', {
      fontSize: '16px', color: '#c8a25a', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.selectedDifficulty = localStorage.getItem('fanzhen_difficulty') || 'normal';
    const difficulties = ['easy', 'normal', 'hard'];
    const diffLabels = {
      easy: '🟢 简单',
      normal: '🟡 普通',
      hard: '🔴 困难'
    };
    const btnWidth = 120;
    difficulties.forEach((d, i) => {
      const x = cx + (i - 1) * (btnWidth + 20);
      const btn = this.add.text(x, cy - 10, diffLabels[d], {
        fontSize: '16px', color: '#fff',
        backgroundColor: this.selectedDifficulty === d ? '#f4d03f' : '#3d2418',
        padding: { x: 14, y: 6 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#5d3e1f' }));
      btn.on('pointerout', () => {
        if (this.selectedDifficulty === d) btn.setStyle({ backgroundColor: '#f4d03f' });
        else btn.setStyle({ backgroundColor: '#3d2418' });
      });
      btn.on('pointerdown', () => {
        this.selectedDifficulty = d;
        localStorage.setItem('fanzhen_difficulty', d);
        this.scene.restart();
      });
    });

    // 开始按钮
    const newBtn = this.add.text(cx, cy + 60, '【 开 始 乱 世 】', {
      fontSize: '30px', color: '#1a0e08',
      backgroundColor: '#f4d03f', padding: { x: 30, y: 12 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    newBtn.on('pointerover', () => newBtn.setStyle({ backgroundColor: '#fff', scale: 1.05 }));
    newBtn.on('pointerout', () => newBtn.setStyle({ backgroundColor: '#f4d03f', scale: 1 }));
    newBtn.on('pointerdown', () => this.startNewGame());

    // 继续游戏
    if (localStorage.getItem('fanzhen_save')) {
      const contBtn = this.add.text(cx, cy + 130, '【 继 续 乱 世 】', {
        fontSize: '22px', color: '#c8a25a',
        backgroundColor: '#3d2418', padding: { x: 24, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      contBtn.on('pointerover', () => contBtn.setStyle({ color: '#f4d03f' }));
      contBtn.on('pointerout', () => contBtn.setStyle({ color: '#c8a25a' }));
      contBtn.on('pointerdown', () => this.loadGame());
    }

    // 生涯统计
    const career = getCareer();
    if (career.totalGames > 0) {
      this.add.text(cx, cy + 200,
        `🏅 生涯：${career.totalGames}局 ${career.wins}胜 · 最佳${career.bestRound || '-'}回合 · 连胜${career.longestStreak}`,
        { fontSize: '13px', color: '#8a6a4a', fontStyle: 'italic' }
      ).setOrigin(0.5);
    }

    // 玩法说明
    this.add.text(cx, cy + 240,
      '鼠标点击你的藩镇 → 选择动作（募兵/攻伐/招安）\n' +
      '行动点耗尽即回合结束，AI 接管 → 统一天下或占地最多获胜',
      { fontSize: '13px', color: '#a08060', align: 'center', lineSpacing: 4 }
    ).setOrigin(0.5);

    // 重置生涯按钮
    this.add.text(cx, cy + 290, '重置生涯记录', {
      fontSize: '11px', color: '#666', fontStyle: 'italic'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', function() { this.setColor('#ff8a80'); })
      .on('pointerout', function() { this.setColor('#666'); })
      .on('pointerdown', () => {
        if (confirm('确定重置生涯记录？')) {
          resetCareer();
          this.scene.restart();
        }
      });

    this.add.text(20, this.cameras.main.height - 30, 'v2.0 · 30 事件 + 6 AI + 成就 + 音效', {
      fontSize: '12px', color: '#6a4a2a'
    });
  }

  startNewGame() {
    gameState = createNewGameState(this.selectedDifficulty);
    this.scene.start('MapScene');
  }

  loadGame() {
    try {
      const saved = JSON.parse(localStorage.getItem('fanzhen_save'));
      gameState = saved;
      this.scene.start('MapScene');
    } catch (e) {
      console.error('读档失败:', e);
      this.scene.start('MapScene');
    }
  }
}
