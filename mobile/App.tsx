import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { RegistrationScreen } from "./src/screens/RegistrationScreen";
import type { RootStackParamList } from "./src/navigation/types";
import { HomeScreen } from "./src/screens/HomeScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      {/* headerShown: false - the design has no native header bar on
          these full-bleed dark onboarding sites */}
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
    </NavigationContainer>
  );
}