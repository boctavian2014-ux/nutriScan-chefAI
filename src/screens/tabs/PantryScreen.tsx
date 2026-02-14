import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getPantryItems } from "../../api/pantry";
import { colors } from "../../constants/theme";
import ScreenLayout from "../../components/ScreenLayout";
import GlassCard from "../../components/GlassCard";
import { getStoredUser } from "../../storage/onboarding";
import type { User } from "../../types/domain";

const PantryScreen = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getStoredUser().then(setUser).catch(() => setUser(null));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["pantry", user?.id],
    queryFn: () => getPantryItems(user?.id ?? ""),
    enabled: Boolean(user?.id)
  });

  const items = data?.data ?? [];

  const listHeader = (
    <>
      <Text style={styles.title}>{t("pantry.title")}</Text>
      {isLoading ? (
        <Text style={styles.muted}>{t("common.loading")}</Text>
      ) : items.length === 0 ? (
        <GlassCard>
          <Text style={styles.empty}>{t("pantry.empty")}</Text>
        </GlassCard>
      ) : null}
    </>
  );

  return (
    <ScreenLayout>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <Text style={styles.itemTitle}>{item.productId}</Text>
            <Text style={styles.muted}>
              {item.quantity} • {item.overallRiskLevel}
            </Text>
          </GlassCard>
        )}
      />
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
  muted: {
    color: colors.muted
  },
  empty: {
    fontSize: 14,
    color: colors.muted
  },
  list: {
    paddingBottom: 24,
    flexGrow: 1
  },
  card: {
    marginBottom: 12
  },
  itemTitle: {
    fontWeight: "600",
    color: colors.text
  }
});

export default PantryScreen;
