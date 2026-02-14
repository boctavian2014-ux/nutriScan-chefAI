import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { colors } from "../../constants/theme";
import ScreenLayout from "../../components/ScreenLayout";
import GlassCard from "../../components/GlassCard";

type Props = NativeStackScreenProps<OnboardingStackParamList, "OnboardingStep1">;

const OnboardingStep1 = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onNext = () => {
    const ageNumber = Number(age);
    if (!name.trim() || !Number.isFinite(ageNumber) || ageNumber < 1 || ageNumber > 120) {
      setError(t("common.error"));
      return;
    }
    setError(null);
    navigation.navigate("OnboardingStep2", { name: name.trim(), age: ageNumber });
  };

  return (
    <ScreenLayout>
      <GlassCard intensity={28}>
        <Text style={styles.title}>{t("onboarding.step1.title")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("onboarding.step1.name")}
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder={t("onboarding.step1.age")}
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>{t("onboarding.step1.next")}</Text>
        </TouchableOpacity>
      </GlassCard>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
    color: colors.text
  },
  input: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.glassStrong,
    color: colors.text
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8
  },
  buttonText: {
    color: colors.textDark,
    fontWeight: "600"
  },
  error: {
    color: colors.danger,
    marginBottom: 8
  }
});

export default OnboardingStep1;
