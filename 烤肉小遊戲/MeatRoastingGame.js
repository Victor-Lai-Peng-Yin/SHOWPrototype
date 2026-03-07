/**
 * 烤肉小遊戲主類
 */

import {
  GameConfig,
  calculateWindowTime,
  calculateSpeedVariation,
  calculateAISuccessRate,
  getVisualHintLevel,
  calculateScore,
  getRatingText
} from './GameConfig.js';

export class MeatRoastingGame {
  constructor(cookingSkill = GameConfig.DEFAULT_COOKING_SKILL) {
    this.cookingSkill = Math.max(
      GameConfig.MIN_COOKING_SKILL,
      Math.min(GameConfig.MAX_COOKING_SKILL, cookingSkill)
    );
    
    this.windowTime = calculateWindowTime(this.cookingSkill);
    this.speedVariation = calculateSpeedVariation(this.cookingSkill);
    this.aiSuccessRate = calculateAISuccessRate(this.cookingSkill);
    this.visualHintLevel = getVisualHintLevel(this.cookingSkill);
    
    this.targetDoneness = null;
    this.gameState = 'WAITING'; // WAITING, COUNTDOWN, PLAYING, FINISHED
    this.countdown = 0;
    this.gameTime = 0;
    this.playerPressTime = null;
    this.perfectTime = null;
    
    this.aiOpponents = [
      { name: 'AI對手1', pressTime: null, score: 0 },
      { name: 'AI對手2', pressTime: null, score: 0 }
    ];
    
    this.result = null;
  }

  /**
   * 開始新遊戲
   */
  startGame() {
    // 隨機選擇目標熟度
    const randomIndex = Math.floor(Math.random() * GameConfig.TARGET_DONENESS.length);
    this.targetDoneness = GameConfig.TARGET_DONENESS[randomIndex];
    
    // 計算完美時機（根據目標熟度）
    // 3分 = 1.5秒, 5分 = 2.5秒, 7分 = 3.5秒
    this.perfectTime = 1.0 + (this.targetDoneness * 0.5);
    
    // 添加速度變化
    const speedVariation = (Math.random() - 0.5) * this.speedVariation * 0.3;
    this.perfectTime += speedVariation;
    
    this.gameState = 'COUNTDOWN';
    this.countdown = GameConfig.COUNTDOWN_TIME;
    this.gameTime = 0;
    this.playerPressTime = null;
    this.result = null;
    
    // 重置AI對手
    this.aiOpponents.forEach(ai => {
      ai.pressTime = null;
      ai.score = 0;
    });
  }

  /**
   * 更新遊戲狀態
   * @param {number} deltaTime - 經過的時間（秒）
   */
  update(deltaTime) {
    if (this.gameState === 'COUNTDOWN') {
      this.countdown -= deltaTime;
      if (this.countdown <= 0) {
        this.gameState = 'PLAYING';
        this.countdown = 0;
      }
    } else if (this.gameState === 'PLAYING') {
      this.gameTime += deltaTime;
      
      // 檢查是否超時
      if (this.gameTime >= GameConfig.GAME_DURATION) {
        this.finishGame();
      }
      
      // AI對手自動按下（模擬）
      this.updateAIOpponents();
    }
  }

  /**
   * 更新AI對手狀態
   */
  updateAIOpponents() {
    this.aiOpponents.forEach(ai => {
      if (ai.pressTime === null && this.gameTime >= this.perfectTime) {
        // AI根據成功率決定是否按下
        const random = Math.random();
        if (random <= this.aiSuccessRate) {
          // AI成功按下（在完美時機附近）
          const aiError = (Math.random() - 0.5) * this.windowTime * 0.3;
          ai.pressTime = this.perfectTime + aiError;
          
          // 計算AI分數
          const timeError = Math.abs(ai.pressTime - this.perfectTime);
          const aiScore = calculateScore(timeError, this.windowTime, this.cookingSkill);
          ai.score = aiScore.score;
        } else {
          // AI失敗（按錯時機）
          const failError = this.windowTime * (0.5 + Math.random() * 0.5);
          ai.pressTime = this.perfectTime + (Math.random() > 0.5 ? failError : -failError);
          ai.score = 0;
        }
      }
    });
  }

  /**
   * 玩家按下按鈕
   */
  playerPress() {
    if (this.gameState === 'PLAYING' && this.playerPressTime === null) {
      this.playerPressTime = this.gameTime;
      this.finishGame();
    }
  }

  /**
   * 結束遊戲並計算結果
   */
  finishGame() {
    if (this.gameState !== 'PLAYING') return;
    
    this.gameState = 'FINISHED';
    
    // 計算玩家分數
    let playerScore = 0;
    let playerRating = 'FAIL';
    
    if (this.playerPressTime !== null) {
      const timeError = Math.abs(this.playerPressTime - this.perfectTime);
      const scoreResult = calculateScore(timeError, this.windowTime, this.cookingSkill);
      playerScore = scoreResult.score;
      playerRating = scoreResult.rating;
    }
    
    // 確保所有AI都已按下
    this.aiOpponents.forEach(ai => {
      if (ai.pressTime === null) {
        // AI超時，失敗
        ai.pressTime = GameConfig.GAME_DURATION;
        ai.score = 0;
      }
    });
    
    // 計算排名
    const allScores = [
      { name: '玩家', score: playerScore, rating: playerRating },
      ...this.aiOpponents.map(ai => ({ name: ai.name, score: ai.score, rating: ai.score > 0 ? 'GOOD' : 'FAIL' }))
    ];
    
    allScores.sort((a, b) => b.score - a.score);
    
    this.result = {
      targetDoneness: this.targetDoneness,
      playerScore,
      playerRating,
      playerTime: this.playerPressTime,
      perfectTime: this.perfectTime,
      timeError: this.playerPressTime !== null ? Math.abs(this.playerPressTime - this.perfectTime) : null,
      aiOpponents: this.aiOpponents.map(ai => ({
        name: ai.name,
        score: ai.score,
        pressTime: ai.pressTime
      })),
      ranking: allScores.map((item, index) => ({
        rank: index + 1,
        name: item.name,
        score: item.score,
        rating: item.rating
      }))
    };
  }

  /**
   * 獲取當前遊戲進度（0-1）
   */
  getProgress() {
    if (this.gameState !== 'PLAYING') return 0;
    return Math.min(1, this.gameTime / GameConfig.GAME_DURATION);
  }

  /**
   * 獲取距離完美時機的進度（0-1）
   */
  getPerfectTimingProgress() {
    if (this.gameState !== 'PLAYING') return 0;
    return Math.min(1, this.gameTime / this.perfectTime);
  }

  /**
   * 獲取是否在窗口時間內
   */
  isInWindow() {
    if (this.gameState !== 'PLAYING') return false;
    const timeError = Math.abs(this.gameTime - this.perfectTime);
    return timeError <= this.windowTime / 2;
  }

  /**
   * 獲取視覺提示強度（0-1）
   */
  getVisualHintIntensity() {
    if (this.gameState !== 'PLAYING') return 0;
    const timeError = Math.abs(this.gameTime - this.perfectTime);
    const maxError = this.windowTime;
    return Math.max(0, 1 - timeError / maxError);
  }
}
