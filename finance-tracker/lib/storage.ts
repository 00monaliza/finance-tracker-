import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_ID: '@finance_tracker:user_id',
  PHONE: '@finance_tracker:phone',
};

export const storage = {
  async getUserId(): Promise<number | null> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    return value ? parseInt(value, 10) : null;
  },

  async setUserId(userId: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId.toString());
  },

  async getPhone(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.PHONE);
  },

  async setPhone(phone: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PHONE, phone);
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER_ID, STORAGE_KEYS.PHONE]);
  },
};
