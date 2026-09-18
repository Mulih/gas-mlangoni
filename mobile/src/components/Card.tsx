import { View, StyleSheet, type ViewProps } from "react-native";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { shadows } from "../theme/shadows";
import { spacing } from "../theme/spacing";

// white surface, subtle border, moderate radius, soft shadow. 
// Every plain bordered box accross the app (order cards,
// address rows, the payment amount) should use this instead of
// one-off border styles, so a future visual tweak happens in
// one place, not five.
export function Card({ style, ...props }: ViewProps) {
    return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: radius.lg,
        padding: spacing[5],
        ...shadows.sm,
    },
});