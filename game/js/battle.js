/* ============================================================
 * 藩镇·裂土 - 战斗系统
 * 2d6 + 军队加成 + 地形加成 + 异能
 * ============================================================ */

/**
 * 战斗解析（核心函数，纯函数，不修改外部状态）
 */
function resolveCombat(cfg) {
  const aPower = cfg.attackerArmy + (cfg.attackerElite || 0);
  const dPower = cfg.defenderArmy + (cfg.defenderElite || 0);

  const aRoll = 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6);
  const dRoll = 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6);

  const aArmyBonus = Math.min(4, Math.floor(aPower / 3));
  const dArmyBonus = Math.min(4, Math.floor(dPower / 3));
  const dTerrainBonus = TERRAIN_DEFENSE[cfg.defenderTerrain] || 0;

  // 玩家防御加成（成就 / 事件 buff）
  let playerDefBonus = 0;
  if (cfg.defenderFanzhenId && gameState.defBuff && gameState.defBuff[cfg.defenderFanzhenId]) {
    playerDefBonus += gameState.defBuff[cfg.defenderFanzhenId];
  }

  const aTotal = aRoll + aArmyBonus;
  const dTotal = dRoll + dArmyBonus + dTerrainBonus + playerDefBonus;

  let attackerWins = aTotal > dTotal;
  const diff = Math.abs(aTotal - dTotal);

  let attackerLoss, defenderLoss;
  if (attackerWins) {
    attackerLoss = Math.max(1, Math.ceil(diff / 2));
    defenderLoss = Math.ceil(diff / 1.5) + Math.floor(cfg.attackerArmy / 4);
    if (defenderLoss > cfg.defenderArmy) defenderLoss = cfg.defenderArmy;
  } else {
    defenderLoss = Math.max(0, Math.ceil(diff / 3));
    attackerLoss = Math.max(1, Math.ceil(diff / 2));
    if (attackerLoss > cfg.attackerArmy) attackerLoss = cfg.attackerArmy;
  }

  let outcome;
  if (aTotal === dTotal) outcome = '平局(守胜)';
  else if (attackerWins) outcome = '攻方胜';
  else outcome = '守方胜';

  return {
    attackerRoll: aRoll,
    defenderRoll: dRoll,
    attackerArmyBonus: aArmyBonus,
    defenderArmyBonus: dArmyBonus,
    defenderTerrainBonus: dTerrainBonus,
    attackerTotal: aTotal,
    defenderTotal: dTotal,
    attackerLoss,
    defenderLoss,
    defenderInitial: cfg.defenderArmy,
    attackerInitial: cfg.attackerArmy,
    attackerWins,
    outcome
  };
}

/**
 * 玩家发起攻击（带 UI 动画流程）
 */
