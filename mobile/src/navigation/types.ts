// The types menu of every screen in the root stack , and what data (if
// any) each expects when navigated to. `undefined` means "takes no
// parameters."
export type RootStackParamList = {
    Onboarding: undefined;
    Registration: undefined;
    Home: { customerId: string };
};