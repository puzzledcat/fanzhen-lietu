/* ============================================================
 * 藩镇·裂土 - 数据层
 * 24 藩镇 + 10 事件卡 + 全局常量
 * ============================================================ */

// ============ 24 藩镇 ============
// 4 行 × 6 列 网格布局，行从上到下：北 → 南
// 地形: plain(平原) forest(林地) mountain(山地) grassland(草原)
//       desert(沙漠) swamp(沼泽) pass(关隘) water(水域)

const FANZHEN_DATA = [
  // ===== Row 0: 北方（游牧/山地） =====
  { id: 'beidi',    name: '北狄',   terrain: 'grassland', icon: '🐎', row: 0, col: 0,
    ability: { name: '草原骑兵', desc: '募兵价减半：1金=3兵' }},
  { id: 'loufán',   name: '楼烦',   terrain: 'grassland', icon: '🐎', row: 0, col: 1,
    ability: { name: '联防草原', desc: '相邻草原藩镇+1防御' }},
  { id: 'shanrong', name: '山戎',   terrain: 'mountain',  icon: '⛰️', row: 0, col: 2,
    ability: { name: '山地战', desc: '山地战斗自身+1防御' }},
  { id: 'guifang',  name: '鬼方',   terrain: 'forest',    icon: '🌲', row: 0, col: 3,
    ability: { name: '鬼影伏兵', desc: '第5回合后防守+1' }},
  { id: 'quanrong', name: '犬戎',   terrain: 'mountain',  icon: '🐺', row: 0, col: 4,
    ability: { name: '野性反扑', desc: '被攻击时反击+1兵' }},
  { id: 'donghu',   name: '东胡',   terrain: 'grassland', icon: '🐎', row: 0, col: 5,
    ability: { name: '突骑冲锋', desc: '每回合首次攻击+1' }},

  // ===== Row 1: 西（沙漠/山地/关隘） =====
  { id: 'xiqiang',  name: '西羌',   terrain: 'desert',    icon: '🏜️', row: 1, col: 0,
    ability: { name: '沙漠商路', desc: '每回合自动+2金' }},
  { id: 'daxia',    name: '大夏',   terrain: 'grassland', icon: '🐴', row: 1, col: 1,
    ability: { name: '西域名将', desc: '1次/局 +3防御' }},
  { id: 'yiqu',     name: '义渠',   terrain: 'pass',      icon: '🏯', row: 1, col: 2,
    ability: { name: '雄关之固', desc: '关隘防御+2（共+4）' }},
  { id: 'yuezhi',   name: '月氏',   terrain: 'mountain',  icon: '⛰️', row: 1, col: 3,
    ability: { name: '骁勇', desc: '每回合首次攻击2兵即可' }},
  { id: 'bashu',    name: '巴蜀',   terrain: 'mountain',  icon: '🐼', row: 1, col: 4,
    ability: { name: '天府之国', desc: '每回合自动+1金' }},
  { id: 'sanmiao',  name: '三苗',   terrain: 'swamp',     icon: '🐸', row: 1, col: 5,
    ability: { name: '巫蛊之术', desc: '1次/局 强制对手重投' }},

  // ===== Row 2: 中原（关隘/平原/水） =====
  { id: 'shangqin', name: '上秦',   terrain: 'pass',      icon: '🏯', row: 2, col: 0,
    ability: { name: '关中四塞', desc: '相邻关隘+1防御' }},
  { id: 'luoyi',    name: '洛邑',   terrain: 'plain',     icon: '🏛️', row: 2, col: 1,
    ability: { name: '王城之路', desc: '可免费调度兵1次/回合' }},
  { id: 'zhou',     name: '周',     terrain: 'plain',     icon: '👑', row: 2, col: 2,
    ability: { name: '天下共主', desc: '每回合自动+1兵' }},
  { id: 'jin',      name: '晋',     terrain: 'plain',     icon: '⚔️', row: 2, col: 3,
    ability: { name: '晋阳坚城', desc: '募兵2金=4兵' }},
  { id: 'shanfa',   name: '善伐',   terrain: 'forest',    icon: '🌲', row: 2, col: 4,
    ability: { name: '山地猎手', desc: '林地战斗+2防御' }},
  { id: 'baiyue',   name: '百越',   terrain: 'water',     icon: '🌊', row: 2, col: 5,
    ability: { name: '渔盐之利', desc: '每回合+1金' }},

  // ===== Row 3: 南/东（水域/林） =====
  { id: 'nanman',   name: '南蛮',   terrain: 'forest',    icon: '🌴', row: 3, col: 0,
    ability: { name: '蛮兵', desc: '1次/局 攻占时多1兵' }},
  { id: 'chu',      name: '楚',     terrain: 'forest',    icon: '🐉', row: 3, col: 1,
    ability: { name: '荆楚之地', desc: '邻林地招安-1金' }},
  { id: 'yue',      name: '越',     terrain: 'water',     icon: '⛵', row: 3, col: 2,
    ability: { name: '越人水军', desc: '无视水域限制' }},
  { id: 'wu',       name: '吴',     terrain: 'water',     icon: '⛵', row: 3, col: 3,
    ability: { name: '江东水师', desc: '邻水域视为相邻' }},
  { id: 'lu',       name: '鲁',     terrain: 'plain',     icon: '📚', row: 3, col: 4,
    ability: { name: '礼乐之邦', desc: '每回合多抽1事件卡' }},
  { id: 'qi',       name: '齐',     terrain: 'plain',     icon: '🐟', row: 3, col: 5,
    ability: { name: '渔盐之利', desc: '每回合+1金' }},
];

