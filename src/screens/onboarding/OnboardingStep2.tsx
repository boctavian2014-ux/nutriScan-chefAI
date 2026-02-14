import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import type { OnboardingStackParamList } from "../../navigation/types";
import { colors } from "../../constants/theme";
import ScreenLayout from "../../components/ScreenLayout";
import GlassCard from "../../components/GlassCard";
import { createUser } from "../../api/users";
import { upsertHealthProfile } from "../../api/healthProfiles";
import {
  setHasOnboarded,
  storeHealthProfile,
  storeUser
} from "../../storage/onboarding";
import type { Goal } from "../../types/domain";
import i18n from "../../i18n";

type Props = NativeStackScreenProps<OnboardingStackParamList, "OnboardingStep2"> & {
  onFinished: () => void;
};

const OnboardingStep2 = ({ route, onFinished }: Props) => {
  const { t } = useTranslation();
  const { name, age } = route.params;
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [error, setError] = useState<string | null>(null);

  const goalOptions = useMemo(
    () => [
      { value: "lose_weight" as Goal, label: t("goals.lose_weight") },
      { value: "build_muscle" as Goal, label: t("goals.build_muscle") },
      { value: "maintain" as Goal, label: t("goals.maintain") }
    ],
    [t]
  );

  const createUserMutation = useMutation({ mutationFn: createUser });
  const healthMutation = useMutation({ mutationFn: upsertHealthProfile });

  const onFinish = async () => {
    const weightNumber = Number(weight);
    if (!Number.isFinite(weightNumber) || weightNumber < 1 || weightNumber > 500) {
      setError(t("common.error"));
      return;
    }
    setError(null);
    const language = (i18n.language as "en" | "ro" | "bg") ?? "en";
    try {
      const userResponse = await createUserMutation.mutateAsync({
        name,
        age,
        weight: weightNumber,
        language
      });

      const user = userResponse.data;

      const healthResponse = await healthMutation.mutateAsync({
        userId: user.id,
        goals: [goal],
        allergies: [],
        healthConditions: []
      });

      await storeUser(user);
      await storeHealthProfile(healthResponse.data);
      await setHasOnboarded(true);
      onFinished();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("common.error");
      const isNetworkError =
        message === "Network request failed" ||
        message.toLowerCase().includes("network") ||
        message.toLowerCase().includes("fetch");
      if (isNetworkError) {
        const localUserId = `local-${Date.now()}`;
        const localHealthId = `local-health-${Date.now()}`;
        await storeUser({
          id: localUserId,
          name,
          age,
          weight: weightNumber,
          language
        });
        await storeHealthProfile({
          id: localHealthId,
          userId: localUserId,
          goals: [goal],
          allergies: [],
          healthConditions: []
        });
        await setHasOnboarded(true);
        onFinished();
      } else {
        setError(message);
      }
    }
  };

  return (
    <ScreenLayout>
      <GlassCard intensity={28}>
        <Text style={styles.title}>{t("onboarding.step2.title")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("onboarding.step2.weight")}
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />
        <Text style={styles.label}>{t("onboarding.step2.goal")}</Text>
        <View style={styles.goalContainer}>
          {goalOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.goalButton,
                goal === option.value && styles.goalButtonActive
              ]}
              onPress={() => setGoal(option.value)}
            >
              <Text
                style={[
                  styles.goalText,
                  goal === option.value && styles.goalTextActive
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={styles.button}
          onPress={onFinish}
          disabled={createUserMutation.isPending || healthMutation.isPending}
        >
          <Text style={styles.buttonText}>{t("onboarding.step2.finish")}</Text>
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
    marginBottom: 16,
    backgroundColor: colors.glassStrong,
    color: colors.text
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: colors.text
  },
  goalContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16
  },
  goalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassStrong,
    marginRight: 8,
    marginBottom: 8
  },
  goalButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  goalText: {
    color: colors.text
  },
  goalTextActive: {
    color: colors.textDark
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 999,
    alignItems: "center"
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

export default OnboardingStep2;
