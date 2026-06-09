import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendExpenseNotification(amount, category) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Shpenzim i shtuar',
      body: `€${Number(amount).toFixed(2)} për ${category} u regjistrua me sukses.`,
      sound: true,
    },
    trigger: null,
  });
}

export async function sendBudgetWarningNotification(spent, budget) {
  const pct = Math.round((spent / budget) * 100);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Kujdes — Buxheti po mbaron!',
      body: `Ke shpenzuar ${pct}% të buxhetit mujor (€${spent.toFixed(2)} / €${budget.toFixed(2)}).`,
      sound: true,
    },
    trigger: null,
  });
}
