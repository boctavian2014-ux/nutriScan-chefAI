import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingStep1 from "../screens/onboarding/OnboardingStep1";
import OnboardingStep2 from "../screens/onboarding/OnboardingStep2";
import type { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

type Props = {
  onFinished: () => void;
};

const OnboardingStack = ({ onFinished }: Props) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OnboardingStep1" component={OnboardingStep1} />
    <Stack.Screen name="OnboardingStep2">
      {(props) => <OnboardingStep2 {...props} onFinished={onFinished} />}
    </Stack.Screen>
  </Stack.Navigator>
);

export default OnboardingStack;