// ============ 地形属性 ============
const TERRAIN_DEFENSE = {
  plain: 0, forest: 1, mountain: 1, grassland: 1,
  desert: 0, swamp: -1, pass: 2, water: 0
};

const TERRAIN_COLORS = {
  plain: 0xc8e6a0,     // 嫩绿
  forest: 0x6ab04c,    // 深绿
  mountain: 0xa1887f,  // 棕
  grassland: 0xaed581, // 黄绿
  desert: 0xffe082,    // 沙黄
  swamp: 0x558b2f,     // 暗绿
  pass: 0xe57373,      // 关隘红
  water: 0x4fc3f7      // 水蓝
};

const TERRAIN_COLORS_DARK = {
  plain: 0x8fa968, forest: 0x3e7d2a, mountain: 0x6d5247,
  grassland: 0x7ea05c, desert: 0xc9a847, swamp: 0x3e6821,
  pass: 0xa04040, water: 0x2a8bb8
};

const TERRAIN_NAMES = {
  plain: '平原', forest: '林地', mountain: '山地', grassland: '草原',
  desert: '沙漠', swamp: '沼泽', pass: '关隘', water: '水域'
};

// ============ 玩家颜色 ============
const PLAYER_COLORS = {
  player: 0x1976d2,   // 蓝色 - 玩家
  neutral: 0x757575,  // 灰色 - 中立
  ai1: 0xd32f2f,      // 红 - 贪狼军
  ai2: 0x7b1fa2,      // 紫 - 稳国
  ai3: 0xf57c00,      // 橙 - 诈王
  ai4: 0x388e3c,      // 绿 - 狠将
  ai5: 0xfbc02d,      // 金 - 财阀 (v2.0 新增)
  ai6: 0x90a4ae       // 灰 - 隐士 (v2.0 新增)
};

const AI_NAMES = {
  ai1: '贪狼军', ai2: '稳国', ai3: '诈王', ai4: '狠将',
  ai5: '财阀', ai6: '隐士'
};

const AI_SLOGANS = {
  ai1: '狼烟四起，问鼎中原！',
  ai2: '稳扎稳打，固若金汤。',
  ai3: '兵者，诡道也。',
  ai4: '杀！杀！杀！',
  ai5: '天下熙熙，皆为利来。',
  ai6: '静待天时。'
};

