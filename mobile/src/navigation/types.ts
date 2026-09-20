// The types menu of every screen in the root stack , and what data (if
// any) each expects when navigated to. `undefined` means "takes no
// parameters."
export type RootStackParamList = {
    Onboarding: undefined;
    Registration: undefined;
    Main: undefined;
    Order: undefined;
    Payment: { orderId: string; totalAmount: string };
    Tracking: { orderId: string };
};

export type MainTabParamList = {
    Home: undefined;
    Orders: undefined;
    Profile: undefined;
};