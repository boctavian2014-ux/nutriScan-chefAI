import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import RootNavigator from "./src/navigation/RootNavigator";
import { queryClient } from "./src/api/queryClient";
import i18n from "./src/i18n";

enableScreens();

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RootNavigator />
          <StatusBar style="auto" />
        </I18nextProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