const AI_PERSONALITIES = {
  ai1: 'aggressive',  // 贪 - 多攻伐
  ai2: 'defensive',   // 稳 - 多募兵
  ai3: 'tricky',      // 诈 - 优先招安和地形
  ai4: 'ruthless',    // 狠 - 攻击最强对手
  ai5: 'wealthy',     // 富 - 优先经济型藩镇
  ai6: 'patient'      // 隐 - 前期发展，后期扩张
};

const AI_START_FANZHEN = {
  ai1: 'donghu',  ai2: 'luoyi',  ai3: 'yue',
  ai4: 'nanman',  ai5: 'bashu',  ai6: 'guifang'
};

// ============ 30 张事件卡 (v2.0) ============
// 字段说明:
//   needsSelection: 'own' | 'enemy' | 'neutral' | 'own_adjacent' | null
//   selectMode: 'fanzhen' | 'option' (option 用于「支付/损失」选择)

const EVENTS_DATA = [
  // ========== 好事件 - 资源类（5 张）==========
  { id: 'harvest', name: '🌾 丰收年', type: 'good',
    desc: '下个己方回合开始时 +2金',
    needsSelection: null,
    effect: (gs) => { gs.bonusGold = (gs.bonusGold||0) + 2; }},
  { id: 'trade', name: '🛣️ 商路开通', type: 'good',
    desc: '立即获得 +3金',
    needsSelection: null,
    effect: (gs) => { gs.gold += 3; }},
  { id: 'tax_relief', name: '📜 减免税赋', type: 'good',
    desc: '立即获得 +2金',
    needsSelection: null,
    effect: (gs) => { gs.gold += 2; }},
  { id: 'tribute_in', name: '💎 进贡', type: 'good',
    desc: '一个藩镇向你进贡 +4金',
    needsSelection: 'own',
    effect: (gs, targetId) => { gs.gold += 4; }},
  { id: 'gold_strike', name: '⛏️ 探明金矿', type: 'good',
    desc: '下 3 个己方回合 +1金/回合',
    needsSelection: null,
    effect: (gs) => { gs.goldBuff = (gs.goldBuff||0) + 3; }},

  // ========== 好事件 - 军事类（5 张）==========
  { id: 'hero', name: '🦸 名将投奔', type: 'good',
    desc: '选择一个己方藩镇放置 2 个精英兵（战力=普通兵2倍）',
    needsSelection: 'own',
    effect: (gs, targetId) => { gs.fanzhen[targetId].elite = (gs.fanzhen[targetId].elite||0) + 2; }},
  { id: 'reinforce', name: '🆘 救兵', type: 'good',
    desc: '选择一个己方藩镇获得 +3 普通兵',
    needsSelection: 'own',
    effect: (gs, targetId) => { gs.fanzhen[targetId].army += 3; }},
  { id: 'army_strong', name: '⚔️ 兵强马壮', type: 'good',
    desc: '所有己方藩镇 +1 兵',
    needsSelection: null,
    effect: (gs) => { gs.owned.forEach(id => { gs.fanzhen[id].army += 1; }); }},
  { id: 'recruit_great', name: '📚 招贤纳士', type: 'good',
    desc: '每控制 3 个藩镇获得 1 兵（随机分配）',
    needsSelection: null,
    effect: (gs) => {
      const bonus = Math.floor(gs.owned.length / 3);
      for (let i = 0; i < bonus; i++) {
        const id = gs.owned[Math.floor(Math.random() * gs.owned.length)];
        gs.fanzhen[id].army += 1;
      }
    }},
  { id: 'guard_post', name: '🏛️ 立祠', type: 'good',
    desc: '选择一个己方藩镇，该藩镇本局 +1 防御',
    needsSelection: 'own',
    effect: (gs, targetId) => {
      if (!gs.defBuff) gs.defBuff = {};
      gs.defBuff[targetId] = (gs.defBuff[targetId]||0) + 1;
    }},

  // ========== 好事件 - 特殊类（4 张）==========
  { id: 'omen', name: '🌟 天降祥瑞', type: 'good',
    desc: '所有己方藩镇各 +1 兵',
    needsSelection: null,
    effect: (gs) => { gs.owned.forEach(id => { gs.fanzhen[id].army += 1; }); }},
  { id: 'spy', name: '🕵️ 间谍', type: 'good',
    desc: '查看一个对手藩镇的兵力和金币',
    needsSelection: 'enemy',
    effect: (gs, targetId) => { /* UI 展示 */ }},
  { id: 'rebel_help', name: '⚔️ 蛮兵助战', type: 'good',
    desc: '选中立藩镇直接归顺（不消耗金）',
    needsSelection: 'neutral_adjacent',
    effect: (gs, targetId) => {
      gs.fanzhen[targetId].owner = 'player';
      gs.fanzhen[targetId].army = 2;
      gs.owned.push(targetId);
    }},
  { id: 'immigrate', name: '🏘️ 百姓归附', type: 'good',
    desc: '选择一个己方藩镇 +5 兵（代价 -2金）',
    needsSelection: 'own',
    effect: (gs, targetId) => { gs.fanzhen[targetId].army += 5; gs.gold = Math.max(0, gs.gold - 2); }},

  // ========== 坏事件 - 破坏类（6 张）==========
  { id: 'plague', name: '☠️ 瘟疫', type: 'bad',
    desc: '每个己方藩镇 -1 兵',
    needsSelection: null,
    effect: (gs) => { gs.owned.forEach(id => { gs.fanzhen[id].army = Math.max(0, gs.fanzhen[id].army - 1); }); }},
  { id: 'disaster', name: '🌋 天灾', type: 'bad',
    desc: '随机一个己方藩镇兵数减半（向下取整）',
    needsSelection: 'auto',
    effect: (gs) => {
      if (gs.owned.length === 0) return;
      const id = gs.owned[Math.floor(Math.random() * gs.owned.length)];
      gs.fanzhen[id].army = Math.floor(gs.fanzhen[id].army / 2);
    }},
  { id: 'rumor', name: '📢 谣言四起', type: 'bad',
    desc: '下个己方回合不能发起攻击',
    needsSelection: null,
    effect: (gs) => { gs.skipAttack = true; }},
  { id: 'tribute_pay', name: '💰 朝贡', type: 'bad',
    desc: '支付 3 金，否则所有己方藩镇 -1 兵',
    needsSelection: 'option',
    options: [
      { text: '支付 3 金', apply: (gs) => { gs.gold = Math.max(0, gs.gold - 3); }},
      { text: '拒绝（所有藩镇-1兵）', apply: (gs) => { gs.owned.forEach(id => { gs.fanzhen[id].army = Math.max(0, gs.fanzhen[id].army - 1); }); }}
    ]},
  { id: 'assassin', name: '🗡️ 刺客', type: 'bad',
    desc: '失去一个己方藩镇的 1 个精英兵',
    needsSelection: 'own',
    filter: (gs) => Object.values(gs.fanzhen).filter(f => f.owner === 'player' && (f.elite||0) > 0).map(f => f.id),
    effect: (gs, targetId) => { gs.fanzhen[targetId].elite = Math.max(0, (gs.fanzhen[targetId].elite||0) - 1); }},
  { id: 'betray', name: '🗡️ 谣言', type: 'bad',
    desc: '随机一个相邻敌方/中立藩镇 -2 兵',
    needsSelection: 'auto',
    effect: (gs) => {
      const candidates = [];
      gs.owned.forEach(myId => {
        getAdjacent(myId).forEach(adjId => {
          if (gs.fanzhen[adjId].owner.startsWith('ai') || gs.fanzhen[adjId].owner === 'neutral') {
            candidates.push(adjId);
          }
        });
      });
      if (candidates.length === 0) return;
      const id = candidates[Math.floor(Math.random() * candidates.length)];
      gs.fanzhen[id].army = Math.max(0, gs.fanzhen[id].army - 2);
    }},

  // ========== 坏事件 - 军事失败类（4 张）==========
  { id: 'mutiny', name: '💔 兵变', type: 'bad',
    desc: '随机一个兵力 ≥3 的己方藩镇 -2 兵',
    needsSelection: 'auto',
    effect: (gs) => {
      const candidates = gs.owned.filter(id => gs.fanzhen[id].army >= 3);
      if (candidates.length === 0) return;
      const id = candidates[Math.floor(Math.random() * candidates.length)];
      gs.fanzhen[id].army = Math.max(0, gs.fanzhen[id].army - 2);
    }},
  { id: 'famine', name: '🌫️ 饥荒', type: 'bad',
    desc: '失去 3 金，或每个藩镇 -1 兵',
    needsSelection: 'option',
    options: [
      { text: '支付 3 金', apply: (gs) => { gs.gold = Math.max(0, gs.gold - 3); }},
      { text: '粮仓空（-1兵/藩镇）', apply: (gs) => { gs.owned.forEach(id => { gs.fanzhen[id].army = Math.max(0, gs.fanzhen[id].army - 1); }); }}
    ]},
  { id: 'drought', name: '☀️ 旱灾', type: 'bad',
    desc: '所有己方藩镇 -1 兵',
    needsSelection: null,
    effect: (gs) => { gs.owned.forEach(id => { gs.fanzhen[id].army = Math.max(0, gs.fanzhen[id].army - 1); }); }},
  { id: 'flood', name: '🌊 水患', type: 'bad',
    desc: '所有己方水域藩镇 -2 兵',
    needsSelection: null,
    effect: (gs) => { gs.owned.forEach(id => {
      const data = FANZHEN_DATA.find(f => f.id === id);
      if (data && data.terrain === 'water') {
        gs.fanzhen[id].army = Math.max(0, gs.fanzhen[id].army - 2);
      }
    }); }},

  // ========== 坏事件 - 特殊类（2 张）==========
  { id: 'cold', name: '❄️ 寒潮', type: 'bad',
    desc: '下个己方回合不能募兵',
    needsSelection: null,
    effect: (gs) => { gs.skipRecruit = true; }},
  { id: 'sabotage', name: '🔥 破坏', type: 'bad',
    desc: '随机一个己方藩镇 -3 兵',
    needsSelection: 'auto',
    effect: (gs) => {
      if (gs.owned.length === 0) return;
      const id = gs.owned[Math.floor(Math.random() * gs.owned.length)];
      gs.fanzhen[id].army = Math.max(0, gs.fanzhen[id].army - 3);
    }},

  // ========== 补充事件 (4 张) ==========
  { id: 'flood_bad', name: '🌊 沉船', type: 'bad',
    desc: '所有己方水域藩镇 -2 兵',
    needsSelection: null,
    effect: (gs) => { gs.owned.forEach(id => {
      const data = FANZHEN_DATA.find(f => f.id === id);
      if (data && data.terrain === 'water') {
        gs.fanzhen[id].army = Math.max(0, gs.fanzhen[id].army - 2);
      }
    }); }},
  { id: 'mercenary', name: '🗡️ 招募雇佣兵', type: 'good',
    desc: '下 2 个己方回合，每回合一开始 +1 兵',
    needsSelection: null,
    effect: (gs) => { gs.armyBuff = (gs.armyBuff||0) + 2; }},
  { id: 'tech', name: '🛠️ 工匠奇技', type: 'good',
    desc: '选择一个己方关隘/山地藩镇，本局永久 +1 防御',
    needsSelection: 'own',
    filter: (gs) => gs.owned.filter(id => {
      const d = FANZHEN_DATA.find(f => f.id === id);
      return d && (d.terrain === 'pass' || d.terrain === 'mountain');
    }),
    effect: (gs, targetId) => {
      if (!gs.defBuff) gs.defBuff = {};
      gs.defBuff[targetId] = (gs.defBuff[targetId]||0) + 1;
    }},
  { id: 'fire', name: '🔥 火灾', type: 'bad',
    desc: '随机一个己方林地/草原藩镇 -2 兵',
    needsSelection: 'auto',
    effect: (gs) => {
      const candidates = gs.owned.filter(id => {
        const d = FANZHEN_DATA.find(f => f.id === id);
        return d && (d.terrain === 'forest' || d.terrain === 'grassland');
      });
      if (candidates.length === 0) return;
      const id = candidates[Math.floor(Math.random() * candidates.length)];
      gs.fanzhen[id].army = Math.max(0, gs.fanzhen[id].army - 2);
    }},
];

