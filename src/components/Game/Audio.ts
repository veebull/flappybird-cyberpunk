import { AUDIO } from './constants';

class GameAudio {
  private backgroundMusic: HTMLAudioElement;
  private jumpSound: HTMLAudioElement;
  private initialized = false;

  constructor() {
    this.backgroundMusic = new Audio(AUDIO.background);
    this.jumpSound = new Audio(AUDIO.jump);
    this.backgroundMusic.loop = true;
  }

  init() {
    if (!this.initialized) {
      this.backgroundMusic.load();
      this.jumpSound.load();
      this.initialized = true;
    }
  }

  playBackground() {
    this.backgroundMusic.currentTime = 0;
    this.backgroundMusic.play().catch(() => {});
  }

  stopBackground() {
    this.backgroundMusic.pause();
  }

  playJump() {
    this.jumpSound.currentTime = 0;
    this.jumpSound.play().catch(() => {});
  }
}

export const gameAudio = new GameAudio();