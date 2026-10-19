import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import type { MainTabParamList } from "./types";
import { HomeScreen } from "../screens/HomeScreen";
import { OrdersScreen } from "../screens/OrdersScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

const Tab = createBottomTabNavigator<MainTabParamList>();

// Icon names types so a typo is compile error, not blank icon
type IconName = keyof typeof Ionicons.glyphMap;

// Filled icon when the tab is selcected, outline when it isn't, as in the mockup .
// wallet entry will be here once jambopay account is verified
const TAB_ICONS: Record<keyof MainTabParamList, { active: IconName; inactive: IconName }> = {
    Home: { active: "home", inactive: "home-outline" },
    Orders: { active: "document-text", inactive: "document-text-outline" },
    Profile: { active: "person", inactive: "person-outline" },
};

export function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: { fontFamily: fonts.semiBold, fontSize: 11 },
                tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.borderLight },
                tabBarIcon: ({ focused, color, size }) => (
                    <Ionicons name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive} size={size} color={color} />
                ),
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Orders" component={OrdersScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            
        </Tab.Navigator> 
    )
}