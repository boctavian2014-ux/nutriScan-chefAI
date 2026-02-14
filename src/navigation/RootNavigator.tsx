import { NavigationContainer } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { getHasOnboarded } from "../storage/onboarding";
import { LoadingScreen } from "../components/LoadingScreen";
import MainTabs from "./MainTabs";
import OnboardingStack from "./OnboardingStack";

const RootNavigator = () => {
  const [ready, setReady] = useState(false);
  const [hasOnboarded, setHasOnboardedState] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const flag = await getHasOnboarded();
        setHasOnboardedState(flag);
      } catch {
        setHasOnboardedState(false);
      } finally {
        setReady(true);
      }
    };
    load();
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {hasOnboarded ? (
        <MainTabs />
      ) : (
        <OnboardingStack onFinished={() => setHasOnboardedState(true)} />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;
