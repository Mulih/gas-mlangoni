// Core building blocks: View = box, Text = all text, Pressable = tappable, Alert = native popup, ScrollView = scrolls if content is tall.
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
// Keeps content below the notch / status bar (react-native's own SafeAreaView is deprecated).
import { SafeAreaView } from "react-native-safe-area-context";
// Icon set already used in MainTabs.tsx.
import { Ionicons } from "@expo/vector-icons";
// Gives us the logged-in customer and the logout function.
import { useCustomer } from "../context/CustomerContext";
// Your reusable white bordered card with the standard shadow.
import { Card } from "../components/Card";
// Design tokens: colors, spacing, corner radius, fonts and text styles.
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";
import { fonts, type } from "../theme/typography";

// Turns "Alvin Mulih" into "AM"; falls back to "G" when there is no name.
function getInitials(name?: string) {
    const initials = (name ?? "")   // use "" if name is undefined, so .trim() can't crash
        .trim()                     // remove spaces at both ends
        .split(/\s+/)               // split on any run of spaces -> ["Alvin", "Mulih"]
        .filter(Boolean)            // drop empty strings left by odd spacing
        .map((part) => part[0])     // take the first letter of each word
        .join("")                   // glue the letters together -> "AM"
        .slice(0, 2)                // keep at most two letters
        .toUpperCase();             // make them capitals
    return initials || "G";         // empty result -> "G" for Gas
}

export function ProfileScreen() {
    // customer = who is logged in (id, name, token); logout = clears them and returns to onboarding.
    const { customer, logout } = useCustomer();

    function handleLogout() {
        // Confirm first: logging out wipes stored identity and can't be undone.
        Alert.alert("Log out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },                          // closes the popup, does nothing else
            { text: "Log out", style: "destructive", onPress: logout },    // red button on iOS; runs logout
        ]);
    }

    return (
        // edges={["top"]}: the tab bar already handles the bottom, so only pad the top.
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            {/* contentContainerStyle styles the inside of the scroll area (padding goes here). */}
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Screen title */}
                <Text style={styles.header}>Profile</Text>

                {/* Identity card: avatar | name + badge | edit pencil, laid out in a row */}
                <Card style={styles.identityCard}>
                    {/* Red circle holding the initials */}
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(customer?.name)}</Text>
                    </View>
                    {/* flex: 1 makes this take the leftover width, so long names can't push the pencil off-screen */}
                    <View style={styles.identityText}>
                        <Text style={styles.name} numberOfLines={1}>
                            {customer?.name || "Gas Mlangoni customer"}
                        </Text>
                        {/* Badge only appears once registration gave the customer an id */}
                        {customer?.id ? (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Registered</Text>
                            </View>
                        ) : null}
                    </View>
                    {/* Placeholder: real edit screen comes later. hitSlop widens the tap area beyond the tiny icon. */}
                    <Pressable hitSlop={8} onPress={() => Alert.alert("Edit profile", "Coming soon.")} style={styles.editButton}>
                        <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                    </Pressable>
                </Card>

                {/* Outlined red logout button; style as a function so we can react to the pressed state */}
                <Pressable
                    onPress={handleLogout}
                    style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
                >
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                    <Text style={styles.logoutText}>Log out</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.white },                             // fill the screen, white page
    container: { padding: spacing[5], paddingBottom: spacing[10] },                   // 20px sides, extra bottom room above the tab bar
    header: { ...type.display, color: colors.textPrimary, marginBottom: spacing[5] }, // ...type.display copies font/size/lineHeight in

    identityCard: { flexDirection: "row", alignItems: "center", marginBottom: spacing[6] }, // children side by side, vertically centered
    avatar: {
        width: 64,                          // 64x64 box...
        height: 64,
        borderRadius: radius.pill,          // ...with a huge radius = perfect circle
        backgroundColor: colors.primary,    // brand red
        alignItems: "center",               // center initials horizontally
        justifyContent: "center",           // center initials vertically
        marginRight: spacing[4],            // gap between avatar and text
    },
    avatarText: { ...type.title, color: colors.white },                               // white initials
    identityText: { flex: 1 },                                                        // take the remaining row width
    name: { ...type.heading, color: colors.textPrimary, marginBottom: spacing[1] },   // customer name
    badge: {
        alignSelf: "flex-start",                    // shrink to text width instead of stretching
        backgroundColor: `${colors.success}20`,     // "#16A34A" + "20" = green at ~12% opacity (same trick as StatusPill)
        borderRadius: radius.pill,                  // pill shape
        paddingHorizontal: spacing[3],
        paddingVertical: 4,
    },
    badgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.success },       // small green text
    editButton: { padding: spacing[2] },                                              // padding = bigger touch target

    logoutButton: {
        flexDirection: "row",               // icon and label side by side
        alignItems: "center",
        justifyContent: "center",
        gap: spacing[2],                    // space between icon and label
        minHeight: 48,                      // comfortable tap height
        borderRadius: radius.md,
        borderWidth: 1,                     // outline only...
        borderColor: colors.error,          // ...in red
    },
    logoutButtonPressed: { backgroundColor: colors.errorTint },                       // light red wash while pressed
    logoutText: { ...type.label, fontFamily: fonts.bold, color: colors.error },       // red bold label
});