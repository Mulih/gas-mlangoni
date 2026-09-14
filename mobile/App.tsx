import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text } from "react-native";

// A temporary placeholder to prove navigation is wired up
// correctly
function PlaceholderScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Navigation works</Text>
    </View>
  );
}

// createNativeStackNavigator() returns a matched pair: a Navigator
// (the container) and a Screen (how you register each screen inside
// it)
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // NavigationContainer has to wrap everything navigation-related
    // it's the piece that actually manages screen history and back
    // behavior, similar in spirit to how every Express route needed to
    // sit inside the one shared `app` instance
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Placeholder" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}