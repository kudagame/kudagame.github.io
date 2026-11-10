// 寵物系統資料表（正式版也會用；這個檔案不能引用任何測試工具）
'use strict';
window.PET = window.PET || {};
(function (P) {
  P.VERSION = 'P4.4';
  // 功能開關：大會（報名、會場、獎牌室、傳說之證）留到下一版，0＝玩家看不到；程式都還在，改成 1 就打開
  P.FEAT = Object.assign({ cup: 1 }, P.FEAT || {});   // P5：大會正式打開
  // 位階：0 成年素體、1 藍、2 紫、3 粉、4 橘
  P.TIERS = ['adult', 'blue', 'purple', 'pink', 'orange'];
  P.TIER_NAME = ['成年', '藍', '紫', '粉', '橘'];
  P.TIER_COLOR = ['#8fbf7a', '#5aa0ff', '#b070ff', '#ff7fc0', '#ff8c14'];
  P.PERS = ['活潑', '溫和', '貪吃', '愛睡', '好奇'];
  P.HEROES = ['苦達斯', '尋歡作樂', '三杯兔子'];
  P.SPOTS = ['頭', '下巴', '肚子', '背'];
  P.QUAL = ['C', 'B', 'A', 'S'];
  P.QUAL_MUL = [0.97, 1.0, 1.02, 1.03];
  // 物種（dirs：美術資料夾候選名；hue/sat：還沒有自己的圖時，用西施犬圖換色當暫用圖）
  P.SPECIES = [
    { id: 'cat', name: '貓', emo: '🐱', shiny: { h: 200, s: 0.9, gh: 215, gs: 0.30, l: 0.02, nm: '月影星彩' }, dirs: ['cat_v3', 'cat', 'kitty'], hue: 25, sat: 1.1, looks: ['雙色毛貓', '三色貓', '棕色貓', '燕尾服貓'], inh: ['招財貓步', '金幣 +3/4/5%'] },
    { id: 'retriever', name: '獵犬', emo: '🐕', shiny: { h: -38, s: 0.75, gh: 30, gs: 0.18, l: 0.10, nm: '霜白星彩' }, dirs: ['hound_v3', 'retriever', 'hound', 'dog'], hue: 40, sat: 1.3, looks: ['黃金獵犬', '黑色獵犬', '深棕色獵犬', '白色獵犬'], inh: ['追蹤', '追擊機率 +2/3/4%'] },
    { id: 'bear', name: '小熊', emo: '🐻', shiny: { h: 165, s: 0.8, gh: 180, gs: 0.25, l: 0.04, nm: '苔綠星彩' }, dirs: ['bear_v3', 'bear', 'cub'], hue: -10, sat: 0.7, looks: ['灰色小熊', '棕色小熊', '黑色小熊', '白色小熊'], inh: ['熊抱', 'HP<50% 受到傷害 −3/4/5%'] },
    { id: 'fox', name: '小狐狸', emo: '🦊', shiny: { h: 185, s: 0.8, gh: 200, gs: 0.30, l: 0.04, nm: '夜藍星彩' }, dirs: ['fox_v3', 'fox'], hue: 15, sat: 1.6, looks: ['淺棕色小狐狸', '棕色小狐狸', '白色小狐狸', '黑色小狐狸'], inh: ['狐火', '普攻附帶灼傷 20/25/30%'] },
    { id: 'pomeranian', name: '博美犬', emo: '🐶', shiny: { h: 300, s: 1.2, gh: 320, gs: 0.35, l: 0.04, nm: '櫻粉星彩' }, dirs: ['pomeranian_v3', 'pomeranian', 'pom'], hue: 30, sat: 0.4, looks: ['銀灰色博美犬', '黑色博美犬', '黑棕博美犬', '棕色博美犬'], inh: ['究極的應援', '絕招量表 +4/5/6%'] },
    { id: 'rabbit', name: '兔子', emo: '🐰', shiny: { h: 230, s: 1.0, gh: 260, gs: 0.30, l: 0.02, nm: '紫藤星彩' }, dirs: ['rabbit_v3', 'rabbit', 'bunny'], hue: -30, sat: 0.6, looks: ['棕色兔子', '灰色兔子', '斑點兔子', '白兔子'], inh: ['跳跳', '閃避 +1/1.5/2%'] },
    { id: 'raccoon', name: '浣熊', emo: '🦝', shiny: { h: 25, s: 2.2, gh: 30, gs: 0.45, l: 0.03, nm: '蜜金星彩' }, dirs: ['raccoon_v3', 'raccoon'], hue: 200, sat: 0.35, looks: ['灰色浣熊', '深棕浣熊', '淺棕浣熊', '淺灰色浣熊'], inh: ['翻箱倒櫃', '木箱與寶箱額外掉落 +10/15/20%'] },
    { id: 'wolf', name: '小狼', emo: '🐺', shiny: { h: 150, s: 1.6, gh: 40, gs: 0.45, l: 0.05, nm: '琥珀星彩' }, dirs: ['wolf_v3', 'wolf', 'wolfpup', 'pup', 'puppy_wolf'], hue: 190, sat: 0.5, looks: ['深灰色小狼', '青灰色小狼', '白色小狼', '黑色小狼'], inh: ['狼嚎', '每 20 秒主角攻擊 +3/4/5%'] },
    { id: 'owl', name: '小貓頭鷹', emo: '🦉', shiny: { h: 180, s: 1.1, gh: 190, gs: 0.30, l: 0.03, nm: '雪青星彩' }, dirs: ['owl_v3', 'owl'], hue: 60, sat: 0.8, looks: ['灰棕色小貓頭鷹', '灰色小貓頭鷹', '棕色小貓頭鷹', '白色小貓頭鷹'], inh: ['慧眼', '暴擊率 +1.5/2/2.5%'] },
    { id: 'shihtzu', name: '西施犬', emo: '🐩', shiny: { h: 160, s: 1.0, gh: 175, gs: 0.30, l: 0.02, nm: '薄荷星彩' }, dirs: ['shihtzu_v3', 'shihtzu'], hue: 0, sat: 1, looks: ['棕色西施犬', '白色西施犬', '灰色西施犬', '淺棕色西施犬'], inh: ['小泡泡', '主角 HP≤1/2 時 10 秒回 30/40/50% HP'] },
  ];
  P.SP = {}; P.SPECIES.forEach(s => P.SP[s.id] = s);
  const S = (n, name, cat, tier, w, cd, sp, desc, impl) => ({ n, name, cat, tier, w, cd, sp: sp ? sp.split(',') : [], desc, impl: !!impl });
  // cat：elem 元素、hit 打擊、buff 應援、debuff 弱化、passive 被動、pick 撿東西類、util 輔助、survive 生存、funA 輔助有趣、funB 實用有趣、spc 物種專屬、func 功能
  P.SKILLS = [
    S(1, '火焰的玩笑', 'elem', 1, 10, 10, '', '命中 50%P＋灼傷 5 秒共 90%P', 1),
    S(2, '嚴寒的憤怒', 'elem', 1, 10, 10, '', '命中 50%P＋緩速 20% 2 秒，5 秒共 60%P', 1),
    S(3, '雷霆的歡呼', 'elem', 1, 10, 10, '', '命中 50%P＋觸電 5 秒共 60%P', 1),
    S(4, '刺痛的獠牙', 'elem', 1, 10, 10, '', '命中 50%P＋出血 5 秒共 90%P', 1),
    S(5, '猛毒感染', 'elem', 2, 6, 6, '', '命中 40%P＋中毒 5 秒共 40%P，可疊 3 層', 1),
    S(6, '濃厚的陰影', 'elem', 2, 6, 12, '', '命中 50%P＋小怪逃跑 0.8 秒；王攻擊 −3% 3 秒', 1),
    S(7, '天上之光', 'elem', 2, 6, 12, '', '命中 50%P＋主角下一下打這個目標 +15%', 1),
    S(8, '突擊', 'hit', 1, 10, 4, '', '衝過去 80%P，小怪擊退', 1),
    S(9, '魔力飛彈', 'hit', 1, 10, 8, '', '遠程 130%P', 1),
    S(10, '魔力連結飛彈', 'hit', 2, 6, 20, '', '最多 3 個目標，各 3 發 × 30%P', 1),
    S(11, '有力的應援', 'buff', 1, 8, 20, '', '攻擊力 +3%，8 秒', 1),
    S(12, '聰明的應援', 'buff', 1, 8, 20, '', '技能傷害 +4%，8 秒', 1),
    S(13, '暴擊的祝福', 'buff', 1, 8, 20, '', '暴擊率 +3%，8 秒', 1),
    S(14, '到位的應援', 'buff', 2, 6, 20, '', '暴擊傷害 +8%，8 秒', 1),
    S(15, '傷害減少的祝福', 'buff', 1, 8, 20, '', '受到傷害 −4%，8 秒', 1),
    S(16, '要害迴避的祝福', 'buff', 2, 6, 20, '', '閃避 +3%，8 秒', 1),
    S(17, '追擊的祝福', 'buff', 2, 6, 20, '', '追擊機率 +3%，8 秒', 1),
    S(18, '連擊強化的祝福', 'buff', 2, 6, 20, '', '連擊傷害 +5%，8 秒', 1),
    S(19, '絕招的祝福', 'buff', 3, 3, 40, '', '絕招量表 +4%', 1),
    S(20, '攻擊力減弱詛咒', 'debuff', 2, 4, 15, '', '目標攻擊 −8%（王 −5%），4 秒', 1),
    S(21, '防禦力減弱詛咒', 'debuff', 2, 4, 15, '', '目標受到傷害 +6%（王 +4%），4 秒', 1),
    S(22, '反射神經', 'passive', 2, 4, 0, '', '寵物技能冷卻 −15%', 1),
    S(23, '野性的本能', 'passive', 2, 4, 0, '', '寵物攻擊 20% 機率暴擊 ×1.5', 1),
    S(24, '撿撿', 'pick', 1, 8, 0, '', '自動撿 300px 內的金幣、麵包', 1),
    S(25, '麵包嗅覺', 'pick', 1, 6, 0, '', '食物掉落 ×1.1；每 30 秒 15% 挖出麵包', 1),
    S(26, '木箱破壞王', 'pick', 1, 6, 0, '', '木箱 1 下就破，多擲 1 次掉落', 0),
    S(27, '挑釁吠叫', 'util', 2, 4, 18, '', '附近小怪 3 秒改追寵物；王無效', 1),
    S(28, '破防啃咬', 'util', 2, 4, 15, '', '王破防條 +2%（每場上限 20%）', 0),
    S(29, '守護泡泡・吸收', 'survive', 3, 2, 25, '', '吸收下一次傷害（最多最大 HP 25%），6 秒', 1),
    S(30, '蜜糖之家的羈絆', 'survive', 3, 2, 0, '', '每關 1 次：HP≤30% 西施跑來 5 秒回 20%', 1),
    S(31, '起來呀！', 'survive', 4, 1, 0, '', '每關 1 次：倒下時以 25% HP 爬起來', 1),
    S(32, '吱吱變鼠術', 'funA', 2, 3, 50, 'owl,cat,fox', '小怪永久變老鼠，打死必掉麵包；菁英 6 秒；王 5 秒', 1),
    S(33, '黏黏泡泡', 'funA', 2, 4, 22, 'shihtzu,pomeranian,rabbit', '黏液區：小怪黏住 3 秒；王只黏腳 1.5 秒', 1),
    S(34, '一起跳舞吧', 'funA', 2, 4, 25, 'bear,pomeranian,rabbit', '前方小怪跳舞 2.5 秒；王攻擊 −3%', 1),
    S(35, '換個位置', 'funA', 1, 4, 16, 'owl,fox', '跟最遠的遠程小怪換位置，牠暈 0.8 秒', 1),
    S(36, '香蕉皮大作戰', 'funA', 1, 6, 14, 'raccoon,pomeranian,bear', '丟 3 片香蕉皮，踩到滑倒 1.2 秒', 1),
    S(37, '抖抖口袋', 'funA', 1, 6, 10, 'raccoon,cat', '搔癢小怪掉金幣＋25% 麵包', 1),
    S(38, '毛線纏纏', 'funA', 2, 4, 18, 'cat,fox', '2 隻小怪綁在一起 5 秒，分傷 30%', 1),
    S(39, '縮小光線', 'funA', 2, 3, 24, 'owl', '小怪縮成 60%，攻擊 −30%，6 秒', 1),
    S(40, '搖籃曲', 'funA', 2, 4, 30, 'owl,bear,shihtzu', '小怪睡 4 秒，被打醒那下 +20%', 1),
    S(41, '鏡子惡作劇', 'funA', 3, 2, 28, 'wolf,raccoon', '（延後）小怪打同伴', 0),
    S(42, '超大聲汪！', 'funA', 1, 5, 20, 'pomeranian,retriever,wolf', '所有小怪往後彈 220px＋轉圈 1 秒', 1),
    S(43, '躲貓貓', 'funA', 3, 2, 35, 'cat', '紙箱罩住主角 1.5 秒，小怪找不到', 1),
    S(44, '小豬存錢筒', 'funB', 3, 3, 45, 'pomeranian,bear,raccoon,shihtzu', '小怪永久變小豬，打死必掉麵包＋金幣 ×2；王 5 秒', 1),
    S(45, '泡泡浮浮', 'funB', 2, 4, 20, 'shihtzu,rabbit', '包進泡泡浮 4 秒；打破 +60% 必暴擊', 1),
    S(46, '咕咕雞炸彈', 'funB', 3, 3, 30, 'fox,retriever', '小怪變小雞衝回同伴爆炸 200%P', 1),
    S(47, '肉骨頭誘餌', 'funB', 2, 5, 22, 'retriever,wolf', '小怪 3 秒衝去搶骨頭', 1),
    S(48, '順手牽羊', 'funB', 2, 4, 25, 'cat,raccoon', '偷強化／金幣，主角攻擊 +5% 8 秒', 1),
    S(49, '天降平底鍋', 'funB', 1, 6, 15, 'raccoon,bear', '平底鍋 120%P＋暈 2 秒', 1),
    S(50, '滾滾雪球', 'funB', 2, 5, 18, 'bear,rabbit', '雪球直線衝過 180%P＋擊退', 1),
    S(51, '巨大化', 'funB', 3, 2, 45, 'bear,retriever,wolf', '寵物變大 2 倍 6 秒，踩地震倒小怪', 1),
    S(52, '加油便當', 'funB', 2, 4, 60, 'pomeranian,shihtzu,rabbit', '每 60 秒 40% 叼麵包進食物槽（每關 2 個）', 1),
    S(53, '狐火分身', 'funB', 4, 1, 40, 'fox', '2 個狐火分身各放 1 次元素技能（40%）', 1),
    S(54, '招財大爆擊', 'funB', 3, 2, 0, 'cat,raccoon', '暴擊殺小怪 20% 噴金幣雨', 1),
    S(55, '小小守護者', 'spc', 2, 6, 60, 'shihtzu', 'HP≤50%：8 秒護盾吸收 10%（S 15%）', 1),
    S(56, '疾風的振翅', 'spc', 2, 6, 30, 'owl', '5 秒出手速度 +6%（S 8%）', 1),
    S(57, '破防咆哮', 'spc', 2, 6, 8, 'wolf', '破防／破綻時主角傷害 +2%（S 3%）', 0),
    S(58, '不屈的韻味', 'spc', 2, 6, 15, 'raccoon', '被擊倒或一下 ≥20%：受傷 −4% 4 秒', 1),
    S(59, '恢復的祈願', 'spc', 2, 6, 10, 'rabbit', '被擊倒時回 2% HP（S 3%）', 1),
    S(60, '元素淨化', 'spc', 2, 6, 30, 'fox', '解除灼傷／中毒／出血', 0),
    S(61, '鬥志爆發', 'spc', 2, 6, 15, 'bear', '被擊倒時寵物攻擊 +15% 6 秒', 1),
    S(62, '空隙突襲', 'spc', 2, 6, 8, 'retriever', '破防／破綻時撲咬 120%P', 0),
    S(63, '不許動', 'spc', 2, 6, 10, 'cat', '目標移動 −15%（王 −8%），4 秒', 1),
    S(64, '糧食嗅覺', 'func', 1, 5, 0, 'pomeranian,shihtzu', '小怪掉麵包 +3/5/7/9%', 1),
    S(65, '尋寶鼻', 'func', 1, 4, 0, 'retriever,raccoon', '裝備掉落率 +4/6/8/10%', 0),
    S(66, '刻印感應', 'func', 1, 3, 0, 'fox,owl', '菁英 3~6% 多掉 1 片刻印碎片', 1),
    S(67, '招財貓爪', 'func', 1, 5, 0, 'cat,raccoon', '小怪金幣 +4/6/8/10%', 1),
    S(68, '疾風腳步', 'func', 1, 5, 0, 'rabbit,wolf', '主角移動速度 +2/3/4/5%', 1),
    S(69, '學習夥伴', 'func', 1, 5, 0, 'owl,bear', '經驗 +3/4/6/8%', 1),
    S(70, '拆箱小能手', 'func', 1, 4, 0, 'bear,raccoon', '每關木箱 +1/+1/+2/+2', 0),
    S(71, '叼回來', 'func', 1, 6, 0, 'retriever,pomeranian', '自動撿範圍 +60/90/120/150px', 1),
  ];
  P.SK = {}; P.SKILLS.forEach(s => P.SK[s.n] = s);
  P.CAT_NAME = { elem: '元素', hit: '打擊', buff: '應援', debuff: '弱化', passive: '被動', pick: '撿東西', util: '輔助', survive: '生存', funA: '輔助有趣', funB: '實用有趣', spc: '物種專屬', func: '功能' };
  P.TRANSFORM = [32, 44, 46];
  // 天性魔法（P3：原本叫「副屬性」）。r＝藍/紫/粉/橘 的範圍；P3 拉寬藍色範圍，而且藍的上限一定低於紫的下限
  // who：'owner'＝給主人（主角）、'pet'＝寵物自己
  P.SUBS = [
    { k: 'atk', name: '主人攻擊力', who: 'owner', r: [[1, 1.4], [1.5, 2.2], [2, 2.8], [2.5, 3]], w: 1 },
    { k: 'crit', name: '主人暴擊率', who: 'owner', r: [[0.3, 0.6], [0.7, 1.1], [1, 1.4], [1.1, 1.5]], w: 1 },
    { k: 'cdmg', name: '主人暴擊傷害', who: 'owner', r: [[1.5, 2.4], [2.5, 3.2], [3, 4], [3.5, 5]], w: 1 },
    { k: 'skd', name: '主人技能傷害', who: 'owner', r: [[0.8, 1.4], [1.5, 2.2], [2, 3], [2.2, 3]], w: 1 },
    { k: 'combo', name: '主人連擊傷害', who: 'owner', r: [[1.5, 2.4], [2.5, 3.2], [3, 4], [3.2, 4]], w: 1 },
    { k: 'chase', name: '主人追擊機率', who: 'owner', r: [[0.3, 0.6], [0.7, 1.1], [1, 1.5], [1.1, 1.5]], w: 1 },
    { k: 'dr', name: '主人受到的傷害 −', who: 'owner', r: [[0.8, 1.4], [1.5, 2.2], [2, 3], [2.2, 3]], w: 1 },
    { k: 'dodge', name: '主人閃避率', who: 'owner', r: [[0.3, 0.6], [0.7, 1], [0.9, 1.2], [1, 1.5]], w: 1 },
    { k: 'pcd', name: '寵物自己的技能冷卻 −', who: 'pet', r: [[2, 3.4], [3.5, 5], [5, 7], [6, 8]], w: 1 },
    { k: 'gold', name: '主人撿到的金幣', who: 'owner', r: [[1.5, 2.4], [2.5, 3.2], [3, 4], [4, 5]], w: 0.7 },
    { k: 'food', name: '食物掉落率', who: 'owner', r: [[0.6, 1.2], [1.3, 2], [1.8, 2.4], [2, 3]], w: 0.7 },
    { k: 'loot', name: '掉寶率', who: 'owner', r: [[1.5, 2.4], [2.5, 4], [4, 5], [5, 6]], w: 0.7 },
    { k: 'shard', name: '刻印碎片掉率', who: 'owner', r: [[0.3, 0.6], [0.7, 1], [1, 1.5], [1.5, 2]], w: 0.7 },
    { k: 'spd', name: '主人移動速度', who: 'owner', r: [[0.6, 1.2], [1.3, 2], [1.8, 2.4], [2, 3]], w: 0.7 },
    { k: 'exp', name: '主人得到的經驗', who: 'owner', r: [[0.6, 1.2], [1.3, 2], [2, 3], [3, 4]], w: 0.7 },
  ];
  P.MAGIC = '天性魔法';
  // P3：寵物能力（寵物自己的能力；固定比例分給主人）
  // pet：對寵物自己的效果（每 1 點）；owner：主人分到的點數每 1 點的效果。主人那邊只給「不加傷害」的效果，大劍主角的輸出不會變強
  P.ABIL = [
    { k: 'str', name: '力氣', icon: '💪', pet: { k: 'patk', per: 0.1, cap: 10, txt: '寵物攻擊力' }, owner: { k: 'hp', per: 0.1, cap: 3, txt: '主人最大生命' } },
    { k: 'agi', name: '腳程', icon: '🐾', pet: { k: 'pspd', per: 0.1, cap: 10, txt: '寵物移動速度' }, owner: { k: 'spd', per: 0.05, cap: 2, txt: '主人移動速度' } },
    { k: 'vit', name: '韌性', icon: '🛡️', pet: { k: 'none', per: 0, cap: 0, txt: P.FEAT.cup ? '比賽、探險時更耐久' : '探險時更耐久' }, owner: { k: 'dr', per: 0.05, cap: 2, txt: '主人受到的傷害 −' } },
    { k: 'wit', name: '靈巧', icon: '✨', pet: { k: 'pcd', per: 0.05, cap: 8, txt: '寵物自己的技能冷卻 −' }, owner: { k: 'exp', per: 0.1, cap: 3, txt: '主人得到的經驗' } },
    { k: 'luk', name: '福氣', icon: '🍀', pet: { k: 'none', per: 0, cap: 0, txt: P.FEAT.cup ? '探險戰利品、比賽運氣' : '探險戰利品運氣' }, owner: { k: 'gold', per: 0.1, cap: 3, txt: '主人撿到的金幣' } },
  ];
  // 體型（P3）：小型跑得快；大型打得遠、傷害 +5%
  P.SIZE = { cat: 's', rabbit: 's', owl: 's', pomeranian: 's', shihtzu: 's', fox: 'm', raccoon: 'm', wolf: 'm', bear: 'l', retriever: 'l' };
  P.SIZE_INFO = { s: { name: '小型', txt: '跑得快：移動速度 +15%', spd: 1.15, range: 1, dmg: 1 }, m: { name: '中型', txt: '樣樣平均', spd: 1, range: 1, dmg: 1 }, l: { name: '大型', txt: '打得遠：攻擊距離 +25%、傷害 +5%', spd: 1, range: 1.25, dmg: 1.05 } };
  // 物種擅長的能力（出生的基本值 +4）
  P.ABIL_SP = { cat: ['luk', 'agi'], retriever: ['vit', 'str'], bear: ['str', 'vit'], fox: ['wit', 'agi'], pomeranian: ['agi', 'luk'], rabbit: ['agi', 'wit'], raccoon: ['wit', 'luk'], wolf: ['str', 'agi'], owl: ['wit', 'luk'], shihtzu: ['luk', 'vit'] };
  // 救援任務（P2：救援只在這些任務裡發生，每個只有一次；不再有常態救援）
  // cages：'all'＝10 種各一籠；數字＝從還沒在收容所的物種挑幾籠。tier：籠子裡的位階（-1＝照投靠機率擲）
  P.QUESTS = [
    { id: 'r1', name: '蜜糖之家保衛戰', giver: '蜜糖媽媽', main: 1, req: {}, cages: 'all', tier: 0, waves: [['minion', 'minion', 'axe'], ['minion', 'archer', 'axe', 'minion'], ['axe', 'axe', 'archer', 'minion', 'minion']],
      desc: '「孩子們被城堡的軍隊關進籠子裡了……拜託你。」打開 10 個籠子、打退 3 波追兵。完成後開放蜜糖之家。', reward: '開放收容所＋蜜糖媽媽送 1 隻寶寶' },
    { id: 'r2', name: '山谷舊路的輪子痕', giver: '獵犬', req: { done: 'r1', rep: 2 }, cages: 3, tier: -1, carrier: 1, waves: [['minion', 'minion', 'archer'], ['axe', 'minion', 'minion', 'archer']],
      desc: '獵犬在舊驛站的路上聞到籠車的味道，叼回一塊碎布。「汪。」（跟我來。）', reward: '救下 3 隻（其中 1 隻帶星痕）' },
    { id: 'r3', name: '礦坑口的哭聲', giver: '小貓頭鷹', req: { done: 'r2', rep: 4 }, cages: 2, tier: -1, purple: 1, waves: [['minion', 'archer', 'archer'], ['axe!', 'minion', 'minion', 'axe']],
      desc: '貓頭鷹半夜飛回來，一直往礦坑的方向叫。那裡好像有東西被鎖起來了。', reward: '救下 2 隻（其中 1 隻至少紫）＋幸運石 1 顆', stone: 1 },
    { id: 'r4', name: '黑羽毛與最後的籠車', giver: '蜜糖媽媽', req: { done: 'r3', rep: 6 }, cages: 3, tier: -1, shinyOne: 16, waves: [['minion', 'minion', 'archer', 'axe'], ['boss', 'minion', 'minion']],
      desc: '圍欄邊撿到一根黑羽毛。「那輛畫著城堡的馬車……這次要把最後一批孩子載走了。」', reward: '救下 3 隻（其中 1 隻有機會是星彩）＋幸運石 1 顆', stone: 1 },
  ];
  P.QU = {}; P.QUESTS.forEach(q => P.QU[q.id] = q);
  P.HEART = [0, 100, 250, 450, 700]; // ♡1~♡5 門檻
  P.HEART_NAME = ['陌生', '熟悉', '好朋友', '摯友', '家人'];
  // 可調整的所有數值（正式版用預設值；測試版可以改）
  P.CFG = {
    saveKey: 'pet_save',
    resetHour: 5, tz: 8,             // 每天 05:00（台灣時間）重置
    needFloor: 30, needHours: { f: 12, m: 16, c: 24 }, // 100→30 需要的小時數
    capOff: 0,                       // 1＝關掉每日上限（測試用）
    affTierMul: [1, 1, 0.85, 0.7, 0.6], affBonusCap: 0.6, heroLv: 65,
    daily: { pet: 3, kibble: 2, bread: 2, snack: 1, groom: 1, game: 3, walk: 2 },
    affGain: { pet: 4, petFav: 8, kibble: 2, bread: 6, snack: 15, groom: 10, gameMin: 5, gameMax: 10, walk: 8, fight: 2, reunion: 10, over: 1 },
    breadPerFeed: 2,
    // 位階出現機率
    luckOverride: -1, progressPts: 9,
    tierBase: 40, tierBaseMin: 20, tierPurpleBase: 10, tierK: 0.3, pinkK: 0.17, pinkMax: 11,
    repLv: [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200],
    wanderChance: [0, 15, 20, 25, 30, 35, 40, 45, 50, 55], wanderOverride: -1,
    // 懷孕
    pregBase: 25, pregCap: 70, pregTierMul: [1, 1, 0.9, 0.8, 0.7], pregMinHours: 12, birthsPerDay: 6, nurseryCap: 20,
    litter: { low: [40, 40, 20], purple: [50, 50, 0], high: [80, 20, 0] },
    birthTier: [[92, 7.5, 0.5], [90, 9.3, 0.7], [87, 12, 1.0]], pinkMaxBirth: 12,
    heirChance: 25, persInherit: 60,
    // 遺傳（P2）：家傳技血脈、星痕基因、資質血統、家譜代數
    heirLine: 70,        // 寶寶自己的傳家技：70% 沿用父母其中一位的（血脈），30% 新抽
    heirBoth: 50,        // 父母傳家技相同 → 寶寶第一格直接繼承的機率（平常 heirChance 25%）
    pedigreePurple: 0.5, pedigreeCap: 6, // 父母較高的代數每代 +0.5% 出生紫，最多算 6 代（+3%）
    // 色違（遊戲裡叫「星彩」）
    shinyOdds: 256,      // 基本 1/256（投靠、認養、任務救援、出生突變都用這個）
    carrierOdds: 24,     // 野生動物 1/24 帶 1 個星痕（隱性，看不出來）
    shinyRepLv: [5, 9],  // 名聲到這些等級，各 +50% 機率（Lv9 = 1/128）
    shinyMul: 1.10,      // 星彩寶寶：普攻與技能威力 +10%、天性魔法數值 +10%
    // 便便（輕鬆搞笑用，不扣能力；只有心情稍微掉快一點）
    poopCap: 20,          // 畫面上（含離線）最多 20 坨，含浣熊堆好的那一大坨
    poopHours: 6,         // 每隻寵物大約每 6 小時 1 坨（真實時間，離線也算）
    poopFillMinH: 24,     // 不管養多少隻，從 0 坨堆到滿至少要 24 小時（總速度最多每小時 cap/24 坨）
    poopBear: 2,          // 熊類便便速度 ×2
    poopBigPct: 30,       // 熊的便便 30% 是一大坨（算 2 坨）
    poopBigBread: 25,     // 一大坨每份的麵包機率 25%（一般 20%）
    poopSweepMin: 5,      // 5 坨以上出現「一鍵打掃」
    poopBread: 20,        // 每坨 20% 掃出 1 個剩食麵包（大坨算 2 份、每份 25%）
    poopBreadDay: 5,      // 掃便便得到的麵包每天最多 5 個
    poopStarMin: 15, poopStar: 25, // 一次掃 15 坨以上：25% 掃出 1 個星光碎片（每天 1 次）
    poopMood: [[15, 1.3], [10, 1.15]], // 10 坨起心情掉快 15%，15 坨起 30%
    // 便便掃出裝備：照主遊戲（M2.4／W2.4）小兵掉落表。小兵每殺 1 隻掉裝備 3%×(1＋難度 drop)；
    // 每坨＝那個機率 × 10% × 拉的那隻的位階倍率（成年 1.0／藍 1.25／紫 1.5／粉 1.75／橘 2.0）；稀有度照該難度小兵的權重擲，不會超過小兵能掉的
    poopGearFrac: 0.10, poopGearTier: [1.0, 1.25, 1.5, 1.75, 2.0], poopGearDay: 2,  // 每天最多 2 件
    // 主遊戲難度表（web/m2.js DIFFS＋src24/a_rar.js 的夢幻／傳說權重）
    DIFF: [{ n: '普通', drop: 0, pur: 2 }, { n: '困難', drop: 0.10, pur: 3 }, { n: '菁英', drop: 0.45, pur: 7, wb: [44, 32], sh: 1, pk: 0.84, og: 0.06 }, { n: '地獄', drop: 0.75, pur: 11, wb: [30, 34], sh: 2, pk: 1.8, og: 0.24 }, { n: '深淵', drop: 1.10, pur: 16, wb: [18, 34], sh: 3, pk: 3.12, og: 0.6 }],
    GEAR_RAR: ['一般', '高級', '精良 ★2', '稀有 ★3', '英雄 ★4', '夢幻 ★5', '傳說 ★6'],
    // 幸運石：放在小屋裡，下一個育兒籃的「突變成星彩」機率 ×3（只吃掉 1 顆）
    stoneMul: 3, stoneSweepMin: 15, stoneSweep: 10,  // 一次掃 15 坨以上，10% 掃出 1 顆（跟星光碎片分開擲）
    raccoonTidy: 9,       // 浣熊每隻大約每 9 秒去搬 1 坨到角落的堆肥坑
    starShowHeart: 4,    // 好感 ♡4 起，照顧面板會透露「毛尖偶爾閃一下」（帶星痕）
    qualBase: [40, 35, 20, 5],
    // 寶寶
    lvCap: [0, 10, 15, 20, 20], slots: [0, 1, 2, 2, 3], subCount: [0, 1, 2, 2, 3], pink3SubChance: 30,
    petAtk: [0, 1163, 1292, 1370, 1447], petAtkInterval: 4,
    xpPerKill: 6, xpNeed: 40,
    // 洗技能／洗天性魔法
    // P2b：大約降成 1/3，保底 10→6；用麵包洗不用磁片；剛出生就能洗
    rerollGold: [0, 1500, 5000, 12000, 25000], rerollBread: [0, 10, 25, 60, 120], rerollPity: 6,
    rerollDiskGold: 1, rerollDiskBread: 0,   // 用金幣洗要 1 張技能磁片；用麵包洗不用
    subGold: [0, 1000, 2500, 6500, 13000], subBread: [0, 7, 15, 25, 50], subPity: 6,
    // 升階
    up: [null, { lv: 10, heart: 3, letter: 2, gold: 30000, bread: 50, rate: 50, pity: 3 }, { lv: 15, heart: 4, letter: 3, gold: 150000, bread: 150, rate: 20, shard: 20 }, { lv: 20, heart: 5, letter: 2, gold: 400000, bread: 300, rate: 8, shard: 60, collar: 1 }],
    // 戰鬥
    skillCdMul: 1, bossCtrlShare: 20, transformMax: 3,
    ratBread: [0, 0, 1, 1.5, 2], pigBread: [0, 0, 0, 2, 3],
    petFoodCapFight: 5, petFoodCapSpec: 7, petFoodCapBest: 10, petFoodDaySoft: 40,
    foodDrop: 55, foodSlot: 3, heroAtk: 3000, heroHp: 10000,
    // 認養價格
    adoptGold: [20000, 40000, 80000, 120000], adoptBread: [30, 60, 100, 150],
    cotCost: [[120000, 80, 20], [300000, 150, 40], [600000, 250, 80], [800000, 300, 100], [1000000, 350, 120]], cotMax: 3, houseCap: 5,
    // ===== P3 =====
    houseStep: [5, 10, 20],          // 一館 5／二館 10／農場 20（成年住民上限）
    nurseryFarm: 10,                 // 托兒所：育兒室 +10
    annex: { gold: 350000, bread: 200, shard: 40, rep: 4, hours: 12, cots: 2 },
    farm: { gold: 1200000, bread: 500, shard: 100, rep: 7, hours: 24 },
    askEvery: 3,                     // 西施最多每 3 天提醒一次擴建
    // 寵物能力
    ablBase: [8, 10, 12, 14, 16],    // 每項出生的基本值（成年／藍／紫／粉／橘）
    ablSpBonus: 4,                   // 物種擅長的 2 項各 +4
    ablLv: 4,                        // 每升 1 級：成長點 +4（照方向分配）
    ablTier: [0, 0, 12, 18, 25],     // 升到這個位階：成長點一次 +N
    ablDirW: [0.4, 0.25],            // 方向：主項拿 40%、次項拿 25%，其他 3 項平分剩下的
    ablQual: [0.9, 1, 1.1, 1.2],     // 資質 C/B/A/S 的成長倍率
    ablOwnerShare: 10,               // 主人分到寵物能力的 10%（點數）
    ablTrainCap: 60,                 // 訓練加的點數每項最多 60
    featherCost: 1,                  // 換方向：風向羽毛 1 根
    // 放他出去闖闖
    relGrade: ['小小心意', '暖心禮物', '珍貴禮物', '傳說寶物'],
    relBase: [70, 25, 4.5, 0.5],     // 強度 0 時的機率（%）：普通／不錯／很好／極品
    relMax: [35.5, 40, 20, 4.5],     // 強度 100 時的機率（%）。中間線性；永遠不會 100%
    relOrangePity: 3,                // 橘寵：每放 3 隻還沒拿到傳說寶物 → 第 3 隻一定是傳說寶物
    postDay: [1, 3], post2Day: [3, 7], post2Chance: 50, postCap: 10, // 明信片：第 1 封 1～3 天、第 2 封 50% 在 3～7 天；每天最多 10 張
    // 訓練營
    trainCost: 2000, trainMain: 3, trainSub: 1, trainFatigue: 20, fatigueRecH: 5, // 日常訓練：主項 +3、副項 +1，疲勞 +20；每小時自然恢復 5
    campDays: { 1: { gold: 10000, main: 8, sub: 3, magic: 3 }, 2: { gold: 20000, main: 15, sub: 6, magic: 6 }, 3: { gold: 30000, main: 24, sub: 9, magic: 10 } },
    // 探險隊
    expTeams: 2, expRestH: 2, expBase: 70, expPer: 10, expMin: 20, expMax: 95, expStreak: 20, expConsole: 25, expChestDay: 2,
    // 大會
    cupDaily: 3,                     // 村莊小賽：每隻每天 1 次，全部每天最多 3 場
    rankNeed: { 1: 3, 2: 2, 3: 1 },  // 村莊小賽拿 3 次冠軍 → 銅；季節盃 2 次 → 銀；王國名盃 1 次 → 金
    kingdomLv: 10, legendRep: 8,
  };

  // ===================== 遺傳學（design/pet_genetics_zh.md v1；全部可調） =====================
  // 使用者回答第 13 節的問題以後，只要改這裡的數字。
  P.CFG.gen = {
    ablInherit: 0.7,                       // 寶寶出生值 ＋ 父母「血統值」平均的 70%（訓練、大會加的不算）
    ablInheritRnd: [0.9, 1.1],             // 再乘隨機 0.9～1.1
    ablBloodCap: [100, 100, 160, 220, 280],// 血統值每項上限（成年／藍／紫／粉／橘）
    lineStep: 0.04, lineMax: 5,            // 傳承 +N：每級上限 +4%，最多 +5
    ablCupMax: 30,                         // 大會永久加的每項最多 +30（不遺傳）
    ablTal: 1.5,                           // 能力天賦（突變）：那一項成長 ×1.5（上限不變）
    dirParent: 50, dirPers: 30,            // 寶寶方向：50% 跟父母、30% 照個性、20% 隨機
    persAbil: { 0: 'agi', 1: 'vit', 2: 'str', 3: 'luk', 4: 'wit' },   // 個性 → 偏好的能力（活潑腳程、溫和韌性、貪吃力氣、愛睡福氣、好奇靈巧）
    qualSS: 3,                             // 父母都 S：資質擲 3 次取好的
    subKind: 35, subKindBoth: 60,          // 天性魔法種類：每條 35% 沿用父母的；父母同一種 60%
    subXMul: 7 / 6,                        // 異彩：比位階上限高「半格」（橘攻擊 3% → 3.5%）
    teach: { one: [45, 30], both: [70, 50], book: [45, 30], heir: 10, entrust: 15, mutHalf: 0.5 },
    mstFight: 3, mstPass: 0.5,             // 熟練：用到 +3；傳下去＝父母平均 ×50%（託付不打折）
    evolveSum: 150, mixMin: 60, mixChance: 25,
    bookPages: 5, bookPagesShop: 10, bookCost: 1,   // 家傳手札：5 頁（工作坊 10 頁）；抄一頁花技能磁片 1
    mut: 3, mutPity: 50, mutCoi: 1.5, moonMul: 4,   // 突變 3%；近親 ×1.5；月光露這一籃 ×4 而且至少 1 隻（mutPity 是 P3 的單一保底，P4 改成下面三層隱藏保底，已不用）
    mutW: { coat: 40, size: 25, tal: 15, sub: 15, skill: 5 },
    mutInherit: 50,                        // 體型標籤、能力天賦：50% 傳給寶寶
    coiBan: 0.25, coiNear: 0.125, coiNearMul: 0.9, coiDepth: 4,
    hybCot: 0.6, hybHeart: 4,              // 指定混血：兩隻都 ♡4、育兒籃機率 ×0.6
    hybPure: 40, hybSame: 60, hybBack: 40, hybCross: 35,
    recipe: 30, recipeGuarantee: 3,        // 四祖配方：每隻 30%；第 3 個育兒籃起保證至少 1 隻（第一次）
    recipeMinTier: 2,                      // 四祖物種出生至少紫
    sizeSd: 6,                             // 個體體型值：父母平均 ± 約 6（純外觀，畫面縮放 0.9～1.1）
    coatWild: [55, 25, 15, 5],             // 野生毛色基因：原／深／淺／雪
    coatHint: 4,                           // ♡4 起提示帶隱性毛色
    // ---------- P4 ----------
    trInherit: 0.3,                        // 訓練練出來的點數：父母平均的 30% 變成寶寶的血統值（血統值上限不變）
    // 突變隱藏保底（三層，玩家看不到數字）：同一對父母／同一種族的蛋數／整個收容所。門檻是範圍，第一次用到時擲一次存起來
    pityPair: [10, 14], pitySp: [24, 32], pityAll: [44, 56],
    pityHint: 0.75,                        // 任一層到門檻的 75% 以上，西施會含糊地說「好像快有什麼事了」
    pityHintFake: 8,                       // 8% 機率在還很遠時也說（讓玩家拿不準）
    // 爸媽出門：主動開口問的機率（育兒籃出現時擲一次；♡ 越高越容易）＋臨別禮權重
    askBase: 15, askPerHeart: 2, askMax: 30,
    farewellW: { bless: 30, will: 25, mark: 20, memento: 15, seed: 10 },
    seedMul: 2,                            // 隔代種子：牠將來的孩子突變率 ×2
    // 技能位階
    rareRoll: 0.5,                         // 稀有技（突變技能）：每次洗技能 0.5% 洗出來
    atav: 10, atavMul: 1.15,               // 隔代覺醒：祖父母會、爸媽都不會 → 10% 在孫輩覺醒（威力 ×1.15）
    // 彩虹月光露：傳說大會冠軍 3%；或累積 3 次傳說冠軍換 1 瓶
    rainbowLegend: 3, rainbowTrade: 3,
  };
  P.COAT = ['原毛', '深毛', '淺毛', '雪毛', '星斑', '月白尖', '黑耳', '虎紋', '結晶紋'];
  // 混血種（先藏起來）：用 base 的骨架＋換色＋疊層
  const HYB = [
    { id: 'moonhound', name: '月牙犬', emo: '🐕', base: 'retriever', par: ['wolf', 'retriever'], hue: 200, sat: 0.55, size: 'l', fav: ['str', 'agi'], inh: ['月夜追蹤', '追擊機率 +1.2/1.8/2.4%；每 20 秒主角攻擊 +1.8/2.4/3%（6 秒）'], hint: ['小貓頭鷹', '咕。月亮出來的晚上，小狼跟獵犬常常一起唱歌呢。'] },
    { id: 'lanterncat', name: '燈尾貓', emo: '🐱', base: 'cat', par: ['cat', 'fox'], hue: 20, sat: 1.5, size: 's', fav: ['luk', 'agi'], inh: ['燈尾', '金幣 +1.8/2.4/3%；普攻附帶灼傷 12/15/18%'], hint: ['西施', '貓咪跟小狐狸都喜歡追著尾巴玩……要是牠們有孩子，尾巴說不定會發光呢！'] },
    { id: 'honeybear', name: '蜜熊', emo: '🐻', base: 'bear', par: ['bear', 'raccoon'], hue: 25, sat: 1.3, size: 'm', fav: ['vit', 'luk'], inh: ['蜂蜜抱抱', 'HP<50% 受到傷害 −1.8/2.4/3%；木箱與寶箱額外掉落 +6/9/12%'], hint: ['蜜糖媽媽', '小熊跟浣熊一起翻蜂蜜罐的樣子，好像一家人喔。'] },
    { id: 'featherbun', name: '羽耳兔', emo: '🐰', base: 'rabbit', par: ['rabbit', 'owl'], hue: 60, sat: 0.9, size: 's', fav: ['agi', 'wit'], inh: ['羽耳', '閃避 +0.6/0.9/1.2%；暴擊率 +0.9/1.2/1.5%'], hint: ['小貓頭鷹', '咕咕。兔子跳得好高……要是長了羽毛，是不是就能飛了？'] },
    { id: 'puffdog', name: '蓬蓬犬', emo: '🐶', base: 'pomeranian', par: ['pomeranian', 'shihtzu'], hue: 330, sat: 0.6, size: 's', fav: ['luk', 'vit'], inh: ['蓬蓬應援', '絕招量表 +2.4/3/3.6%；小泡泡 18/24/30%'], hint: ['西施', '博美跟我們西施犬都是毛球……兩團毛球湊在一起會怎樣呢？'] },
    { id: 'frostfox', name: '霜尾狐', emo: '🦊', base: 'fox', par: ['fox', 'wolf'], hue: 190, sat: 0.9, size: 'm', fav: ['agi', 'str'], inh: ['霜火', '普攻灼傷 12/15/18%；每 20 秒主角攻擊 +1.8/2.4/3%（6 秒）'], hint: ['獵犬', '汪。（小狐狸跟小狼在雪地裡跑的時候，尾巴好像會結霜。）'] },
    { id: 'starwolf', name: '星夜狼', emo: '🐺', base: 'wolf', recipe: ['wolf', 'retriever', 'fox', 'wolf'], hue: 230, sat: 1.4, size: 'm', fav: ['str', 'wit'], inh: ['星夜嚎', '每 20 秒主角攻擊 +3/4/5%，持續 8 秒'], hint: ['蜜糖媽媽', '我奶奶說過，月亮的孩子跟霜雪的孩子湊在一起，會生出背上有星星的小狼。'] },
    { id: 'liondog', name: '蜜糖獅子犬', emo: '🦁', base: 'shihtzu', recipe: ['pomeranian', 'shihtzu', 'bear', 'raccoon'], hue: 35, sat: 1.6, size: 's', fav: ['vit', 'luk'], inh: ['蜜糖守護', '主角 HP≤1/2 時 10 秒回 30/40/50% HP（冷卻再 −5 秒）'], hint: ['蜜糖媽媽', '我奶奶說過，四種毛色的孩子湊在一起，會生出像獅子一樣的小可愛。'] },
  ];
  P.HYB = {};
  for (const h of HYB) {
    const b = P.SP[h.base];
    const sp = Object.assign({}, b, { id: h.id, name: h.name, emo: h.emo, hue: h.hue, sat: h.sat, base: h.base, hyb: h.par || null, recipe: h.recipe || null, inh: h.inh, hint: h.hint, looks: [0, 1, 2, 3].map(i => ['淡毛色', '深毛色', '亮毛色', '暗毛色'][i] + h.name), secret: 1 });
    P.SP[h.id] = sp; P.HYB[h.id] = sp; P.SIZE[h.id] = h.size; P.ABIL_SP[h.id] = h.fav;
  }
  P.isHyb = sp => !!(P.SP[sp] && P.SP[sp].base);
  P.baseSp = sp => (P.SP[sp] && P.SP[sp].base) || sp;
  // 進化版技能（只能靠遺傳）：use＝[原技能, 威力倍率]
  const EVO = [[1, '業火的玩笑', 1.28, '灼傷共 90%P → 115%P'], [2, '凜冬的憤怒', 1.2, '緩速 2 秒 → 3 秒（王照樣減半）'], [3, '天雷的歡呼', 1.3, '觸電後雷屬性傷害 +10% → +13%'], [4, '血月的獠牙', 1.28, '出血共 90%P → 115%P'], [8, '猛突', 1.25, '80%P → 100%P，擊退距離 +30%'], [9, '魔力流星', 1.23, '130%P → 160%P'], [11, '雄壯的應援', 1.2, '攻擊力 +3% → +3.6%（8 秒）'], [15, '堅守的祝福', 1.25, '受到傷害 −4% → −5%'], [24, '撿撿大王', 1.27, '自動撿 300px → 380px'], [34, '全場跳舞吧', 1, '前方小怪 → 畫面內小怪（王照舊只 −3%）'], [36, '香蕉皮大遊行', 1, '3 片 → 5 片'], [49, '天降大鐵鍋', 1.25, '120%P → 150%P，暈 2 秒不變']];
  P.EVO = {};
  for (const [b, name, mul, d] of EVO) { const o = P.SK[b]; if (!o) continue; const n = 100 + b; P.SKILLS.push(P.SK[n] = Object.assign({}, o, { n, name, tier: Math.max(2, o.tier), w: 0, desc: o.desc + '｜進化：' + d, evo: b, use: [[b, mul]], gen: 'evo', impl: o.impl })); P.EVO[b] = n }
  // 混合技能（只能靠遺傳）：兩個技能的效果合成 1 格
  const MIX = [[1, 2, '冰火二重奏', 12, '命中 60%P＋灼傷 60%P＋緩速 15% 2 秒'], [3, 4, '雷牙', 12, '命中 60%P＋觸電與出血各 50%P'], [11, 13, '戰鼓的應援', 24, '攻擊力 +3%、暴擊率 +2%，8 秒（算 1 個應援）'], [15, 16, '鐵壁的祝福', 24, '受到傷害 −3%、閃避 +2%，8 秒'], [8, 9, '流星突擊', 8, '衝過去 70%P，回程再射 1 發 80%P'], [10, 7, '星光連鎖', 22, '3 個目標各 2 發 30%P，第一個目標吃審判 +10%'], [36, 49, '廚房大亂鬥', 18, '3 片香蕉皮，踩到的被平底鍋敲 80%P＋暈 1 秒'], [33, 40, '泡泡搖籃', 30, '黏液區內的小怪睡 3 秒'], [25, 64, '麵包坊的鼻子', 0, '兩個效果都有、各 80%（算在打糧上限內）'], [67, 37, '搖錢樹', 0, '小怪金幣 +5%，每 12 秒抖一次口袋（算在打錢上限內）']];
  P.MIX = [];
  MIX.forEach(([a, b, name, cd, d], i) => { const A = P.SK[a], B = P.SK[b]; if (!A || !B) return; const n = 200 + i; P.SKILLS.push(P.SK[n] = { n, name, cat: 'mix', tier: 2, w: 0, cd, sp: [], desc: d, impl: A.impl && B.impl, use: [[a, 0.65], [b, 0.65]], gen: 'mix', parts: [a, b] }); P.MIX.push({ a, b, n }) });
  // 突變限定技能
  const MUTSK = [['月影步', 12, '閃到最近敵人的背後咬一口 110%P', [[8, 1.375]]], ['迴聲吠', 40, '寵物下一個技能放 2 次，第 2 次 50%', null], ['四葉草的祝福', 0, '這場撿到的麵包、金幣 3% 機率 ×2（算在每場上限內）', null], ['星屑尾巴', 0, '寵物走過留下星屑，小怪踩到緩速 15% 2 秒（王 5%）', null], ['逆鱗', 30, '主角被擊倒時，寵物 6 秒攻擊 +30%（只加寵物自己）', null]];
  P.MUTSK = MUTSK.map(([name, cd, d, use], i) => { const n = 300 + i; P.SKILLS.push(P.SK[n] = { n, name, cat: 'mut', tier: 1, w: 0, cd, sp: [], desc: d, impl: !!use, use: use || undefined, gen: 'mut' }); return n });
  // 混血專屬技能：只有那個混血種會抽到（cat spc、sp 限定）
  const HSK = [['moonhound', '月夜合唱', 20, '附近小怪 2 秒內攻擊 −10%（王 −3%）', [[6, 1]]], ['lanterncat', '燈籠火', 16, '身邊 3 顆火球繞圈 4 秒，各 40%P', [[1, 0.9]]], ['honeybear', '蜂蜜罐', 22, '丟蜂蜜黏住小怪 2 秒，打死的多 20% 掉麵包（算上限）', [[33, 1]]], ['featherbun', '夜風滑翔', 14, '飛到最遠的遠程小怪頭上踩一下 90%P＋暈 0.8 秒', [[8, 1.1]]], ['puffdog', '毛球彈跳', 18, '彈 3 下，各 50%P，最後一下讓主角下一招 +8%', [[9, 1.15]]], ['frostfox', '霜火', 12, '命中 50%P＋灼傷與緩速 10% 各 3 秒', [[2, 1]]]];
  HSK.forEach(([sp, name, cd, d, use], i) => { const n = 400 + i; P.SKILLS.push(P.SK[n] = { n, name, cat: 'spc', tier: 1, w: 6, cd, sp: [sp], desc: d, impl: true, use, gen: 'hyb' }) });
})(window.PET);
