import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PrimaryButton } from "./PrimaryButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";
import { type } from "../theme/typography";

// What happens when "Order now" is tapped.
interface HeroCardProps {
    onOrderPress: () => void;
}

export function HeroCard({ onOrderPress }: HeroCardProps) {
    return (
        // The dark card.
        <View style={styles.card}>
            {/* Cylinder render, pinned to the right edge. */}
            <Image
                source={require("../../assets/onboarding/slide-2.png")}
                style={styles.image}
                resizeMode="cover" 
            />
            {/* Fade from solid black to transparent */}
            <LinearGradient
                colors={[colors.blackDeep, colors.blackDeep, `${colors.blackDeep}00`]}
                locations={[0, 0.4, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fade}
                pointerEvents="none" 
            />

            {/* Text and button sit on top because they come later in the layout order. */}
            <View style={styles.content}>
                <Text style={styles.label}>Certified LPG</Text>
                {/* \n forces the line breaks we want. */}
                <Text>{"Delivered to\nyour door."}</Text>
                {/* Wraapper with alignSelf so the button shrinks to its text instead of stretching across the card. */}
                <View style={styles.buttonWrap}>
                    <PrimaryButton title="Order now" onPress={onOrderPress} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.blackDeep,  // the near-black base
        borderRadius: radius.xl,    // big rounded corners
        overflow: "hidden",     // clip the image and fade to those corners
        padding: spacing[6],
    },
    image: {
        position: "absolute",    // take the image out of the normal layout
        top: 0,         // stretch from the top
        bottom: 0,      // ...to the bottom of the card
        right: 0,       // pinned to the right edge
        width: "70%"    // covers the right 70 of the card
    },
    fade: {
        position: "absolute",       // overlays the image
        top: 0,
        bottom: 0,
        left: 0,                    // from the left edge...
        width: "75%"                // ...across 75% of the card, so it overlaps the image's left part
    },
    content: { maxWidth: "62%" },   // keep the text out of the cylinder's way
    label: { ...type.label, color: colors.textMuted, marginBottom: spacing[2] },    // small grey "Certified LPG"
    title: { ...type.title, color: colors.white, marginBottom: spacing[5] },    // white two-line headline
    buttonWrap: { alignSelf: "flex-start" },
});