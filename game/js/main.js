/* ============================================================
 * 藩镇·裂土 - 游戏入口
 * ============================================================ */

const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 780,
  parent: 'game-container',
  backgroundColor: '#1a0e08',
  scene: [MenuScene, MapScene, BattleScene, EventScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

// 启动游戏
window.addEventListener('load', () => {
  const game = new Phaser.Game(config);

  // 防止右键菜单
  game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // 自动开始（用于测试或分享链接 ?autoplay=1）
  const params = new URLSearchParams(window.location.search);
  if (params.get('autoplay') === '1') {
    setTimeout(() => {
      gameState = createNewGameState();
      game.scene.start('MapScene');
    }, 500);
  }
});
