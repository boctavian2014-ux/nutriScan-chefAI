import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import ScanScreen from "../screens/tabs/ScanScreen";
import IngredientDetailScreen from "../screens/scan/IngredientDetailScreen";
import type { ScanStackParamList } from "./types";
import { colors } from "../constants/theme";

const Stack = createNativeStackNavigator<ScanStackParamList>();

const ScanStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: "transparent" },
        headerBlurEffect: "dark"
      }}
    >
      <Stack.Screen
        name="ScanMain"
        component={ScanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="IngredientDetail"
        component={IngredientDetailScreen}
        options={{
          title: t("ingredientDetail.title"),
          headerBackTitle: t("ingredientDetail.back")
        }}
      />
    </Stack.Navigator>
  );
};

export default ScanStack;
