import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CustomerProvider, useCustomer } from "./src/context/CustomerContext";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { RegistrationScreen } from "./src/screens/RegistrationScreen";
import { MainTabs } from "./src/navigation/MainTabs";
import type { RootStackParamList } from "./src/navigation/types";


const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { customer, isLoading } = useCustomer();
  if (isLoading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={customer ? "Main" : "Onboarding"} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Registration" component={RegistrationScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <CustomerProvider>
      <Navigation />
    </CustomerProvider>
  );
}