// ============ 玩家初始位置（4 个角）============
const PLAYER_START_FANZHEN = 'shangqin'; // 默认玩家从「上秦」起兵

// ============ Nemo专属彩蛋 ============
const PLAYER_NAME = 'Nemo';
const PLAYER_EASTER_EGG = {
  name: 'Nemo 的锦囊',
  desc: '1 次/局，任选一己方藩镇 +5 兵',
  used: false
};

// ============ 全局游戏状态模板 ============
function createNewGameState(difficulty = 'normal') {
  const diffConfig = AI_DIFFICULTY[difficulty] || AI_DIFFICULTY.normal;
  const fanzhen = {};
  FANZHEN_DATA.forEach(fz => {
    fanzhen[fz.id] = {
      id: fz.id,
      owner: 'neutral',
      army: 2,
      elite: 0,
      gold: 0,
      isHome: false
    };
  });

  // 玩家起始
  fanzhen[PLAYER_START_FANZHEN].owner = 'player';
  fanzhen[PLAYER_START_FANZHEN].army = 4;
  fanzhen[PLAYER_START_FANZHEN].isHome = true;

  // 6 个 AI 各占一个位置 (v2.0)
  const aiIds = ['ai1', 'ai2', 'ai3', 'ai4', 'ai5', 'ai6'];
  aiIds.forEach(aiId => {
    const startId = AI_START_FANZHEN[aiId];
    if (fanzhen[startId]) {
      fanzhen[startId].owner = aiId;
      fanzhen[startId].army = 3 + diffConfig.startBonus;
      fanzhen[startId].isHome = true;
    }
  });

  return {
    fanzhen,
    player: {
      gold: 4,
      ap: 5,
      maxAp: 5,
      fanzhenId: PLAYER_START_FANZHEN,
      bonusGold: 0,
      goldBuff: 0,
      skipAttack: false,
      skipRecruit: false,
      owned: [PLAYER_START_FANZHEN]
    },
    ai: aiIds.reduce((acc, id) => {
      acc[id] = {
        gold: 3,
        ap: 4,
        fanzhenId: AI_START_FANZHEN[id],
        owned: [AI_START_FANZHEN[id]],
        difficulty: difficulty
      };
      return acc;
    }, {}),
    round: 1,
    maxRound: 12,
    difficulty: difficulty,
    difficultyConfig: diffConfig,
    eventPending: null,
    currentEvent: null,
    easterEgg: { ...PLAYER_EASTER_EGG },
    achievements: [],
    stats: {
      battlesWon: 0,
      bribed: 0,
      peakGold: 0,
      easterEggUsed: false
    },
    log: ['🌟 Nemo踏上乱世之路！从「上秦」起兵，统一天下！'],
    isGameOver: false,
    winner: null,
    aiSlogansShown: false
  };
}

