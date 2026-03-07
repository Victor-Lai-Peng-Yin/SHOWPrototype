/**
 * 烤肉小遊戲配置
 */

export const GameConfig = {
  // 廚藝數值範圍
  MIN_COOKING_SKILL: 1,
  MAX_COOKING_SKILL: 100,
  DEFAULT_COOKING_SKILL: 50,

  // Timing 窗口時間（秒）
  BASE_WINDOW_TIME: 0.5,      // 最難時的窗口時間
  MAX_WINDOW_TIME: 2.0,       // 最簡單時的窗口時間

  // 目標熟度選項
  TARGET_DONENESS: [3, 5, 7], // 3分、5分、7分

  // 遊戲時間設定
  GAME_DURATION: 5.0,         // 遊戲總時長（秒）
  COUNTDOWN_TIME: 3,          // 倒數計時（秒）

  // 分數設定
  BASE_SCORE: 100,            // 完美時機的基礎分數
  SKILL_BONUS_MULTIPLIER: 20, // 廚藝加成倍數

  // AI對手設定
  AI_BASE_SUCCESS_RATE: 0.6,  // AI基礎成功率
  AI_MAX_SUCCESS_RATE: 0.95,  // AI最高成功率

  // 視覺提示等級
  VISUAL_HINT_LEVELS: {
    LOW: { min: 1, max: 30 },      // 低廚藝
    MEDIUM: { min: 31, max: 70 },   // 中廚藝
    HIGH: { min: 71, max: 100 }     // 高廚藝
  },

  // 速度變化設定
  BASE_SPEED_VARIATION: 1.0,  // 基礎速度變化率
  MAX_SPEED_VARIATION: 0.5,   // 最大速度變化幅度
};

/**
 * 計算實際窗口時間
 * @param {number} cookingSkill - 廚藝數值 (1-100)
 * @returns {number} 窗口時間（秒）
 */
export function calculateWindowTime(cookingSkill) {
  const { BASE_WINDOW_TIME, MAX_WINDOW_TIME, MAX_COOKING_SKILL } = GameConfig;
  const skillRatio = cookingSkill / MAX_COOKING_SKILL;
  return BASE_WINDOW_TIME + skillRatio * (MAX_WINDOW_TIME - BASE_WINDOW_TIME);
}

/**
 * 計算速度變化率
 * @param {number} cookingSkill - 廚藝數值 (1-100)
 * @returns {number} 速度變化係數
 */
export function calculateSpeedVariation(cookingSkill) {
  const { MAX_COOKING_SKILL, MAX_SPEED_VARIATION } = GameConfig;
  const difficultyCoefficient = 1.0 - (cookingSkill / MAX_COOKING_SKILL) * MAX_SPEED_VARIATION;
  return difficultyCoefficient;
}

/**
 * 計算AI成功率
 * @param {number} cookingSkill - 玩家廚藝數值 (1-100)
 * @returns {number} AI成功率 (0-1)
 */
export function calculateAISuccessRate(cookingSkill) {
  const { AI_BASE_SUCCESS_RATE, AI_MAX_SUCCESS_RATE, MAX_COOKING_SKILL } = GameConfig;
  const skillRatio = cookingSkill / MAX_COOKING_SKILL;
  return AI_BASE_SUCCESS_RATE + skillRatio * (AI_MAX_SUCCESS_RATE - AI_BASE_SUCCESS_RATE);
}

/**
 * 獲取視覺提示等級
 * @param {number} cookingSkill - 廚藝數值 (1-100)
 * @returns {string} 提示等級 ('LOW' | 'MEDIUM' | 'HIGH')
 */
export function getVisualHintLevel(cookingSkill) {
  const { VISUAL_HINT_LEVELS } = GameConfig;
  if (cookingSkill >= VISUAL_HINT_LEVELS.HIGH.min) return 'HIGH';
  if (cookingSkill >= VISUAL_HINT_LEVELS.MEDIUM.min) return 'MEDIUM';
  return 'LOW';
}

/**
 * 計算分數
 * @param {number} timeError - 時間誤差（秒）
 * @param {number} windowTime - 窗口時間（秒）
 * @param {number} cookingSkill - 廚藝數值 (1-100)
 * @returns {object} { score: number, rating: string }
 */
export function calculateScore(timeError, windowTime, cookingSkill) {
  const { BASE_SCORE, SKILL_BONUS_MULTIPLIER, MAX_COOKING_SKILL } = GameConfig;
  const toleranceRange = windowTime / 2;
  
  if (timeError > toleranceRange) {
    return { score: 0, rating: 'FAIL' };
  }

  // 計算基礎分數
  const scoreRatio = 1 - (timeError / toleranceRange) * 0.5;
  let score = BASE_SCORE * scoreRatio;

  // 添加廚藝加成
  const skillBonus = (cookingSkill / MAX_COOKING_SKILL) * SKILL_BONUS_MULTIPLIER;
  score = Math.round(score + skillBonus);

  // 判定等級
  let rating;
  const errorRatio = timeError / toleranceRange;
  if (errorRatio < 0.1) {
    rating = 'PERFECT';
  } else if (errorRatio < 0.3) {
    rating = 'GOOD';
  } else {
    rating = 'NORMAL';
  }

  return { score: Math.max(0, score), rating };
}

/**
 * 獲取評價文字
 * @param {string} rating - 評價等級
 * @returns {string} 評價文字
 */
export function getRatingText(rating) {
  const ratingTexts = {
    'PERFECT': '完美！',
    'GOOD': '不錯！',
    'NORMAL': '還可以',
    'FAIL': '失敗了...'
  };
  return ratingTexts[rating] || '未知';
}
