/* ============================================================
 * 藩镇·裂土 - 主地图场景
 * 核心循环：玩家行动 → 结束回合 → AI 行动 → 下一回合
 * ============================================================ */

class MapScene extends Phaser.Scene {
  constructor() { super('MapScene'); }

  create() {
    // 初始化玩家 owned 列表（如果不是新游戏）
    if (!gameState.player.owned) {
      gameState.player.owned = Object.values(gameState.fanzhen)
        .filter(f => f.owner === 'player')
        .map(f => f.id);
    }

    // 初始化音效
    SoundSystem.init();

    // === 顶部 HUD ===
    this._createHUD();

    // === 地图区域 ===
    this._createMap();

    // === 右侧信息面板 ===
    this._createInfoPanel();

    // === 底部动作面板 ===
    this._createActionPanel();

    // === 左侧日志 ===
    this._createLogPanel();

    // === 玩家专享：Nemo 锦囊按钮 ===
    this._createEasterEggButton();

    // === AI 开场宣言（仅第一回合） ===
    this._showAISlogansIfFirst();

    // === 自动检查胜利 ===
    this._checkVictoryOnStart();
  }

  _showAISlogansIfFirst() {
    if (gameState.round !== 1 || gameState.aiSlogansShown) return;
    gameState.aiSlogansShown = true;

    Object.keys(AI_NAMES).forEach(aiId => {
      if (gameState.ai[aiId].owned.length > 0) {
        this._addLog(`👤 ${AI_NAMES[aiId]}：「${AI_SLOGANS[aiId]}」`);
      }
    });
  }