// ============ 12 个成就 (v2.0) ============
const ACHIEVEMENTS = [
  { id: 'first_battle', name: '🌱 初次上阵', desc: '完成第一局', icon: '🌱' },
  { id: 'first_win', name: '🩸 首战告捷', desc: '赢得第一场战斗', icon: '🩸' },
  { id: 'three_territory', name: '🏯 立足之地', desc: '控制 3 个藩镇', icon: '🏯' },
  { id: 'six_territory', name: '⚔️ 小有所成', desc: '控制 6 个藩镇', icon: '⚔️' },
  { id: 'ten_territory', name: '👑 雄霸一方', desc: '控制 10 个藩镇', icon: '👑' },
  { id: 'unify', name: '🏆 一统天下', desc: '控制 18+ 藩镇获胜', icon: '🏆' },
  { id: 'annihilator', name: '💀 歼灭者', desc: '灭掉至少 3 个 AI', icon: '💀' },
  { id: 'diplomat', name: '🤝 外交家', desc: '招安 5 个藩镇', icon: '🤝' },
  { id: 'tycoon', name: '💰 豪商', desc: '单回合金币超过 15', icon: '💰' },
  { id: 'trick', name: '🎁 锦囊妙计', desc: '使用「Nemo 的锦囊」获胜', icon: '🎁' },
  { id: 'comeback', name: '🌅 绝地翻盘', desc: '最后 3 回合内反超', icon: '🌅' },
  { id: 'speedrun', name: '🏅 速通大师', desc: '6 回合内获胜', icon: '🏅' },
];

