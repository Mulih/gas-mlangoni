import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {MainTabParamList, RootStackParamList } from "../navigation/types";
import { useCustomer } from "../context/CustomerContext";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";
import { Ionicons } from "@expo/vector-icons";


// CompositeScreenProps, not a plain NativeStackScreenProps or
// BottomTabScreenProps alone: HomeScreen lives INSIDE the tab navigator
// (so it needs tab-shaped navigation for things like switching to the 
// orders tab), bur it also needs to reach screens that only exist on the
// the OUTER root stack (like "Order") - Composite combines both
// permissions into one correctly-typed navigation prop.
type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
    const { customer } = useCustomer();

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <View style={styles.header}>
                <Ionicons name="menu" size={24} color={colors.textPrimary} />
                <Text style={styles.logo}>
                    GAS <Text style={styles.logoAccent}>MLANGONI</Text>
                </Text>
                <View>
                    <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
                </View>
            </View>
        

            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={styles.greeting}>Good Afternoon{customer?.name ? `, ${customer.name}` : ""} 👋</Text>
                <Text style={styles.subtitle}>Clean energy. A safer home.</Text>

                <View style={styles.heroCard}>
                    <Text style={styles.heroLabel}>Certified LPG</Text>
                    <Text style={styles.heroTitle}>Delivered to{"\n"}Your Door.</Text>
                </View>

                {/* KNOWN GAP: "Order Gas" has nowhere real to navigate yet - no
                    catalog GET endpoint exists on the backend yet, so theres nothing
                    to browse. This is the next thing to build not something to 
                    fake here. "Weight Audit" is deliberately absent entirely -
                    it depends on the dispatch/delivery backend
                */}
                <View style={styles.quickActions}>
                    <QuickAction icon="🔥" label="Order Gas" onPress={() => navigation.navigate("Order")} />
                    <QuickAction icon="📍" label="Track Order" />
                    <QuickAction icon="📦" label="My Orders" />
                </View>
            </ScrollView>
        </View>
    );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
    return (
        <Pressable style={styles.quickAction} onPress={onPress} disabled={!onPress}>
            <Text style={styles.quickIcon}>{icon}</Text>
            <Text style={styles.quickLabel}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    header: {flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 56, paddingHorizontal: spacing[5] },
    container: { flex: 1, backgroundColor: colors.white },
    content: { padding: spacing[5] },
    greeting: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
    subtitle: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing[5] },
    heroCard: { backgroundColor: colors.blackDeep, borderRadius: radius.xl, padding: spacing[6], marginBottom: spacing[5] },
    heroLabel: { color: colors.textMuted, fontSize: 13, marginBottom: spacing[2] },
    heroTitle: { color: colors.white, fontSize: 25, fontWeight: "800" },
    quickActions: { flexDirection: "row", gap: spacing[3] },
    quickAction: { flex: 1, alignItems: "center", gap: spacing[2], padding: spacing[3], borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md },
    quickIcon: { fontSize: 24 },
    quickLabel: { fontSize: 11, fontWeight: "700", color: colors.textPrimary, textAlign: "center" },
    logo: { fontSize: 18, fontWeight: "900", color: colors.textPrimary },
    logoAccent: { color: colors.primary },
    notificationDot: { position: "absolute", width: 7, height: 7, right: 1, top: 1, borderRadius: 4, backgroundColor: colors.primary },
});