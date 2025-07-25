// 예약 리마인드 알림 유틸리티

interface ReservationReminderSettings {
  enabled: boolean;
  timing: number; // 시간 (시간 단위)
  reminderTypes: {
    before30min: boolean;
    before1hour: boolean;
    before2hours: boolean;
  };
}

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  tableNumber?: string;
  partySize: number;
  date: Date;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

class ReservationReminder {
  private settings: ReservationReminderSettings = {
    enabled: true,
    timing: 2,
    reminderTypes: {
      before30min: true,
      before1hour: true,
      before2hours: false
    }
  };
  private checkInterval: number | null = null;
  private sentReminders: Set<string> = new Set();

  constructor() {
    this.loadSettings();
    this.startReminderCheck();
  }

  // 설정 로드
  private loadSettings() {
    try {
      const saved = localStorage.getItem('reservationReminderSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('예약 리마인드 설정 로드 실패:', error);
    }
  }

  // 설정 저장
  private saveSettings() {
    try {
      localStorage.setItem('reservationReminderSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('예약 리마인드 설정 저장 실패:', error);
    }
  }

  // 리마인드 체크 시작
  private startReminderCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    if (!this.settings.enabled) {
      return;
    }

    // 1분마다 예약 확인
    this.checkInterval = setInterval(() => {
      this.checkReservations();
    }, 60000); // 1분 = 60000ms
  }

  // 예약 확인 및 리마인드 발송
  private async checkReservations() {
    try {
      // 현재 시간
      const now = new Date();
      const currentTime = now.getTime();

      // 오늘 날짜의 예약만 확인
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 예약 데이터는 Firebase에서 가져와야 하므로
      // 이 함수는 외부에서 호출되어야 함
      console.log('예약 리마인드 체크 중...', now.toLocaleString());
    } catch (error) {
      console.error('예약 리마인드 체크 실패:', error);
    }
  }

  // 예약 리마인드 확인 (외부에서 호출)
  async checkReservationReminders(reservations: Reservation[]) {
    if (!this.settings.enabled) {
      return;
    }

    const now = new Date();
    const currentTime = now.getTime();

    for (const reservation of reservations) {
      if (reservation.status !== 'confirmed') {
        continue;
      }

      // 예약 시간 계산
      const reservationDate = new Date(reservation.date);
      const [hours, minutes] = reservation.time.split(':').map(Number);
      reservationDate.setHours(hours, minutes, 0, 0);
      
      const reservationTime = reservationDate.getTime();
      const timeDiff = reservationTime - currentTime;

      // 리마인드 시간 체크 (밀리초 단위)
      const reminderTimes = {
        before30min: 30 * 60 * 1000,  // 30분
        before1hour: 60 * 60 * 1000,  // 1시간
        before2hours: 2 * 60 * 60 * 1000  // 2시간
      };

      for (const [reminderType, reminderTime] of Object.entries(reminderTimes)) {
        if (!this.settings.reminderTypes[reminderType as keyof typeof this.settings.reminderTypes]) {
          continue;
        }

        // 리마인드 발송 시점 확인 (5분 오차 허용)
        const reminderKey = `${reservation.id}-${reminderType}`;
        if (this.sentReminders.has(reminderKey)) {
          continue;
        }

        if (timeDiff > 0 && timeDiff <= reminderTime && timeDiff > reminderTime - 5 * 60 * 1000) {
          await this.sendReminder(reservation, reminderType);
          this.sentReminders.add(reminderKey);
        }
      }
    }
  }

  // 리마인드 발송
  private async sendReminder(reservation: Reservation, reminderType: string) {
    try {
      const reminderMessages = {
        before30min: '30분 후 예약입니다.',
        before1hour: '1시간 후 예약입니다.',
        before2hours: '2시간 후 예약입니다.'
      };

      const message = reminderMessages[reminderType as keyof typeof reminderMessages] || '예약 리마인드입니다.';

      // 브라우저 알림 발송
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('예약 리마인드', {
          body: `${reservation.customerName}님의 ${message}\n예약 시간: ${reservation.time}\n인원: ${reservation.partySize}명`,
          icon: '/favicon.ico',
          tag: `reservation-${reservation.id}`,
          requireInteraction: true
        });
      }

      // 토스트 알림 (컴포넌트에서 처리)
      console.log('예약 리마인드 발송:', {
        customerName: reservation.customerName,
        time: reservation.time,
        message: message
      });

    } catch (error) {
      console.error('리마인드 발송 실패:', error);
    }
  }

  // 브라우저 알림 권한 요청
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('알림 권한이 거부되었습니다.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      return false;
    }
  }

  // 설정 업데이트
  updateSettings(newSettings: Partial<ReservationReminderSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.startReminderCheck();
  }

  // 설정 가져오기
  getSettings(): ReservationReminderSettings {
    return { ...this.settings };
  }

  // 활성화/비활성화
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.saveSettings();
    this.startReminderCheck();
  }

  // 리마인드 타입 설정
  setReminderTypes(reminderTypes: Partial<ReservationReminderSettings['reminderTypes']>): void {
    this.settings.reminderTypes = { ...this.settings.reminderTypes, ...reminderTypes };
    this.saveSettings();
  }

  // 정리
  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// 싱글톤 인스턴스 생성
export const reservationReminder = new ReservationReminder();

// 예약 리마인드 확인 함수 (외부에서 호출)
export const checkReservationReminders = async (reservations: Reservation[]): Promise<void> => {
  await reservationReminder.checkReservationReminders(reservations);
};

// 알림 권한 요청 함수
export const requestNotificationPermission = async (): Promise<boolean> => {
  return await reservationReminder.requestNotificationPermission();
}; 