// ============ AI 难度表 (v2.0) ============
const AI_DIFFICULTY = {
  easy: {
    name: '简单',
    desc: 'AI 50% 概率行动，决策随机',
    actionRate: 0.5,
    smartDecision: false,
    startBonus: 0  // 3兵
  },
  normal: {
    name: '普通',
    desc: 'AI 80% 概率行动，基础策略',
    actionRate: 0.8,
    smartDecision: true,
    startBonus: 0  // 3兵
  },
  hard: {
    name: '困难',
    desc: 'AI 100% 行动，深度评估，会联合',
    actionRate: 1.0,
    smartDecision: true,
    startBonus: 1  // 4兵
  }
};

// ============ 生涯统计 (v2.0) ============
const CAREER_KEY = 'fanzhen_career';

function getCareer() {
  try {
    return JSON.parse(localStorage.getItem(CAREER_KEY)) || {
      totalGames: 0,
      wins: 0,
      bestRound: null,
      longestStreak: 0,
      currentStreak: 0,
      totalOwned: 0,
      achievementsUnlocked: []
    };
  } catch (e) {
    return { totalGames: 0, wins: 0, bestRound: null, longestStreak: 0, currentStreak: 0, totalOwned: 0, achievementsUnlocked: [] };
  }
}

function saveCareer(career) {
  localStorage.setItem(CAREER_KEY, JSON.stringify(career));
}

function resetCareer() {
  localStorage.removeItem(CAREER_KEY);
}

// 当前活动游戏状态
let gameState = null;

// ============ 工具函数 ============
function getAdjacent(fanzhenId) {
  const fz = FANZHEN_DATA.find(f => f.id === fanzhenId);
  if (!fz) return [];
  const adjacent = [];
  // 上下左右 + 对角线（八连通）
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = fz.row + dr;
      const c = fz.col + dc;
      if (r >= 0 && r < 4 && c >= 0 && c < 6) {
        const neighbor = FANZHEN_DATA.find(f => f.row === r && f.col === c);
        if (neighbor) adjacent.push(neighbor.id);
      }
    }
  }
  return adjacent;
}

function getOwnedFanzhen(state, ownerId) {
  return Object.values(state.fanzhen).filter(f => f.owner === ownerId);
}

function getFanzhenById(state, id) {
  return state.fanzhen[id];
}

function getFanzhenData(id) {
  return FANZHEN_DATA.find(f => f.id === id);
}
