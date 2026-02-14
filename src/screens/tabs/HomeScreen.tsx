import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/theme";
import ScreenLayout from "../../components/ScreenLayout";
import GlassCard from "../../components/GlassCard";
import { getStoredUser } from "../../storage/onboarding";
import type { User } from "../../types/domain";

const HomeScreen = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getStoredUser().then(setUser).catch(() => setUser(null));
  }, []);

  return (
    <ScreenLayout>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.heroCard} intensity={30}>
          <Text style={styles.heroTitle}>{t("home.title")}</Text>
          <Text style={styles.heroSubtitle}>
            {t("home.greeting")} {user?.name ?? ""}
          </Text>
          <TouchableOpacity style={styles.heroButton}>
            <Text style={styles.heroButtonText}>View insights</Text>
          </TouchableOpacity>
        </GlassCard>

        <View style={styles.grid}>
          <GlassCard style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Weekly scans</Text>
              <Ionicons name="scan" size={18} color={colors.muted} />
            </View>
            <Text style={styles.statValue}>12</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Pantry items</Text>
              <Ionicons name="basket" size={18} color={colors.muted} />
            </View>
            <Text style={styles.statValue}>8</Text>
          </GlassCard>

          <GlassCard style={styles.statCardWide}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Risk trend</Text>
              <Ionicons name="pulse" size={18} color={colors.muted} />
            </View>
            <Text style={styles.statValue}>Stable</Text>
            <Text style={styles.statNote}>No high-risk alerts this week.</Text>
          </GlassCard>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1
  },
  content: {
    paddingBottom: 24
  },
  heroCard: {
    marginTop: 8,
    marginBottom: 20
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.muted
  },
  heroButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  heroButtonText: {
    color: colors.textDark,
    fontWeight: "600",
    fontSize: 13
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  statCard: {
    width: "48%",
    marginBottom: 14
  },
  statCardWide: {
    width: "100%"
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  statLabel: {
    fontSize: 13,
    color: colors.muted
  },
  statValue: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "600",
    color: colors.text
  },
  statNote: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted
  }
});

export default HomeScreen;
