import { useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/tabs/HomeScreen";
import ScanStack from "./ScanStack";
import PantryScreen from "../screens/tabs/PantryScreen";
import ChefAIScreen from "../screens/tabs/ChefAIScreen";
import ProfileScreen from "../screens/tabs/ProfileScreen";
import type { MainTabParamList } from "./types";
import { colors } from "../constants/theme";

const Tab = createBottomTabNavigator<MainTabParamList>();

const iconMap: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> =
  {
    Home: "home",
    Scan: "scan",
    Pantry: "basket",
    ChefAI: "restaurant",
    Profile: "person"
  };

const tabKeyMap: Record<keyof MainTabParamList, string> = {
  Home: "home",
  Scan: "scan",
  Pantry: "pantry",
  ChefAI: "chef",
  Profile: "profile"
};

const MainTabs = () => {
  const { t } = useTranslation();
  const screenOptions = useMemo(
    () =>
      ({ route }: { route: { name: keyof MainTabParamList } }) => ({
        headerTitle: t(`tabs.${tabKeyMap[route.name]}`),
        tabBarLabel: t(`tabs.${tabKeyMap[route.name]}`),
        tabBarActiveTintColor: colors.primary,
        tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <Ionicons
            name={iconMap[route.name]}
            size={size}
            color={color}
          />
        )
      }),
    [t]
  );

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Scan"
        component={ScanStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Pantry" component={PantryScreen} />
      <Tab.Screen name="ChefAI" component={ChefAIScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;
