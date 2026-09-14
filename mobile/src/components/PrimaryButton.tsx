import { Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { shadows } from "../theme/shadows";
import { spacing } from "../theme/spacing"

interface Props {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: "primary" | "secondary" | "outline";
}

export function PrimaryButton({ title, onPress, disabled, variant = "primary" }: Props) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.base,
                variant === "secondary" && styles.secondary,
                variant === "outline" && styles.outline,
                pressed && styles.pressed,
                disabled && styles.disabled,
            ]}
        >
            <Text style={[styles.text, variant === "outline" && styles.outlineText]}>{title}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        minHeight: 48,
        paddingHorizontal: spacing[5],
        borderRadius: radius.md,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        ...shadows.red,
    },
    secondary: { backgroundColor: colors.black, shadowOpacity: 0, elevation: 0 },
    outline: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.primary, shadowOpacity: 0, elevation: 0 },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.45 },
    text: { color: colors.white, fontSize: 14, fontWeight: "700" },
    outlineText: { color: colors.primary },
});