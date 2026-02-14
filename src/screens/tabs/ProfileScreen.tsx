import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/theme";
import ScreenLayout from "../../components/ScreenLayout";
import GlassCard from "../../components/GlassCard";
import {
  getStoredHealthProfile,
  getStoredUser
} from "../../storage/onboarding";
import type { HealthProfile, User } from "../../types/domain";

const ProfileScreen = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<HealthProfile | null>(null);

  useEffect(() => {
    getStoredUser().then(setUser).catch(() => setUser(null));
    getStoredHealthProfile().then(setHealth).catch(() => setHealth(null));
  }, []);

  return (
    <ScreenLayout>
      <Text style={styles.title}>{t("profile.title")}</Text>
      <GlassCard>
        <Text style={styles.label}>{t("profile.name")}</Text>
        <Text style={styles.value}>{user?.name ?? "-"}</Text>
        <Text style={styles.label}>{t("profile.age")}</Text>
        <Text style={styles.value}>{user?.age ?? "-"}</Text>
        <Text style={styles.label}>{t("profile.weight")}</Text>
        <Text style={styles.value}>{user?.weight ?? "-"}</Text>
        <Text style={styles.label}>{t("profile.language")}</Text>
        <Text style={styles.value}>{user?.language ?? "-"}</Text>
        <Text style={styles.label}>{t("profile.healthGoals")}</Text>
        <Text style={styles.value}>{health?.goals?.join(", ") ?? "-"}</Text>
      </GlassCard>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    color: colors.text
  },
  label: {
    marginTop: 8,
    color: colors.muted
  },
  value: {
    color: colors.text,
    fontWeight: "500"
  }
});

export default ProfileScreen;
