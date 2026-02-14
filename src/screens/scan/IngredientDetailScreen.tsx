import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ScanStackParamList } from "../../navigation/types";
import { colors } from "../../constants/theme";
import ScreenLayout from "../../components/ScreenLayout";
import GlassCard from "../../components/GlassCard";

type Props = NativeStackScreenProps<ScanStackParamList, "IngredientDetail">;

const IngredientDetailScreen = ({ route }: Props) => {
  const { t } = useTranslation();
  const { ingredient } = route.params;

  return (
    <ScreenLayout>
      <GlassCard intensity={28}>
        <Text style={styles.title}>{t("ingredientDetail.title")}</Text>
        <Text style={styles.ingredientName}>{ingredient}</Text>
        <Text style={styles.description}>
          {t("ingredientDetail.description")}
        </Text>
      </GlassCard>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: 8,
    textTransform: "uppercase"
  },
  ingredientName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16
  },
  description: {
    fontSize: 16,
    color: colors.muted,
    lineHeight: 24
  }
});

export default IngredientDetailScreen;
