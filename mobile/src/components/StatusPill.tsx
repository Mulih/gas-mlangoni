import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";

//--success/--error status colors and pill-shaped radius.
const STATUS_COLORS: Record<string, string> = {
    COMPLETED: colors.success, DELIVERED: colors.success, PAYOUT_RELEASED: colors.success,
    CANCELLED: colors.error, REFUNDED: colors.error, AUDIT_FAILED: colors.error, DISPATCH_TIMEOUT: colors.error,
};

export function StatusPill({ label, status }: { label: string, status: string }) {
    const color = STATUS_COLORS[status] ?? colors.primary; // default: still in progress
    return (
        <View style={[styles.pill, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.text, { color }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: { paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: radius.pill, alignSelf: "flex-start"},
    text: { fontSize: 11, fontWeight: "700" },
});