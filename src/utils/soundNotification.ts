// 조리완료 알림 사운드 유틸리티

interface SoundSettings {
  enabled: boolean;
  volume: number;
  soundType: 'default' | 'bell' | 'chime' | 'notification';
}

class SoundNotification {
  private audio: HTMLAudioElement | null = null;
  private settings: SoundSettings = {
    enabled: true,
    volume: 0.5,
    soundType: 'default'
  };

  constructor() {
    this.loadSettings();
  }

  // 설정 로드
  private loadSettings() {
    try {
      const saved = localStorage.getItem('soundNotificationSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('사운드 설정 로드 실패:', error);
    }
  }

  // 설정 저장
  private saveSettings() {
    try {
      localStorage.setItem('soundNotificationSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('사운드 설정 저장 실패:', error);
    }
  }

  // 사운드 파일 경로 가져오기
  private getSoundPath(type: string): string {
    const soundFiles = {
      default: '/sounds/notification.mp3',
      bell: '/sounds/bell.mp3',
      chime: '/sounds/chime.mp3',
      notification: '/sounds/notification.mp3'
    };
    return soundFiles[type as keyof typeof soundFiles] || soundFiles.default;
  }

  // 사운드 재생
  async playSound(type?: string): Promise<void> {
    if (!this.settings.enabled) {
      console.log('사운드 알림이 비활성화되어 있습니다.');
      return;
    }

    try {
      const soundType = type || this.settings.soundType;
      const soundPath = this.getSoundPath(soundType);

      // 기존 오디오가 재생 중이면 중지
      if (this.audio) {
        this.audio.pause();
        this.audio.currentTime = 0;
      }

      // 새 오디오 생성
      this.audio = new Audio(soundPath);
      this.audio.volume = this.settings.volume;
      
      // 사운드 로드 및 재생
      await this.audio.load();
      await this.audio.play();
      
      console.log('조리완료 알림 사운드 재생:', soundType);
    } catch (error) {
      console.error('사운드 재생 실패:', error);
      // 사운드 파일이 없을 경우 기본 브라우저 알림음 사용
      this.playFallbackSound();
    }
  }

  // 폴백 사운드 (기본 브라우저 알림음)
  private playFallbackSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('폴백 사운드 재생 실패:', error);
    }
  }

  // 테스트 사운드 재생
  async testSound(type?: string): Promise<void> {
    await this.playSound(type);
  }

  // 설정 업데이트
  updateSettings(newSettings: Partial<SoundSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // 설정 가져오기
  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  // 사운드 활성화/비활성화
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.saveSettings();
  }

  // 볼륨 설정
  setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  // 사운드 타입 설정
  setSoundType(soundType: SoundSettings['soundType']): void {
    this.settings.soundType = soundType;
    this.saveSettings();
  }
}

// 싱글톤 인스턴스 생성
export const soundNotification = new SoundNotification();

// 조리완료 알림 함수 (주문 상태가 'ready'로 변경될 때 호출)
export const playCookingCompleteSound = async (): Promise<void> => {
  await soundNotification.playSound();
};

// 테스트 함수
export const testCookingSound = async (): Promise<void> => {
  await soundNotification.testSound();
}; 