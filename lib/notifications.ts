import { Capacitor } from '@capacitor/core';
import type { FoodItem } from './types';

const NOTIFICATION_ID = 1001;

// 다음 오전 9시 Date 객체 반환
function getNext9AM(): Date {
  const now = new Date();
  const next9 = new Date();
  next9.setHours(9, 0, 0, 0);
  if (now >= next9) {
    next9.setDate(next9.getDate() + 1);
  }
  return next9;
}

// 알림에 표시할 대상 날짜 (9시 전이면 오늘, 9시 이후면 내일)
function getTargetDate(): string {
  const now = new Date();
  const target = new Date();
  if (now.getHours() >= 9) {
    target.setDate(target.getDate() + 1);
  }
  return target.toISOString().split('T')[0];
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleExpiryNotification(items: FoodItem[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    // 기존 예약된 알림 취소
    try {
      await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
    } catch {}

    const targetDate = getTargetDate();
    const expiring = items.filter(
      (item) => !item.consumed && !item.wasted && item.expiryDate === targetDate
    );

    if (expiring.length === 0) return;

    const nameList = expiring.slice(0, 3).map((i) => i.name).join(', ');
    const extra = expiring.length > 3 ? ` 외 ${expiring.length - 3}개` : '';

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          title: '🧊 오늘 소진 필요한 식품이 있어요!',
          body: `${nameList}${extra}을(를) 오늘 꼭 드세요.`,
          schedule: { at: getNext9AM() },
          smallIcon: 'ic_launcher_foreground',
          iconColor: '#2563EB',
        },
      ],
    });
  } catch (err) {
    console.error('[notifications] 알림 예약 오류:', err);
  }
}
