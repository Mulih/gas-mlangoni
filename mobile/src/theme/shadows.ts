import { Platform } from "react-native";

// This is the biggest real difference from CSS: box-shadow doesnt exist
// in React Native at all. iOS wants four separate properties; Android
// Ignores those entirely and wants one number, "elevation" instead.
// Platform.select picks the right shape automatically based on which
// phone the app is actually running on.
export const shadows = {
    sm: Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
        android: { elevation: 2 },
    }),
    md: Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 20 },
        android: { elevation: 6 },
    }),
    red: Platform.select({
        ios: { shadowColor: "#FF0000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 25 },
        android: { elevation: 8 },
    }),
};