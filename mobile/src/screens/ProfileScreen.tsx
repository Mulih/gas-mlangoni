import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useCustomer } from "../context/CustomerContext";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";

const MENU_ITEMS = [
    { label: "Payment Methods", detail: "M-Pesa" },
    { label: "Notifications", detail: "Coming soon" },
    { label: "support", detail: "0700 000 000" },
    { label: "About Gas Mlangoni", detail: null },
];

export function ProfileScreen() {
    const { customer, logout } = useCustomer();

    function handleLogout() {
        // Confirm first - logging out clears logically-stored identity with
        // no undo, same reasoning as any destructive action needing a
        // deliberate second step.
        Alert.alert("Log Out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Log Out", style: "destructive", onPress: logout },
        ]);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Profile</Text>

            <View style={styles.card}>
                <Text style={styles.name}>{customer?.name || "Gas Mlangoni Customer"}</Text>
                <Text style={styles.phone}>{customer?.id ? "Registered" : ""}</Text>
            </View>

            {MENU_ITEMS.map((item) => (
                <View key={item.label} style={styles.menuItem}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.detail ? <Text style={styles.menuDetail}>{item.detail}</Text> : null}
                </View>
            ))}

            <Pressable style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({ 
    container: { flex: 1, alignItems: "center", justifyContent: "center" }, 
    header: { fontSize: 22, fontWeight: "800", color: colors.textPrimary, marginBottom: spacing[5] },
    card: { backgroundColor: colors.whiteSoft, borderRadius: radius.lg, padding: spacing[5], marginBottom: spacing[5] },
    name: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
    phone: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    menuItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    menuLabel: { fontSize: 14, color: colors.textPrimary },
    menuDetail: { fontSize: 13, color: colors.textMuted },
    logoutButton: { marginTop: spacing[8], alignItems: "center" },
    logoutText: { color: colors.error, fontWeight: "700", fontSize: 14 },
});