function playerAttack(mapScene, fromId, toId) {
  const from = gameState.fanzhen[fromId];
  const to = gameState.fanzhen[toId];
  const fromData = getFanzhenData(fromId);
  const toData = getFanzhenData(toId);

  const commit = Math.max(1, from.army - 1);

  if (toData.terrain === 'water' && fromData.ability.name !== '越人水军') {
    mapScene.showToast('⚠️ 水域藩镇需要水军才能进攻！', '#ff5252');
    return false;
  }

  // 播放战斗音效
  SoundSystem.battleStart();

  const result = resolveCombat({
    attackerArmy: commit,
    attackerElite: from.elite || 0,
    attackerTerrain: fromData.terrain,
    defenderArmy: to.army,
    defenderElite: to.elite || 0,
    defenderTerrain: toData.terrain,
    defenderFanzhenId: toId
  });

  from.army -= commit;
  to.army -= result.defenderLoss;

  let logMsg = `🗡️ ${fromData.name}(${commit}) → ${toData.name}(${result.defenderInitial}) | ` +
               `骰 ${result.attackerRoll}+${result.attackerArmyBonus} vs ${result.defenderRoll}+${result.defenderArmyBonus}+${result.defenderTerrainBonus} = ${result.defenderTotal} | ${result.outcome}`;

  if (result.attackerWins || to.army <= 0) {
    const prevOwner = to.owner;
    to.owner = 'player';
    to.army = Math.max(1, commit - result.attackerLoss);
    to.elite = 0;

    // 统计战斗胜场
    if (gameState.stats) gameState.stats.battlesWon++;

    if (prevOwner.startsWith('ai')) {
      gameState.ai[prevOwner].owned = gameState.ai[prevOwner].owned.filter(id => id !== toId);
    }
    gameState.player.owned = (gameState.player.owned || [fromId]).filter(id => id !== toId);
    gameState.player.owned = gameState.player.owned.concat([toId]).filter((v, i, a) => a.indexOf(v) === i);

    logMsg += ` ✨ 占领成功！`;

    // 播放胜利音效
    setTimeout(() => SoundSystem.victory(), 200);
  } else {
    from.army += (commit - result.attackerLoss);
    logMsg += ` 💔 战败！损失 ${result.attackerLoss} 兵`;

    // 播放失败音效
    setTimeout(() => SoundSystem.defeat(), 200);
  }

  gameState.log.push(logMsg);
  gameState.player.ap--;

  mapScene.scene.launch('BattleScene', { result, fromData, toData });
  mapScene.scene.pause();

  // 检查成就（首战告捷等）
  if (gameState.stats && gameState.stats.battlesWon >= 1) {
    const newAch = AchievementSystem.check(gameState, 'battle');
    newAch.forEach(a => {
      // 在 MapScene 恢复后显示（避免和 BattleScene 冲突）
      setTimeout(() => {
        if (mapScene.scene.isActive('MapScene') || mapScene.scene.isPaused('MapScene')) {
          AchievementSystem.showUnlock(mapScene, a);
        }
      }, 3000);
    });
  }

  return true;
}

/* ============================================================
 * 藩镇·裂土 - 战斗动画场景
 * 2d6 投掷动画 + 结果展示
 * ============================================================ */

class BattleScene extends Phaser.Scene {
  constructor() { super('BattleScene'); }

  init(data) {
    this.result = data.result;
    this.fromData = data.fromData;
    this.toData = data.toData;
  }

