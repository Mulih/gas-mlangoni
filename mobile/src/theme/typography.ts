// Font names
export const fonts = {
    regular: "PlusJakartaSans_400Regular",  // body text
    medium: "PlusJakartaSans_500Medium",    // captions
    semiBold: "PlusJakartaSans_600SemiBold",    // labels, buttons
    bold: "PlusJakartaSans_700Bold",    // section headings
    extraBold: "PlusJakartaSans_800ExtraBold",  // titles, prices
} as const;

// Ready-made text styles.
export const type = {
    display: { fontFamily: fonts.extraBold, fontSize: 30, lineHeight: 36, letterSpacing: -0.5 }, // onboarding headlines
    title: { fontFamily: fonts.extraBold, fontSize: 24, lineHeight: 30 }, // screen titles, greeting
    heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 }, // section headers
    body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 }, // normal text
    label: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 18 }, // buttons, list labels
    caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 }, // timestamps, hints
    price: { fontFamily: fonts.extraBold, fontSize: 15, lineHeight: 20 }, // KSh amounts
} as const;