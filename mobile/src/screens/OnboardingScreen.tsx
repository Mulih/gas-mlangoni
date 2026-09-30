import { useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Image, ImageBackground, useWindowDimensions } from "react-native";
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolation } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
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
type Slide = {
   image?: ReturnType<typeof require>; 
   plaholderIcon?: keyof typeof Ionicons.glyphMap;
   title: string; 
   description: string;
   showTextPanel: boolean;
};

const SLIDES: Slide[] = [
    { image: require("../../assets/onboarding/slide-1.png"), title: "Safe LPG Delivery,\nRight to Your Door.", description: "", showTextPanel: false },
    { image: require("../../assets/onboarding/slide-2.png"), title: "Quality You\nCan Trust", description: "Every cylinder is weight audited for your safety and peace of mind.", showTextPanel: false },
    { plaholderIcon: "bicycle", title: "Fast & Reliable\nDelivery", description: "Get your LPG delivered at your convenience, right on time.", showTextPanel: true },
    { plaholderIcon: "shield-checkmark", title: "Certified &\nAudited", description: "We ensure genuine, safe, and hig-quality LPG with every order.", showTextPanel: true },
];

// Extracted so each dot can independently read the shared scroll
// position - a component-per-dot is what lets each one animate on its
// own rather one style object trying to describe all of them at once
function PaginationDot({ index, scrollX, width }: { index: number; scrollX: SharedValue<number>; width: number }) {
    const style = useAnimatedStyle(() => ({
        width: interpolate(scrollX.value, [(index - 1) * width, index * width, (index + 1) * width], [8, 20, 8], Extrapolation.CLAMP),
        opacity: interpolate(scrollX.value, [(index - 1) * width, index * width, (index + 1) * width], [0.3, 1, 0.3], Extrapolation.CLAMP),
    }));
    return <Animated.View style={[styles.dot, style]} />;
}

function SlideContent({ slide, index, scrollX, width }: { slide: Slide; index: number; scrollX: SharedValue<number>; width: number }) {
    const rImageStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(scrollX.value, [(index - 1) * width, index * width, (index + 1) * width], [0.8,1, 0.8], Extrapolation.CLAMP) }],
    }));
    
    if (slide.image && !slide.showTextPanel) {

        const { width: screenWidth, height: screenHeight } = useWindowDimensions();
        const { width: iw, height: ih } = Image.resolveAssetSource(slide.image);
        const ratio = iw / ih;
        const widthIfHeightMatches = screenHeight * ratio;
        const w = widthIfHeightMatches >= screenWidth ? widthIfHeightMatches : screenWidth;
        const h = widthIfHeightMatches >= screenWidth ? screenHeight : screenWidth / ratio;
        return (
            <View style={[styles.slide, { width, overflow: "hidden" }]}>
                <Image source={slide.image} style={{ position: "absolute", bottom: 0, left: (screenWidth - w) / 2, width: w, height: h }} />
            </View>
        );
    }

    return (
        <View style={[styles.slide, { width }]}>
            <View style={styles.imageArea}>
                <Animated.View style={[styles.placeholderCircle, rImageStyle]}>
                    <Ionicons name={slide.plaholderIcon!} size={width * 0.22} color={colors.primary} />
                </Animated.View>
            </View>
            <View style={styles.textPanel}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>
            </View>
        </View>
    );
}



export function OnboardingScreen({ navigation }: Props) {
    const { width } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useSharedValue(0);
    const listRef = useRef<Animated.FlatList<Slide>>(null);
    

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => { scrollX.value = event.contentOffset.x; },
    });

    function handleMomentumEnd(e: { nativeEvent: { contentOffset: { x: number } } }) {
        setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
    }
    
    
    function handleNext() {
        if (currentIndex === SLIDES.length - 1) navigation.replace("Registration");
        else listRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.pageCounter}>{currentIndex + 1} / {SLIDES.length}</Text>
                <Pressable hitSlop={15} onPress={() => navigation.replace("Registration")}>
                    <Text style={styles.skipText}>SKIP</Text>
                </Pressable>
            </View>

            <Animated.FlatList
               ref={listRef}
               data={SLIDES}
               keyExtractor={(_, i) => String(i)}
               horizontal
               pagingEnabled
               showsHorizontalScrollIndicator={false}
               onScroll={scrollHandler}
               onMomentumScrollEnd={handleMomentumEnd}
               scrollEventThrottle={16}
               renderItem={({ item, index }) => <SlideContent slide={item} index={index} scrollX={scrollX} width={width} />}
            />

            <View style={styles.footer}>
                <View style={styles.dots}>
                    {SLIDES.map((_, i) => <PaginationDot key={i} index={i} scrollX={scrollX} width={width} />)}
                </View>
                <Pressable style={({ pressed }) => [styles.nextButton, pressed && { opacity: 0.8}]} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>→</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.blackSoft },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, zIndex: 10, position: "absolute", top: 0, left: 0, right: 0 },
    pageCounter: { color: colors.white, fontSize: 12, fontWeight: "600", opacity: 0.6 },
    slide: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, paddingTop: 48 },
    imageArea: { width: "100%", height: "45%", justifyContent: "center", alignItems: "center" },
    textSlideBody: { padding: spacing[6], paddingBottom: spacing[10] },
    skipText: { color: "rgba(255,255,255,0.6", fontWeight: "500", fontSize: 14, letterSpacing: 0.5 },
    placeholderCircle: { width: "60%", aspectRatio: 1, borderRadius: 999, backgroundColor: `${colors.primary}15`, justifyContent: "center", alignItems: "center" },
    textPanel: {width: "100%", marginTop: 32, alignItems: "flex-start" },
    title: { color: colors.white, fontSize: 30, fontWeight: "700", letterSpacing: -0.5, lineHeight: 34 },
    description: { color: "rgba(255,255,255,0.6)", fontSize: 16, marginTop: 16, lineHeight: 26, fontWeight: "300" },
    footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 32, paddingBottom: 48, paddingTop: 16 },
    dots: { flexDirection: "row", gap: 8 },
    dot: { height: 8, borderRadius: 999, backgroundColor: colors.primary },
    nextButton: { width: 56, height: 56, backgroundColor: colors.primary, borderRadius: 28, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
    nextButtonText: { color: colors.white, fontSize: 20, fontWeight: "700" },
});