  create() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    // 全屏暗背景
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x0a0505, 0.92)
      .setOrigin(0);

    // 标题
    this.add.text(cx, 60, '⚔️ 战 斗 结 算 ⚔️', {
      fontSize: '32px',
      color: '#f4d03f',
      fontStyle: 'bold',
      stroke: '#3d1a1a',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 攻方 vs 守方布局
    const yBattle = cy - 20;
    this.add.text(cx - 280, yBattle, this.fromData.icon + ' ' + this.fromData.name, {
      fontSize: '28px', color: '#4fc3f7', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(cx + 280, yBattle, this.toData.name + ' ' + this.toData.icon, {
      fontSize: '28px', color: '#e57373', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(cx, yBattle, '⚔️  vs  ⚔️', {
      fontSize: '28px', color: '#fff'
    }).setOrigin(0.5);

    // 攻方骰子
    this.attDice1 = this._drawDice(cx - 380, cy + 80, 1);
    this.attDice2 = this._drawDice(cx - 320, cy + 80, 1);

    // 守方骰子
    this.defDice1 = this._drawDice(cx + 320, cy + 80, 1);
    this.defDice2 = this._drawDice(cx + 380, cy + 80, 1);

    // 加成分解
    this.add.text(cx - 350, cy + 160,
      `骰 ${this.result.attackerRoll} + 兵 ${this.result.attackerArmyBonus} = ${this.result.attackerTotal}`,
      { fontSize: '14px', color: '#aaa' }).setOrigin(0.5);
    this.add.text(cx + 350, cy + 160,
      `骰 ${this.result.defenderRoll} + 兵 ${this.result.defenderArmyBonus} + 地 ${this.result.defenderTerrainBonus} = ${this.result.defenderTotal}`,
      { fontSize: '14px', color: '#aaa' }).setOrigin(0.5);

    // 开始骰子滚动动画
    this.time.delayedCall(800, () => this._rollDice());

    // 结果文本（先隐藏）
    this.resultText = this.add.text(cx, cy + 230, '', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#fff'
    }).setOrigin(0.5).setAlpha(0);

    // 关闭按钮
    this.closeBtn = this.add.text(cx, this.cameras.main.height - 50, '【 继续 】', {
      fontSize: '22px',
      color: '#1a0e08',
      backgroundColor: '#f4d03f',
      padding: { x: 30, y: 8 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

    this.closeBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume('MapScene');
    });
  }

  _drawDice(x, y, value) {
    const size = 56;
    const dice = this.add.rectangle(x, y, size, size, 0xfff8e1, 1);
    dice.setStrokeStyle(3, 0x3d2418);
    const text = this.add.text(x, y, '?', {
      fontSize: '32px',
      color: '#3d2418',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    return { rect: dice, text };
  }

  _setDice(dice, value) {
    dice.text.setText(String(value));
    // 骰子点数图案（小圆点）
    dice.rect.removeAllListeners();
  }

  _rollDice() {
    // 滚动效果：随机显示数字 500ms
    let ticks = 0;
    const ticker = this.time.addEvent({
      delay: 50,
      callback: () => {
        this.attDice1.text.setText(String(1 + Math.floor(Math.random() * 6)));
        this.attDice2.text.setText(String(1 + Math.floor(Math.random() * 6)));
        this.defDice1.text.setText(String(1 + Math.floor(Math.random() * 6)));
        this.defDice2.text.setText(String(1 + Math.floor(Math.random() * 6)));
        ticks++;
        // 抖动
        this.attDice1.rect.x += (Math.random() - 0.5) * 4;
        this.attDice2.rect.x += (Math.random() - 0.5) * 4;
        this.defDice1.rect.x += (Math.random() - 0.5) * 4;
        this.defDice2.rect.x += (Math.random() - 0.5) * 4;

        if (ticks > 15) {
          ticker.remove();
          this._showResult();
        }
      },
      loop: true
    });
  }

  _showResult() {
    // 设置最终值
    const aR1 = this._dieValue(this.result.attackerRoll);
    const aR2 = this.result.attackerRoll - aR1;
    const dR1 = this._dieValue(this.result.defenderRoll);
    const dR2 = this.result.defenderRoll - dR1;

    this.attDice1.text.setText(String(aR1));
    this.attDice2.text.setText(String(aR2));
    this.defDice1.text.setText(String(dR1));
    this.defDice2.text.setText(String(dR2));

    // 高亮胜方
    const winColor = this.result.attackerWins ? 0x4fc3f7 : 0xe57373;
    this.attDice1.rect.setFillStyle(winColor, 0.3);
    this.attDice2.rect.setFillStyle(winColor, 0.3);

    const loseColor = this.result.attackerWins ? 0xe57373 : 0x4fc3f7;
    this.defDice1.rect.setFillStyle(loseColor, 0.3);
    this.defDice2.rect.setFillStyle(loseColor, 0.3);

    // 结果文本
    let resultColor, resultMsg, detailMsg;
    if (this.result.attackerWins) {
      resultColor = '#4fc3f7';
      resultMsg = `🏆 攻 方 胜！`;
      detailMsg = `攻方损失 ${this.result.attackerLoss} 兵 · 守方损失 ${this.result.defenderLoss} 兵`;
    } else {
      resultColor = '#e57373';
      resultMsg = `💔 守 方 胜`;
      detailMsg = `攻方损失 ${this.result.attackerLoss} 兵 · 守方损失 ${this.result.defenderLoss} 兵`;
    }

    this.resultText.setText(resultMsg + '\n' + detailMsg);
    this.resultText.setColor(resultColor);

    this.tweens.add({
      targets: this.resultText,
      alpha: 1, scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.closeBtn,
          alpha: 1, duration: 300
        });
      }
    });

    // 闪屏效果
    this.cameras.main.flash(200, 255, 255, 255);
  }

  _dieValue(roll) {
    return 1 + Math.floor(Math.random() * Math.min(6, roll));
  }
}
