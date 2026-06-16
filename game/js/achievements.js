/* ============================================================
 * 藩镇·裂土 - 成就系统 (v2.0)
 * ============================================================ */

const AchievementSystem = {

  /**
   * 检查并解锁成就
   * @param {object} state - gameState
   * @param {string} triggerId - 触发检查的事件 ID
   * @returns {array} 新解锁的成就列表
   */
  check(state, triggerId = null) {
    const newUnlocks = [];
    const owned = state.player.owned.length;

    const checks = {
      first_battle: () => state.stats.battlesWon >= 1,
      first_win: () => state.stats.battlesWon >= 1,
      three_territory: () => owned >= 3,
      six_territory: () => owned >= 6,
      ten_territory: () => owned >= 10,
      unify: () => state.winner === 'player' && owned >= 13,
      annihilator: () => ['ai1','ai2','ai3','ai4','ai5','ai6'].filter(id => state.ai[id].owned.length === 0).length >= 3,
      diplomat: () => state.stats.bribed >= 5,
      tycoon: () => state.player.gold >= 15,
      trick: () => state.winner === 'player' && state.stats.easterEggUsed,
      comeback: () => state.winner === 'player' && state.round > 9 && state.maxRound - state.round < 3,
      speedrun: () => state.winner === 'player' && state.round <= 6
    };

    Object.keys(checks).forEach(id => {
      if (state.achievements.includes(id)) return;
      if (checks[id]()) {
        state.achievements.push(id);
        newUnlocks.push(ACHIEVEMENTS.find(a => a.id === id));
      }
    });

    return newUnlocks;
  },

  /**
   * 显示成就解锁提示（用于游戏中）
   */
  showUnlock(scene, achievement) {
    if (!achievement) return;
    const cx = scene.cameras.main.width / 2;
    const cy = 150;

    const bg = scene.add.rectangle(cx, cy, 360, 60, 0x3d2418, 0.95);
    bg.setStrokeStyle(2, 0xffd54f);

    const text = scene.add.text(cx, cy - 8, '🏆 成就解锁！', {
      fontSize: '16px', color: '#ffd54f', fontStyle: 'bold'
    }).setOrigin(0.5);

    const name = scene.add.text(cx, cy + 14, `${achievement.icon} ${achievement.name}`, {
      fontSize: '18px', color: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);

    [bg, text, name].forEach(o => o.setAlpha(0));

    scene.tweens.add({
      targets: [bg, text, name],
      alpha: 1, y: '-=10',
      duration: 500, ease: 'Back.easeOut',
      onComplete: () => {
        scene.time.delayedCall(2500, () => {
          scene.tweens.add({
            targets: [bg, text, name],
            alpha: 0, y: '-=30',
            duration: 500,
            onComplete: () => { bg.destroy(); text.destroy(); name.destroy(); }
          });
        });
      }
    });
  },

  /**
   * 游戏结束后更新生涯统计
   */
  updateCareer(state) {
    const career = getCareer();
    career.totalGames++;
    if (state.winner === 'player') {
      career.wins++;
      career.currentStreak++;
      if (career.currentStreak > career.longestStreak) {
        career.longestStreak = career.currentStreak;
      }
    } else {
      career.currentStreak = 0;
    }
    if (state.winner === 'player' && (career.bestRound === null || state.round < career.bestRound)) {
      career.bestRound = state.round;
    }
    career.totalOwned += state.player.owned.length;
    // 合并新解锁的成就
    state.achievements.forEach(id => {
      if (!career.achievementsUnlocked.includes(id)) {
        career.achievementsUnlocked.push(id);
      }
    });
    saveCareer(career);
    return career;
  }
};
