import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CustomerProvider, useCustomer } from "./src/context/CustomerContext";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { RegistrationScreen } from "./src/screens/RegistrationScreen";
import { OrderScreen } from "./src/screens/OrderScreen";
import { PaymentScreen } from "./src/screens/PaymentScreen";
import { MainTabs } from "./src/navigation/MainTabs";
import type { RootStackParamList } from "./src/navigation/types";
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans";
import { TrackingScreen } from "./src/screens/TrackingScreen";


const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { customer, isLoading } = useCustomer();
  if (isLoading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {customer ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Order" component={OrderScreen} options={{ headerShown: true, title: "Place Order" }} />
            <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: true, title: "Payment" }} />
            <Stack.Screen name="Tracking" component={TrackingScreen} options={{ headerShown: true, title: "Track Order" }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {

  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold });
  // Render nothing until fonts are ready, so text doesn't flash in the wrong font
  if (!fontsLoaded) return null;

  return (
    <CustomerProvider>
      <Navigation />
    </CustomerProvider>
  );
}