  // ============ HUD ============
  _createHUD() {
    const w = this.cameras.main.width;

    // 顶部条
    this.add.rectangle(0, 0, w, 70, 0x1a0e08, 0.95).setOrigin(0).setStrokeStyle(2, 0x8a6a4a);

    // 玩家名
    this.add.text(20, 14, `🏯 ${PLAYER_NAME}`, {
      fontSize: '22px', color: '#f4d03f', fontStyle: 'bold'
    });

    // 龙兴之地
    const homeData = getFanzhenData(gameState.player.fanzhenId);
    this.add.text(20, 44, `龙兴：${homeData.icon} ${homeData.name}`, {
      fontSize: '13px', color: '#c8a25a'
    });

    // 金币 / AP / 回合
    this.goldText = this.add.text(w - 380, 14, `💰 金币：${gameState.player.gold}`, {
      fontSize: '20px', color: '#ffd54f', fontStyle: 'bold'
    });
    this.apText = this.add.text(w - 380, 44, `⚡ 行动点：${gameState.player.ap}/${gameState.player.maxAp}`, {
      fontSize: '14px', color: '#aed581'
    });
    this.roundText = this.add.text(w - 200, 14, `📅 第 ${gameState.round}/${gameState.maxRound} 回合`, {
      fontSize: '20px', color: '#fff'
    });

    // 存档/读档按钮
    this.add.text(w - 200, 44, '💾 自动存档中', {
      fontSize: '12px', color: '#8a6a4a'
    });

    // 退出按钮
    const quitBtn = this.add.text(w - 60, 25, '✕', {
      fontSize: '28px', color: '#aaa'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    quitBtn.on('pointerover', () => quitBtn.setColor('#f88'));
    quitBtn.on('pointerout', () => quitBtn.setColor('#aaa'));
    quitBtn.on('pointerdown', () => {
      if (confirm('返回主菜单？进度会自动保存。')) {
        this._saveGame();
        this.scene.start('MenuScene');
      }
    });
  }

  // ============ 地图 ============
  _createMap() {
    // 地图区域从 (0, 70) 开始，宽 ~900，高 ~700
    this.mapArea = { x: 0, y: 70, w: 920, h: 700 };
    const tileW = 140, tileH = 155;
    const startX = 60, startY = 100;

    this.tiles = {};  // fanzhenId -> { rect, name, icon, armyText, ownerBadge, fanzhen, hitArea }

    FANZHEN_DATA.forEach(fz => {
      const x = startX + fz.col * tileW;
      const y = startY + fz.row * tileH;
      const cx = x + tileW / 2;

      // 地形色块
      const rect = this.add.rectangle(x, y, tileW - 8, tileH - 8, TERRAIN_COLORS[fz.terrain]);
      rect.setStrokeStyle(2, 0x1a0e08);
      rect.setInteractive({ useHandCursor: true });

      // 地形标签（小）
      this.add.text(cx, y + 4, TERRAIN_NAMES[fz.terrain], {
        fontSize: '10px', color: '#3d2418', backgroundColor: '#fff8e1',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5);

      // 藩镇图标
      const iconText = this.add.text(cx, y - 35, fz.icon, {
        fontSize: '30px'
      }).setOrigin(0.5);

      // 藩镇名
      const nameText = this.add.text(cx, y - 5, fz.name, {
        fontSize: '16px', color: '#1a0e08', fontStyle: 'bold',
        stroke: '#fff8e1', strokeThickness: 2
      }).setOrigin(0.5);

      // 兵力数字
      const armyText = this.add.text(cx, y + 25, '', {
        fontSize: '18px', color: '#1a0e08', fontStyle: 'bold',
        backgroundColor: '#fff', padding: { x: 6, y: 2 }
      }).setOrigin(0.5);

      // 所属徽章（玩家/AI）
      const ownerBadge = this.add.text(cx, y + 55, '', {
        fontSize: '12px', color: '#fff',
        backgroundColor: '#666', padding: { x: 4, y: 2 }
      }).setOrigin(0.5);

      this.tiles[fz.id] = {
        rect, iconText, nameText, armyText, ownerBadge,
        fanzhen: fz
      };

      // 点击事件
      rect.on('pointerdown', () => this._onTileClick(fz.id));
      rect.on('pointerover', () => rect.setStrokeStyle(3, 0xf4d03f));
      rect.on('pointerout', () => rect.setStrokeStyle(2, 0x1a0e08));
    });

    this._refreshMap();
  }

  _refreshMap() {
    Object.keys(this.tiles).forEach(id => {
      const t = this.tiles[id];
      const fz = gameState.fanzhen[id];
      const data = t.fanzhen;

      // 兵力显示
      const armyStr = `⚔️${fz.army}` + (fz.elite ? `+${fz.elite}⭐` : '');
      t.armyText.setText(armyStr);

      // 所有者徽章
      let badgeText = '', badgeColor = '#666';
      if (fz.owner === 'player') { badgeText = 'Nemo'; badgeColor = '#1976d2'; }
      else if (fz.owner === 'neutral') { badgeText = '中立'; badgeColor = '#757575'; }
      else if (fz.owner.startsWith('ai')) {
        badgeText = AI_NAMES[fz.owner];
        badgeColor = '#' + PLAYER_COLORS[fz.owner].toString(16).padStart(6, '0');
      }
      t.ownerBadge.setText(badgeText);
      t.ownerBadge.setBackgroundColor(badgeColor);

      // 边框颜色提示归属
      const baseStroke = 0x1a0e08;
      let strokeColor = baseStroke;
      let strokeWidth = 2;
      if (fz.owner === 'player') { strokeColor = 0x4fc3f7; strokeWidth = 4; }
      else if (fz.owner.startsWith('ai')) { strokeColor = 0xff5252; strokeWidth = 3; }
      t.rect.setStrokeStyle(strokeWidth, strokeColor);
    });

    // 刷新 HUD
    this.goldText.setText(`💰 金币：${gameState.player.gold}`);
    this.apText.setText(`⚡ 行动点：${gameState.player.ap}/${gameState.player.maxAp}`);
    this.roundText.setText(`📅 第 ${gameState.round}/${gameState.maxRound} 回合`);
  }

  _onTileClick(fzId) {
    const fz = gameState.fanzhen[fzId];
    this.selectedTile = fzId;
    this._showTileInfo(fzId);
  }

  // ============ 右侧信息面板 ============
  _createInfoPanel() {
    const x = 940, y = 80, w = 240, h = 400;

    this.add.rectangle(x, y, w, h, 0x1a0e08, 0.85)
      .setOrigin(0).setStrokeStyle(2, 0x8a6a4a);

    this.add.text(x + 12, y + 8, '📜 藩镇详情', {
      fontSize: '18px', color: '#f4d03f', fontStyle: 'bold'
    });

    // 信息显示区
    this.infoPanelY = y + 50;
    this.infoText = this.add.text(x + 12, this.infoPanelY, '点击地图上的藩镇\n查看详细信息', {
      fontSize: '14px', color: '#c8a25a',
      wordWrap: { width: w - 24 }, lineSpacing: 4
    });
  }

  _showTileInfo(fzId) {
    const fz = gameState.fanzhen[fzId];
    const data = getFanzhenData(fzId);
    const x = 940, y = 80;

    let ownerText;
    if (fz.owner === 'player') ownerText = '🏯 Nemo';
    else if (fz.owner === 'neutral') ownerText = '⚪ 中立';
    else ownerText = `🎭 ${AI_NAMES[fz.owner]}`;

    const terrainDef = TERRAIN_DEFENSE[data.terrain];

    const text = `${data.icon} ${data.name}\n` +
                 `━━━━━━━━━━\n` +
                 `📍 地形：${TERRAIN_NAMES[data.terrain]} (${terrainDef >= 0 ? '+' : ''}${terrainDef}防)\n` +
                 `👑 归属：${ownerText}\n` +
                 `⚔️ 兵力：${fz.army}` + (fz.elite ? ` + ${fz.elite}⭐` : '') + `\n` +
                 `💰 金币：${fz.gold}\n` +
                 `━━━━━━━━━━\n` +
                 `🎯 异能：${data.ability.name}\n` +
                 `   ${data.ability.desc}`;

    this.infoText.setText(text);
  }

  // ============ 底部动作面板 ============
  _createActionPanel() {
    const x = 940, y = 500, w = 240, h = 200;

    this.add.rectangle(x, y, w, h, 0x1a0e08, 0.85)
      .setOrigin(0).setStrokeStyle(2, 0x8a6a4a);

    this.add.text(x + 12, y + 8, '⚙️ 动作', {
      fontSize: '18px', color: '#f4d03f', fontStyle: 'bold'
    });

    const btnY = y + 50;
    const btnStyle = { fontSize: '16px', color: '#fff', backgroundColor: '#5d3e1f',
                       padding: { x: 14, y: 6 }, fontStyle: 'bold' };
    const btnHover = { color: '#f4d03f', backgroundColor: '#8b4513' };

    // 募兵
    this.recruitBtn = this.add.text(x + 12, btnY, '【 募 兵 】', btnStyle)
      .setInteractive({ useHandCursor: true });
    this.recruitBtn.on('pointerover', () => this.recruitBtn.setStyle(btnHover));
    this.recruitBtn.on('pointerout', () => this.recruitBtn.setStyle(btnStyle));
    this.recruitBtn.on('pointerdown', () => this._onRecruit());

    // 攻伐
    this.attackBtn = this.add.text(x + 12, btnY + 50, '【 攻 伐 】', btnStyle)
      .setInteractive({ useHandCursor: true });
    this.attackBtn.on('pointerover', () => this.attackBtn.setStyle(btnHover));
    this.attackBtn.on('pointerout', () => this.attackBtn.setStyle(btnStyle));
    this.attackBtn.on('pointerdown', () => this._onAttackStart());

    // 招安（中立藩镇）
    this.bribeBtn = this.add.text(x + 130, btnY, '【 招 安 】', btnStyle)
      .setInteractive({ useHandCursor: true });
    this.bribeBtn.on('pointerover', () => this.bribeBtn.setStyle(btnHover));
    this.bribeBtn.on('pointerout', () => this.bribeBtn.setStyle(btnStyle));
    this.bribeBtn.on('pointerdown', () => this._onBribe());

    // 结束回合
    const endBtn = this.add.text(x + 12, btnY + 110, '【 结 束 回 合 】', {
      fontSize: '16px', color: '#1a0e08', backgroundColor: '#f4d03f',
      padding: { x: 14, y: 8 }, fontStyle: 'bold'
    }).setInteractive({ useHandCursor: true });
    endBtn.on('pointerover', () => endBtn.setStyle({ backgroundColor: '#fff' }));
    endBtn.on('pointerout', () => endBtn.setStyle({ backgroundColor: '#f4d03f' }));
    endBtn.on('pointerdown', () => this._onEndTurn());

    // 行动模式提示
    this.modeText = this.add.text(x + 12, btnY + 160, '点击藩镇选择动作', {
      fontSize: '12px', color: '#8a6a4a', fontStyle: 'italic'
    });

    this.actionMode = null;  // null | 'attack' | 'bribe' | 'recruit'
  }

  // ============ 左侧日志 ============
  _createLogPanel() {
    const x = 0, y = this.cameras.main.height - 100, w = 920, h = 100;

    this.add.rectangle(x, y, w, h, 0x1a0e08, 0.85)
      .setOrigin(0).setStrokeStyle(2, 0x8a6a4a);

    this.add.text(12, y + 6, '📜 战报', {
      fontSize: '14px', color: '#f4d03f', fontStyle: 'bold'
    });

    this.logText = this.add.text(12, y + 28, '', {
      fontSize: '12px', color: '#d4b896',
      wordWrap: { width: w - 24 }, lineSpacing: 3
    });

    this._refreshLog();
  }

  _refreshLog() {
    const recent = gameState.log.slice(-4).join('\n');
    this.logText.setText(recent);
  }

  _addLog(msg) {
    gameState.log.push(msg);
    if (gameState.log.length > 50) gameState.log = gameState.log.slice(-40);
    this._refreshLog();
  }

  // ============ Nemo锦囊 ============
  _createEasterEggButton() {
    if (gameState.easterEgg.used) return;

    // 放在右侧动作面板顶部（坐标固定）
    const btn = this.add.text(952, 460, '🎁 Nemo 的锦囊', {
      fontSize: '13px', color: '#ffd54f',
      backgroundColor: '#3d1a1a', padding: { x: 8, y: 4 },
      fontStyle: 'bold', stroke: '#ffd54f', strokeThickness: 1
    }).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#5d2a2a', color: '#fff' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#3d1a1a', color: '#ffd54f' }));
    btn.on('pointerdown', () => this._useEasterEgg());
  }

  _useEasterEgg() {
    if (gameState.easterEgg.used) {
      this.showToast('✨ 锦囊已用过啦', '#aaa');
      return;
    }
    if (gameState.player.owned.length === 0) {
      this.showToast('⚠️ 没有己方藩镇', '#ff5252');
      return;
    }
    if (gameState.player.ap < 1) {
      this.showToast('⚠️ 行动点不足', '#ff5252');
      return;
    }

    // 让玩家选一个己方藩镇 +5 兵
    this.actionMode = 'easterEgg';
    this.modeText.setText('🎁 选择己方藩镇 +5 兵').setColor('#ffd54f');
    this._addLog('🎁 「Nemo 的锦囊」：点击己方藩镇获得 +5 兵');
  }

  // ============ 动作：募兵 ============
  _onRecruit() {
    if (gameState.player.ap < 1) {
      this.showToast('⚠️ 行动点不足', '#ff5252');
      return;
    }
    if (gameState.player.skipRecruit) {
      this.showToast('⚠️ 寒潮袭来！本回合不能募兵', '#ff5252');
      return;
    }
    if (gameState.player.gold < 2) {
      this.showToast('⚠️ 金币不足（需2金）', '#ff5252');
      return;
    }

    this.actionMode = 'recruit';
    this.modeText.setText('⚔️ 募兵：点击己方藩镇（消耗2金+3兵）').setColor('#aed581');
  }

  _doRecruit(fzId) {
    const fz = gameState.fanzhen[fzId];
    if (fz.owner !== 'player') {
      this.showToast('⚠️ 只能在自己藩镇募兵', '#ff5252');
      return;
    }

    // 不同藩镇不同价格（基础 2 金 = 3 兵）
    const data = getFanzhenData(fzId);
    let cost = 2, troops = 3;
    if (data.ability.name === '草原骑兵') { cost = 1; troops = 3; }
    if (data.ability.name === '晋阳坚城') { cost = 2; troops = 4; }

    if (gameState.player.gold < cost) {
      this.showToast('⚠️ 金币不足', '#ff5252');
      return;
    }

    gameState.player.gold -= cost;
    fz.army += troops;
    gameState.player.ap--;
    SoundSystem.recruit();
    this._addLog(`⚔️ ${data.name} 募兵 +${troops} (${cost}金)`);
    this.showToast(`✓ ${data.name} +${troops}兵`, '#aed581');

    this._refreshMap();
    this._saveGame();
    // 检查成就（豪商）
    const newAch = AchievementSystem.check(gameState, 'recruit');
    newAch.forEach(a => AchievementSystem.showUnlock(this, a));
    this._checkVictory();
  }

  // ============ 动作：攻伐 ============
  _onAttackStart() {
    if (gameState.player.ap < 1) {
      this.showToast('⚠️ 行动点不足', '#ff5252');
      return;
    }
    if (gameState.player.skipAttack) {
      this.showToast('⚠️ 谣言四起，本回合无法攻击', '#ff5252');
      return;
    }
    this.actionMode = 'attack';
    this.modeText.setText('🗡️ 攻伐：点击相邻敌方/中立藩镇').setColor('#ff8a80');
  }

  _doAttack(targetId) {
    const target = gameState.fanzhen[targetId];
    const fromId = this._findNearestOwned(targetId);

    if (!fromId) {
      this.showToast('⚠️ 没有相邻的己方藩镇', '#ff5252');
      return;
    }
    if (target.owner === 'player') {
      this.showToast('⚠️ 不能攻击自己的藩镇', '#ff5252');
      return;
    }

    const from = gameState.fanzhen[fromId];
    if (from.army < 2) {
      this.showToast('⚠️ 兵力不足（需≥2兵）', '#ff5252');
      return;
    }

    // 触发战斗场景
    playerAttack(this, fromId, targetId);
    this._refreshMap();
    this._saveGame();
  }

  _findNearestOwned(targetId) {
    const adj = getAdjacent(targetId);
    for (const id of adj) {
      if (gameState.fanzhen[id].owner === 'player' && gameState.fanzhen[id].army >= 2) {
        return id;
      }
    }
    return null;
  }

  // ============ 动作：招安 ============
  _onBribe() {
    if (gameState.player.ap < 1) {
      this.showToast('⚠️ 行动点不足', '#ff5252');
      return;
    }
    if (gameState.player.gold < 3) {
      this.showToast('⚠️ 金币不足（需3金）', '#ff5252');
      return;
    }
    this.actionMode = 'bribe';
    this.modeText.setText('💰 招安：点击相邻中立藩镇（3金）').setColor('#ffd54f');
  }

  _doBribe(targetId) {
    const target = gameState.fanzhen[targetId];
    const fromId = this._findNearestOwned(targetId);
    if (!fromId) {
      this.showToast('⚠️ 没有相邻的己方藩镇', '#ff5252');
      return;
    }
    if (target.owner !== 'neutral') {
      this.showToast('⚠️ 只能招安中立藩镇', '#ff5252');
      return;
    }

    // 招安：3 金 + 掷骰（8+ 成功，6-7 部分，≤5 失败）
    gameState.player.gold -= 3;
    gameState.player.ap--;

    const roll = 2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6);
    const data = getFanzhenData(targetId);

    if (roll >= 8) {
      target.owner = 'player';
      target.army += 2;
      gameState.player.owned.push(targetId);
      gameState.stats.bribed++;
      SoundSystem.victory();
      this._addLog(`💰 招安成功！${data.name} 加入麾下 (+2兵)`);
      this.showToast(`✓ ${data.name} 归顺！`, '#aed581');
    } else if (roll >= 6) {
      target.owner = 'player';
      gameState.player.owned.push(targetId);
      gameState.stats.bribed++;
      SoundSystem.victory();
      this._addLog(`💰 招安成功！${data.name} 归顺（无增援）`);
      this.showToast(`✓ ${data.name} 归顺`, '#aed581');
    } else {
      SoundSystem.defeat();
      this._addLog(`💸 招安失败！${data.name} 拒绝 (骰=${roll})`);
      this.showToast(`✗ ${data.name} 拒绝 (骰=${roll})`, '#ff8a80');
    }

    this._refreshMap();
    this._saveGame();
    // 检查成就
    const newAch = AchievementSystem.check(gameState, 'bribe');
    newAch.forEach(a => AchievementSystem.showUnlock(this, a));
    this._checkVictory();
  }

  // ============ 统一处理点击 ============
  _handleActionClick(fzId) {
    if (!this.actionMode) return;
    const mode = this.actionMode;
    this.actionMode = null;
    this.modeText.setText('点击藩镇选择动作').setColor('#8a6a4a');

    if (mode === 'recruit') this._doRecruit(fzId);
    else if (mode === 'attack') this._doAttack(fzId);
    else if (mode === 'bribe') this._doBribe(fzId);
    else if (mode === 'easterEgg') this._doEasterEgg(fzId);
  }

  _doEasterEgg(fzId) {
    if (gameState.easterEgg.used) return;
    const fz = gameState.fanzhen[fzId];
    if (fz.owner !== 'player') {
      this.showToast('⚠️ 只能对自己的藩镇使用', '#ff5252');
      return;
    }
    const data = getFanzhenData(fzId);
    fz.army += 5;
    gameState.easterEgg.used = true;
    gameState.stats.easterEggUsed = true;
    gameState.player.ap--;
    SoundSystem.victory();
    this._addLog(`🎁 Nemo 的锦囊！${data.name} +5 兵`);
    this.showToast(`🎁 锦囊显灵！${data.name} +5 兵`, '#ffd54f');

    // 移除按钮
    this.children.list.filter(c => c.text === '🎁 Nemo 的锦囊').forEach(c => c.destroy());

    this._refreshMap();
    this._saveGame();
  }

  // 重写 _onTileClick 以分发到动作
  _onTileClick(fzId) {
    const fz = gameState.fanzhen[fzId];
    this.selectedTile = fzId;
    this._showTileInfo(fzId);

    // 优先处理事件选择
    if (this.eventSelectionMode) {
      this._handleEventSelectionClick(fzId);
      return;
    }

    if (this.actionMode) {
      this._handleActionClick(fzId);
    }
  }

  // ============ 事件选位置处理 (v2.0) ============
  _enterEventSelection(event) {
    this.eventSelectionMode = event;
    this.modeText.setText(`🎴 ${event.name}：点击地图选择`).setColor('#ffd54f');
    this._addLog(`🎴 ${event.name}：请点击 ${this._getSelectionHint(event)}`);
  }

  _getSelectionHint(event) {
    const need = event.needsSelection;
    if (need === 'own') return '一个己方藩镇';
    if (need === 'enemy') return '一个敌方藩镇';
    if (need === 'neutral' || need === 'neutral_adjacent') return '一个中立藩镇';
    return '一个目标藩镇';
  }

  _handleEventSelectionClick(fzId) {
    const event = this.eventSelectionMode;
    const fz = gameState.fanzhen[fzId];

    // 验证选择是否合法
    const need = event.needsSelection;
    let valid = false;
    if (need === 'own' && fz.owner === 'player') valid = true;
    else if (need === 'enemy' && fz.owner.startsWith('ai')) valid = true;
    else if (need === 'neutral' && fz.owner === 'neutral') valid = true;
    else if (need === 'neutral_adjacent') {
      if (fz.owner === 'neutral') {
        // 检查是否与玩家藩镇相邻
        const adj = getAdjacent(fzId);
        valid = adj.some(a => gameState.fanzhen[a].owner === 'player');
      }
    } else if (need === 'auto') {
      valid = true;
    }

    // 如果事件有 filter，使用它
    if (valid && event.filter) {
      const allowed = event.filter(gameState);
      if (allowed.length > 0 && !allowed.includes(fzId)) valid = false;
    }

    if (!valid) {
      this.showToast(`⚠️ 请选择${this._getSelectionHint(event)}`, '#ff5252');
      return;
    }

    // 应用效果
    if (event.id === 'spy') {
      // 间谍特殊：显示信息而非修改
      const data = getFanzhenData(fzId);
      this._addLog(`🕵️ 间谍报告：${data.name} 有 ${fz.army} 兵，金 ${fz.gold}`);
      this.showToast(`🕵️ ${data.name}: 兵 ${fz.army} / 金 ${fz.gold}`, '#4fc3f7');
    } else {
      event.effect(gameState, fzId);
      const data = getFanzhenData(fzId);
      this._addLog(`🎴 ${event.name} → ${data.name}`);
    }

    SoundSystem.coin();
    this.eventSelectionMode = null;
    this.modeText.setText('点击藩镇选择动作').setColor('#8a6a4a');
    this._refreshMap();
    this._saveGame();

    // 检查成就
    const newAch = AchievementSystem.check(gameState, event.id);
    newAch.forEach(a => AchievementSystem.showUnlock(this, a));
  }

  // ============ 结束回合 → AI 行动 ============
  _onEndTurn() {
    if (gameState.player.ap > 0 && !confirm('行动点未用完，确定结束回合？')) return;

    this._addLog('━━━━━━━━ 回合结束 ━━━━━━━━');
    gameState.player.ap = 0;

    // 玩家回合结束：触发事件卡（50% 概率）
    this._drawEvent();

    // 触发 AI
    this._aiTurn();

    // 进入下一回合
    gameState.round++;
    gameState.player.ap = gameState.player.maxAp;
    gameState.player.skipAttack = false;
    gameState.player.skipRecruit = false;
    gameState.player.bonusGold = 0;

    // 税收阶段
    let tax = gameState.player.owned.length;
    if (gameState.player.bonusGold) tax += gameState.player.bonusGold;
    if (gameState.player.goldBuff > 0) { tax += 1; gameState.player.goldBuff--; }
    gameState.player.gold += tax;
    if (gameState.player.gold > gameState.stats.peakGold) {
      gameState.stats.peakGold = gameState.player.gold;
    }

    // 触发资源型异能
    gameState.player.owned.forEach(id => {
      const data = getFanzhenData(id);
      if (!data) return;
      if (data.ability.name === '沙漠商路') gameState.player.gold += 2;
      if (data.ability.name === '天府之国') gameState.player.gold += 1;
      if (data.ability.name === '渔盐之利') gameState.player.gold += 1;
    });

    // 周：天下共主
    if (gameState.player.owned.includes('zhou')) {
      const zhou = gameState.fanzhen.zhou;
      if (zhou.owner === 'player') zhou.army += 1;
    }

    this._addLog(`📅 第${gameState.round}回合开始 | 收税 +${tax}金 | 💰${gameState.player.gold}`);

    // 检查成就
    const newAch = AchievementSystem.check(gameState, 'round_start');
    newAch.forEach(a => {
      this._addLog(`🏆 成就解锁：${a.icon} ${a.name}`);
      AchievementSystem.showUnlock(this, a);
    });

    // 检查胜负
    if (gameState.round > gameState.maxRound) {
      this._endGame();
      return;
    }

    this._refreshMap();
    this._saveGame();
  }

  _drawEvent() {
    // 50% 概率抽到事件卡
    if (Math.random() > 0.5) return;

    const event = EVENTS_DATA[Math.floor(Math.random() * EVENTS_DATA.length)];
    this._addLog(`🎴 事件：${event.name}`);
    SoundSystem.event();

    if (event.needsSelection === 'auto') {
      // 自动执行
      event.effect(gameState);
      this.showToast(`🎴 ${event.name}`, event.type === 'good' ? '#aed581' : '#ff8a80');
    } else {
      // 弹事件卡
      this.scene.launch('EventScene', {
        event,
        onComplete: () => {
          this.scene.resume();
        }
      });
      this.scene.pause();
    }
  }

  _aiTurn() {
    this._addLog('⚔️ AI 行动中...');
    const logEntries = [];

    const aiIds = ['ai1', 'ai2', 'ai3', 'ai4', 'ai5', 'ai6'];
    const diffConfig = gameState.difficultyConfig || AI_DIFFICULTY.normal;

    aiIds.forEach(aiId => {
      if (!gameState.ai[aiId] || gameState.ai[aiId].owned.length === 0) return;
      // 困难模式 100% 行动，简单模式 50% 概率
      if (Math.random() > diffConfig.actionRate) {
        logEntries.push(`${AI_NAMES[aiId]}: 休养中`);
        return;
      }
      // 注入 AI owned 到 gameState.player 临时用于 AI 函数
      const result = AISystem.takeTurn(aiId, {
        ...gameState,
        owned: gameState.ai[aiId].owned,
        gold: gameState.ai[aiId].gold,
        fanzhen: gameState.fanzhen
      });
      // 应用金币
      gameState.ai[aiId].gold = result.endGold;
      // 记录
      logEntries.push(`${AI_NAMES[aiId]}: ${result.summary}`);
    });

    logEntries.forEach(e => this._addLog(e));
  }

  // ============ 胜负判定 ============
  _checkVictoryOnStart() {
    // 启动时检查 AI 是否全灭
    const alive = ['ai1','ai2','ai3','ai4','ai5','ai6'].filter(id => gameState.ai[id] && gameState.ai[id].owned.length > 0);
    if (alive.length === 0) {
      gameState.isGameOver = true;
      gameState.winner = 'player';
    }
  }

  _checkVictory() {
    // 1. 玩家被灭
    if (gameState.player.owned.length === 0 && gameState.fanzhen[gameState.player.fanzhenId].owner !== 'player') {
      this._endGame();
      return;
    }
    // 2. AI 全灭
    const alive = ['ai1','ai2','ai3','ai4','ai5','ai6'].filter(id => gameState.ai[id] && gameState.ai[id].owned.length > 0);
    if (alive.length === 0) {
      this._endGame();
      return;
    }
    // 3. 控制 ≥13 个藩镇
    if (gameState.player.owned.length >= 13) {
      this._endGame();
    }
  }

  _endGame() {
    gameState.isGameOver = true;

    const owned = gameState.player.owned.length;
    let result;
    if (owned === 0) {
      gameState.winner = 'ai';
      result = { win: false, msg: '乱世未平，Nemo再战！' };
      SoundSystem.lose();
    } else if (owned >= 13) {
      gameState.winner = 'player';
      result = { win: true, msg: `🏆 Nemo统一天下！(${owned}藩镇)` };
      SoundSystem.triumph();
    } else {
      const aiMax = Math.max(...['ai1','ai2','ai3','ai4','ai5','ai6'].map(id => gameState.ai[id].owned.length));
      if (owned >= aiMax) {
        gameState.winner = 'player';
        result = { win: true, msg: `🏆 Nemo称霸！(占地${owned} vs AI最高${aiMax})` };
        SoundSystem.triumph();
      } else {
        gameState.winner = 'ai';
        result = { win: false, msg: `💔 乱世未平，Nemo再战！(占地${owned} vs AI最高${aiMax})` };
        SoundSystem.lose();
      }
    }

    // 检查最终成就
    const newAch = AchievementSystem.check(gameState, 'end');
    newAch.forEach(a => this._addLog(`🏆 成就解锁：${a.icon} ${a.name}`));

    // 更新生涯统计
    const career = AchievementSystem.updateCareer(gameState);

    this._addLog(`━━━━━━ 游戏结束 ━━━━━━`);
    this._addLog(result.msg);
    localStorage.removeItem('fanzhen_save');

    // 构建游戏结束卡片
    setTimeout(() => {
      const cx = this.cameras.main.width / 2;
      const cy = this.cameras.main.height / 2;

      const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x0a0505, 0.9)
        .setOrigin(0);

      const card = this.add.rectangle(cx, cy, 700, 500, 0x1a0e08, 0.95);
      card.setStrokeStyle(4, result.win ? 0xffd54f : 0xff5252);
      card.setScale(0);
      this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });

      this.add.text(cx, cy - 200, result.win ? '🏆 胜 利 🏆' : '💔 失 败 💔', {
        fontSize: '40px', color: result.win ? '#ffd54f' : '#ff8a80',
        fontStyle: 'bold', stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5);

      this.add.text(cx, cy - 150, result.msg, {
        fontSize: '18px', color: '#fff', align: 'center', wordWrap: { width: 600 }
      }).setOrigin(0.5);

      // 生涯统计
      const statsText = `生涯：${career.totalGames} 局 ${career.wins} 胜` +
        (career.bestRound ? ` · 最佳 ${career.bestRound} 回合` : '') +
        (career.longestStreak > 0 ? ` · 最长连胜 ${career.longestStreak}` : '');
      this.add.text(cx, cy - 90, statsText, {
        fontSize: '14px', color: '#c8a25a', fontStyle: 'italic'
      }).setOrigin(0.5);

      // 成就列表
      const achText = gameState.achievements.length > 0
        ? `本局成就：${gameState.achievements.length} / 12\n` +
          gameState.achievements.map(id => ACHIEVEMENTS.find(a => a.id === id).icon).join(' ')
        : '本局未解锁任何成就';
      this.add.text(cx, cy - 30, achText, {
        fontSize: '16px', color: '#aed581', align: 'center'
      }).setOrigin(0.5);

      // 全部解锁
      this.add.text(cx, cy + 50, `累计解锁：${career.achievementsUnlocked.length} / 12`, {
        fontSize: '14px', color: '#c8a25a'
      }).setOrigin(0.5);

      // 返回按钮
      const btn = this.add.text(cx, cy + 150, '【 返 回 主 菜 单 】', {
        fontSize: '24px', color: '#1a0e08',
        backgroundColor: '#f4d03f', padding: { x: 30, y: 12 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#fff', scale: 1.05 }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#f4d03f', scale: 1 }));
      btn.on('pointerdown', () => {
        this.scene.start('MenuScene');
      });
    }, 1000);
  }

  // ============ 存档 ============
  _saveGame() {
    try {
      localStorage.setItem('fanzhen_save', JSON.stringify(gameState));
    } catch (e) {
      console.warn('存档失败:', e);
    }
  }

  // ============ Toast 提示 ============
  showToast(msg, color = '#fff') {
    const w = this.cameras.main.width;
    const toast = this.add.text(w / 2, 90, msg, {
      fontSize: '20px',
      color: color,
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 16, y: 8 },
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: toast,
      alpha: 0, y: 60,
      duration: 1800,
      onComplete: () => toast.destroy()
    });
  }
}
