import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ImageBackground, useWindowDimensions } from "react-native";
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
type Slide = 
  | { image: ReturnType<typeof require> }
  | { title: string; description: string };

const SLIDES = [
    { image: require("../../assets/onboarding/slide-1.png") },
    { image: require("../../assets/onboarding/slide-2.png") },
    { title: "Fast & Reliable\nDelivery", description: "Get your LPG delivered at your convenience, right on time." },
    { title: "Certified &\nAudited", description: "We ensure genuine, safe, and hig-quality LPG with every order." },
];

// Renders one network slide, cropped from the top rather than centered,
// so the bottom of the image - where your text/logo sits - is always
// full visible regardless of how the screen's proportions compare to
// the artwork's
function ArtworkSlide({ source, overlay }: { source: ReturnType<typeof require>; overlay: React.ReactNode }) {
    const { width: screenWidth } = useWindowDimensions();

    // For a a require()'d local image, React Native's bundler embeds the
    // file's real pixel dimensions - this reads them directly rather than
    // us guessing what size the artwork was generated at.
    const { width: imageWidth, height: imageHeight } = Image.resolveAssetSource(source);

    // same scaling math "cover" does internally - scale so the image's
    // width exactly matches the screen's width.
    const scale = screenWidth / imageWidth;
    const scaledHeight = imageHeight * scale;

    return (
        // overflow: "hidden" is what actually oes the cropping - without
        // it, the oversized image would just spill past the screen's edges
        // instead of being clipped.
        <View>
            <Image
              source={source}
              style={{ position: "absolute", bottom: 0, width: screenWidth, height: scaledHeight }}
            />
            {overlay}
        </View>
    );
}

export function OnboardingScreen({ navigation }: Props) {
    const [index, setIndex] = useState(0);
    const isLastSlide = index === SLIDES.length - 1;
    const slide = SLIDES[index];
    const hasArtwork = "image" in slide;

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

    // Everything that sits ON TOP of a slide - Skip, the dots, the arrow -
    // is identical regardless of whether the slide underneath is artwork
    // or text. Oulling it into one variable avoids writing it out twice.
    const overlay = (
        <>
          {!isLastSlide && (
            <Pressable style={styles.skipButton} onPress={() => navigation.replace("Registration")}>
                <Text style={styles.skipText}>SKIP</Text>
            </Pressable>
          )}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
                <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>→</Text>
          </Pressable>
        </>
    );

    if (hasArtwork) {
        // Image bakground does the "fill the screen, crop if the aspect
        // ration doesnt match exactly" job for us - resizeMode="cover" is
        // the same concept as CSS's background-size: cover.
        return <ArtworkSlide source={slide.image} overlay={overlay} />
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.blackDeep, padding: spacing[6] }]}>
            <View style={styles.content}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>
            </View>
            {overlay}
        </View>
    )
    
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.blackDeep, justifyContent: "flex-end" },
    skipButton: { position: "absolute", top: 60, right: spacing[6] },
    skipText: { color: colors.white, fontWeight: "700", fontSize: 12 },
    content: { marginBottom: spacing[8] },
    title: { color: colors.white, fontSize: 28, fontWeight: "800", marginBottom: spacing[3] },
    description: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
    dots: { flexDirection: "row", gap: spacing[2], marginBottom: spacing[6] },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderDark },
    dotActive: { backgroundColor: colors.primary, width: 20 },
    nextButton: { position: "absolute", bottom: spacing[6], right: spacing[6], width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    nextButtonText: { color: colors.white, fontSize: 22, fontWeight: "700" },
});