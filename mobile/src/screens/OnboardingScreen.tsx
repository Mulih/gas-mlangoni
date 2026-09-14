import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

// Gives this screen a correctly-typed `navigation` prop - one that only
// allows navigating to screen names that actually exist in
// RootStackParamList. A typo'd screen name here becomes a compile
// error, not a runtime crash.
type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

// Text only for now -  the rider/cylinder illustrations are a separate
// asset-creation task, not something to block navigation logic on.
const SLIDES = [
    { title: "Safe LPG Delivery,\nRight to your Door.", description: "" },
    { title: "Quality You\nCan Trust", description: "Every cylinder is weight audited for your safety and peace of mind." },
    { title: "Fast & Reliable\nDelivery", description: "Get your LPG delivered at your convenience, right on time." },
    { title: "Certified &\nAudited", description: "We ensure genuine, safe, and hig-quality LPG with every order." },
];

export function OnboardingScreen({ navigation }: Props) {
    const [index, setIndex] = useState(0);
    const isLastSlide = index === SLIDES.length - 1;

    function handleNext() {
        if (isLastSlide) {
            // .replace, not .navigate - removes Onboarding from the history
            // stack entirely, so pressing back from the Registration can't land
            // the user on it again
            navigation.replace("Registration");
        } else {
            setIndex(index + 1);
        }
    }

    return (
        <View style={styles.container}>
            {!isLastSlide && (
                <Pressable style={styles.skipButton} onPress={() => navigation.replace("Registration")}>
                    <Text style={styles.skipText}>SKIP</Text>
                </Pressable>
            )}

            <View style={styles.content}>
                <Text style={styles.title}>{SLIDES[index].title}</Text>
                {SLIDES[index].description ? <Text style={styles.description}>{SLIDES[index].description}</Text> : null}
            </View>

            <View style={styles.dots}>
                {SLIDES.map((_, i) => (
                    <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
                ))}
            </View>

            {/** A circular button, deliberately NOT the PrimaryButton component
             * - This shape appears nowhere else in the design et, so
             * extracting a shared component for one single use would be the
             * premature-abstraction trap we've avoided all session. */}
            <Pressable style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>→</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.blackDeep, padding: spacing[6], justifyContent: "flex-end" },
    skipButton: { position: "absolute", top: 60, right: spacing[6] },
    skipText: { color: colors.white, fontWeight: "700", fontSize: 12 },
    content: { marginBottom: spacing[8] },
    title: { color: colors.white, fontSize: 28, fontWeight: "800", marginBottom: spacing[3] },
    description: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
    dots: { flexDirection: "row", gap: spacing[2], marginBottom: spacing[6] },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderDark },
    dotActive: { backgroundColor: colors.primary, width: 20 },
    nextButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    nextButtonText: { color: colors.white, fontSize: 222, fontWeight: "700" },
});