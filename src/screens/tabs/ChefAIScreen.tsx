import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { generateChefRecipe } from "../../api/chef";
import { colors } from "../../constants/theme";
import ScreenLayout from "../../components/ScreenLayout";
import GlassCard from "../../components/GlassCard";
import { getStoredUser } from "../../storage/onboarding";
import type { ChefRecipe, User } from "../../types/domain";

const ChefAIScreen = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [input, setInput] = useState("");
  const [recipe, setRecipe] = useState<ChefRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStoredUser().then(setUser).catch(() => setUser(null));
  }, []);

  const mutation = useMutation({
    mutationFn: ({ userId, ingredients }: { userId: string; ingredients: string[] }) =>
      generateChefRecipe(userId, ingredients),
    onSuccess: (data) => {
      setRecipe(data.data);
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : t("common.error"));
    }
  });

  const onGenerate = () => {
    if (!user?.id) {
      return;
    }
    const ingredients = input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (ingredients.length === 0) {
      return;
    }

    mutation.mutate({ userId: user.id, ingredients });
  };

  return (
    <ScreenLayout>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("chef.title")}</Text>
        <GlassCard style={styles.heroCard} intensity={28}>
          <TextInput
            style={styles.input}
            placeholder={t("chef.placeholder")}
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity style={styles.button} onPress={onGenerate}>
            <Text style={styles.buttonText}>{t("chef.generate")}</Text>
          </TouchableOpacity>
        </GlassCard>

        {mutation.isPending ? (
          <Text style={styles.muted}>{t("common.loading")}</Text>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {recipe ? (
          <GlassCard style={styles.card}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <Text style={styles.muted}>{recipe.description}</Text>
            <Text style={styles.section}>Ingredients</Text>
            {recipe.ingredients.map((item, index) => (
              <Text key={`ing-${index}-${item}`} style={styles.listItem}>
                • {item}
              </Text>
            ))}
            <Text style={styles.section}>Steps</Text>
            {recipe.steps.map((item, index) => (
              <Text key={`${item}-${index}`} style={styles.listItem}>
                {index + 1}. {item}
              </Text>
            ))}
          </GlassCard>
        ) : null}
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
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    color: colors.text
  },
  heroCard: {
    marginBottom: 16
  },
  input: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.glassStrong,
    color: colors.text,
    minHeight: 90
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 12
  },
  buttonText: {
    color: colors.textDark,
    fontWeight: "600"
  },
  muted: {
    color: colors.muted
  },
  errorText: {
    color: colors.danger,
    marginTop: 8,
    marginBottom: 8
  },
  card: {
    marginTop: 4
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: colors.text
  },
  section: {
    marginTop: 12,
    fontWeight: "600",
    color: colors.text
  },
  listItem: {
    marginTop: 4,
    color: colors.text
  }
});

export default ChefAIScreen;
