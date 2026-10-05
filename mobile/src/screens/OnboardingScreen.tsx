import { useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolation } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

// image is no longer optional — all four slides now have real,
// text-free artwork (generated specifically to be used this way), so
// there's nothing left to fall back to.
type Slide = {
  image: ReturnType<typeof require>;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  { image: require("../../assets/onboarding/slide-1.png"), title: "Safe LPG Delivery,\nRight to Your Door.", description: "" },
  { image: require("../../assets/onboarding/slide-2.png"), title: "Quality You\nCan Trust", description: "Every cylinder is weight audited for your safety and peace of mind." },
  { image: require("../../assets/onboarding/slide-3.png"), title: "Fast & Reliable\nDelivery", description: "Get your LPG delivered at your convenience, right on time." },
  { image: require("../../assets/onboarding/slide-4.png"), title: "Certified &\nAudited", description: "We ensure genuine, safe, and high-quality LPG with every order." },
];

function PaginationDot({ index, scrollX, width }: { index: number; scrollX: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value, [(index - 1) * width, index * width, (index + 1) * width], [8, 20, 8], Extrapolation.CLAMP),
    opacity: interpolate(scrollX.value, [(index - 1) * width, index * width, (index + 1) * width], [0.3, 1, 0.3], Extrapolation.CLAMP),
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

// Simplified from before: no more if/else between "image, no text" and
// "no image, with text" — every slide now gets the SAME layout. Image
// sits in a contained 45%-height area (not full-bleed background
// anymore — that cover-crop math is gone, it was only ever needed for
// the old full-screen approach), text panel always renders below it.
function SlideContent({ slide, index, scrollX, width }: { slide: Slide; index: number; scrollX: SharedValue<number>; width: number }) {
  const rImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scrollX.value, [(index - 1) * width, index * width, (index + 1) * width], [0.8, 1, 0.8], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.imageArea}>
        {/* Animated.Image, not plain Image — this is what lets the
            scale-on-scroll animation (rImageStyle) actually apply to
            it, same pattern as Animated.View elsewhere in this file. */}
        <Animated.Image source={slide.image} style={[styles.image, rImageStyle]} resizeMode="cover" />
      </View>
      <View style={styles.textPanel}>
        <Text style={styles.title}>{slide.title}</Text>
        {slide.description ? <Text style={styles.description}>{slide.description}</Text> : null}
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
        <Pressable style={({ pressed }) => [styles.nextButton, pressed && { opacity: 0.8 }]} onPress={handleNext}>
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
  image: { width: "220%", height: "220%" },
  // Fixed: was "rgba(255,255,255,0.6" — missing its closing paren,
  // which is an invalid color string. Harmless-looking typo that would
  // likely make this text render in some fallback color instead of the
  // intended translucent white.
  skipText: { color: "rgba(255,255,255,0.6)", fontWeight: "500", fontSize: 14, letterSpacing: 0.5 },
  textPanel: { width: "100%", marginTop: 32, alignItems: "flex-start" },
  title: { color: colors.white, fontSize: 30, fontWeight: "700", letterSpacing: -0.5, lineHeight: 34 },
  description: { color: "rgba(255,255,255,0.6)", fontSize: 16, marginTop: 16, lineHeight: 26, fontWeight: "300" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 32, paddingBottom: 48, paddingTop: 16 },
  dots: { flexDirection: "row", gap: 8 },
  dot: { height: 8, borderRadius: 999, backgroundColor: colors.primary },
  nextButton: { width: 56, height: 56, backgroundColor: colors.primary, borderRadius: 28, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
  nextButtonText: { color: colors.white, fontSize: 20, fontWeight: "700" },
});