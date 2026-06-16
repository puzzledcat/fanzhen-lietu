/* ============================================================
 * 藩镇·裂土 - AI 系统
 * 4 个性格: aggressive/defensive/tricky/ruthless
 * 简化版决策: 优先募兵 → 优先招安 → 攻伐邻接最弱
 * ============================================================ */

const AISystem = {

  /**
   * AI 完整回合执行
   * @param {string} aiId - ai1/ai2/ai3/ai4
   * @param {object} state - gameState
   * @param {function} onLog - 日志回调 (msg, type)
   * @returns {object} { actions: [...], summary: '...' }
   */
  takeTurn(aiId, state, onLog = () => {}) {
    const personality = AI_PERSONALITIES[aiId];
    const aiState = state.ai[aiId];
    const log = [];
    const actions = [];

    // 重置 AP
    aiState.ap = 4;
    const startGold = aiState.gold;
    const startArmy = aiState.owned.reduce((s, id) => s + state.fanzhen[id].army, 0);

    // === 阶段1：税收 ===
    const taxGold = aiState.owned.length;
    aiState.gold += taxGold;
    log.push(`💰 ${AI_NAMES[aiId]} 收税 +${taxGold}金`);

    // 触发资源型异能（西羌+2/巴蜀+1/百越+1/齐+1）
    aiState.owned.forEach(id => {
      const data = getFanzhenData(id);
      if (!data) return;
      if (data.ability.name === '沙漠商路' || data.ability.name === '天府之国' || data.ability.name === '渔盐之利') {
        const bonus = data.ability.name === '沙漠商路' ? 2 : 1;
        aiState.gold += bonus;
        log.push(`🏛️ ${data.name} 异能 +${bonus}金`);
      }
    });

    // === 阶段2：募兵 ===
    const recruit = this._decideRecruit(personality, aiState, state, aiId);
    if (recruit) {
      log.push(`⚔️ ${recruit.message}`);
      actions.push(recruit);
    }

    // === 阶段3：策士（跳过以简化）===
    // === 阶段4：征伐 ===
    while (aiState.ap > 0) {
      const attack = this._decideAttack(personality, aiState, state, aiId);
      if (!attack) break;
      log.push(`🗡️ ${attack.message}`);
      actions.push(attack);
      aiState.ap--;
      if (attack.broke) break;
    }

    // === 阶段5：事件（简化：随机）===
    if (Math.random() < 0.4) {
      const event = this._randomEvent(state, aiId);
      if (event) {
        log.push(`🎴 ${event.message}`);
      }
    }

    return {
      actions,
      summary: log.join(' · '),
      startGold,
      startArmy,
      endGold: aiState.gold,
      endArmy: aiState.owned.reduce((s, id) => s + state.fanzhen[id].army, 0)
    };
  },

  _decideRecruit(personality, aiState, fullState, ownerId) {
    // 优先在兵力最少的己方藩镇募兵
    let weakest = null, minArmy = 999;
    fullState.owned.forEach(id => {
      const f = fullState.fanzhen[id];
      if (f.army < minArmy) {
        minArmy = f.army;
        weakest = id;
      }
    });
    if (!weakest) return null;

    // 募兵价格（不同藩镇不同）
    const data = getFanzhenData(weakest);
    let costPer3 = 2;
    let troopsPer3 = 3;
    if (data.ability.name === '草原骑兵') { costPer3 = 1; troopsPer3 = 3; }
    if (data.ability.name === '晋阳坚城') { costPer3 = 2; troopsPer3 = 4; }

    // 不同性格募兵阈值不同
    let threshold = personality === 'defensive' ? 8 : personality === 'ruthless' ? 4 : 5;
    if (minArmy >= threshold) return null;

    if (aiState.gold < costPer3) return null;
    aiState.gold -= costPer3;
    fullState.fanzhen[weakest].army += troopsPer3;
    return {
      message: `${AI_NAMES[ownerId]} 在 ${data.name} 募兵 +${troopsPer3}兵 (-${costPer3}金)`,
      kind: 'recruit'
    };
  },

  _decideAttack(personality, aiState, fullState, ownerId) {
    // 找到最佳攻击目标
    const candidates = [];

    fullState.owned.forEach(myId => {
      const myFz = fullState.fanzhen[myId];
      if (myFz.army < 2) return;

      getAdjacent(myId).forEach(targetId => {
        const target = fullState.fanzhen[targetId];
        if (target.owner === ownerId) return;
        // AI 一般不打玩家（除非 ruth）或相邻 AI
        if (target.owner === 'neutral' || target.owner.startsWith('ai')) {
          // 战力评估
          const myPower = myFz.army + this._terrainAtkBonus(myId);
          const theirPower = target.army + TERRAIN_DEFENSE[getFanzhenData(targetId).terrain] + this._defAbilBonus(targetId);
          const ratio = myPower / Math.max(1, theirPower);
          candidates.push({ from: myId, to: targetId, ratio, targetOwner: target.owner });
        }
      });
    });

    if (candidates.length === 0) return null;

    // 不同性格选择策略
    let chosen;
    if (personality === 'aggressive') {
      // 贪：优先攻玩家
      chosen = candidates.filter(c => c.targetOwner === 'player')
        .sort((a, b) => a.ratio - b.ratio)[0]  // 比值最小（最难打）优先
        || candidates.sort((a, b) => a.ratio - b.ratio)[0];
    } else if (personality === 'defensive') {
      // 稳：只打必胜的（ratio > 2）
      chosen = candidates.filter(c => c.ratio > 2 && c.targetOwner === 'neutral')
        .sort((a, b) => b.ratio - a.ratio)[0];
    } else if (personality === 'tricky') {
      // 诈：优先招安式攻击弱中立
      chosen = candidates.filter(c => c.targetOwner === 'neutral' && c.ratio > 1.5)
        .sort((a, b) => a.ratio - b.ratio)[0]
        || candidates.sort((a, b) => b.ratio - a.ratio)[0];
    } else {
      // 狠：攻击所有最弱的（不管是不是玩家）
      chosen = candidates.sort((a, b) => a.ratio - b.ratio)[0];
    }

    if (!chosen || chosen.ratio < 0.8) return null;  // 太冒险不打

    // 执行攻击
    return this._executeAttack(aiState, fullState, ownerId, chosen);
  },

  _executeAttack(aiState, fullState, ownerId, plan) {
    const from = fullState.fanzhen[plan.from];
    const to = fullState.fanzhen[plan.to];
    const fromData = getFanzhenData(plan.from);
    const toData = getFanzhenData(plan.to);

    // 投入兵力 = 全部 except 留 1
    const commit = Math.min(from.army - 1, 5);

    // 战斗
    const result = resolveCombat({
      attackerArmy: commit,
      attackerElite: from.elite || 0,
      attackerTerrain: fromData.terrain,
      defenderArmy: to.army,
      defenderElite: to.elite || 0,
      defenderTerrain: toData.terrain
    });

    // 应用结果
    from.army -= commit;  // 全部移走
    const attLoss = result.attackerLoss;
    from.army += (commit - attLoss);  // 战损后回归

    to.army -= result.defenderLoss;

    let msg = `${AI_NAMES[ownerId]}: ${fromData.name}→${toData.name} ` +
              `(${commit}vs${result.defenderInitial}) ${result.outcome}`;

    if (result.attackerWins) {
      // 占领
      to.owner = ownerId;
      to.army = Math.max(1, commit - attLoss);
      to.elite = 0;
      // 更新 AI 领地列表
      aiState.owned = aiState.owned.filter(id => id !== plan.to);
      aiState.owned.push(plan.to);
      msg += ` ✓占领`;
    } else if (to.army <= 0) {
      // 同上（防守方清零也算占领）
      to.owner = ownerId;
      to.army = 1;
      aiState.owned.push(plan.to);
      msg += ` ✓占领`;
    }

    return {
      message: msg,
      kind: 'attack',
      broke: result.attackerWins  // 占领后一般不再从这个方向打
    };
  },

  _terrainAtkBonus(id) {
    // 部分藩镇攻击加成
    const data = getFanzhenData(id);
    if (!data) return 0;
    if (data.ability.name === '突骑冲锋') return 1;
    return 0;
  },

  _defAbilBonus(id) {
    const data = getFanzhenData(id);
    if (!data) return 0;
    if (data.ability.name === '山地战' && data.terrain === 'mountain') return 1;
    if (data.ability.name === '山地猎手' && data.terrain === 'forest') return 2;
    if (data.ability.name === '雄关之固') return 2;
    // 鬼影伏兵需要 round ≥ 5
    if (data.ability.name === '鬼影伏兵') {
      // 找 gameState（可能存在于全局或者传入）
      const gs = (typeof gameState !== 'undefined') ? gameState : null;
      if (gs && gs.round >= 5) return 1;
    }
    return 0;
  },

  _randomEvent(state, ownerId) {
    // AI 触发好事件
    if (Math.random() < 0.5) {
      if (state.ai && state.ai[ownerId]) state.ai[ownerId].gold += 2;
      return { message: `🎁 ${AI_NAMES[ownerId]} 触发「商路开通」+2金` };
    }
    return null;
  }
};
