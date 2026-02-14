import AsyncStorage from "@react-native-async-storage/async-storage";
import type { HealthProfile, User } from "../types/domain";

const HAS_ONBOARDED_KEY = "hasOnboarded";
const USER_KEY = "localUser";
const HEALTH_KEY = "localHealthProfile";

export const getHasOnboarded = async () => {
  const value = await AsyncStorage.getItem(HAS_ONBOARDED_KEY);
  return value === "true";
};

export const setHasOnboarded = async (value: boolean) => {
  try {
    await AsyncStorage.setItem(HAS_ONBOARDED_KEY, value ? "true" : "false");
  } catch {
    // AsyncStorage unavailable; caller may handle
  }
};

export const storeUser = async (user: User) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // AsyncStorage unavailable
  }
};

export const storeHealthProfile = async (profile: HealthProfile) => {
  try {
    await AsyncStorage.setItem(HEALTH_KEY, JSON.stringify(profile));
  } catch {
    // AsyncStorage unavailable
  }
};

export const getStoredUser = async (): Promise<User | null> => {
  try {
    const value = await AsyncStorage.getItem(USER_KEY);
    return value ? (JSON.parse(value) as User) : null;
  } catch {
    return null;
  }
};

export const getStoredHealthProfile = async (): Promise<HealthProfile | null> => {
  try {
    const value = await AsyncStorage.getItem(HEALTH_KEY);
    return value ? (JSON.parse(value) as HealthProfile) : null;
  } catch {
    return null;
  }
};
