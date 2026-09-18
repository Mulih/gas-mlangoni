import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { api, ApiError } from "../api/client";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = NativeStackScreenProps<RootStackParamList, "Payment">;
type PaymentState = "idle" | "initiating" | "waiting" | "success" | "failed" | "error";

export function PaymentScreen({ route, navigation }: Props) {
    const { orderId, totalAmount } = route.params;
    const [state, setState] = useState<PaymentState>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // a ref, not state - this value never needs to trigger a re-render
    // itself, it just needs to survive across renders so cleanupp can find it.
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // if this screen is ever left mid-poll, stop it - otherwise it
        // keeps firing requests for a screen nobody's looking at.
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    async function handlePay() {
        setState("initiating");
        setErrorMessage(null);
        try {
            await api.post(`/orders/${orderId}/pay`, {});
            setState("waiting");
            startPolling();
        } catch (err) {
            setState("error");
            setErrorMessage(err instanceof ApiError ? err.message : "Failed to start payment");
        }
    }

    function startPolling() {
        let attempts = 0;
        // Every 3s, up to 20 times (1 minute) - confirmed when I
        // testing Daraja: confirmation arrives asynchronously,
        // seconds to tens of seconds later, never instantly
        pollRef.current = setInterval(async () => {
            attempts++;
            try {
                const order = await api.get<{ status: string }>(`/orders/${orderId}`);
                if (order.status === "ESCROW_HELD") {
                    clearInterval(pollRef.current!);
                    setState("success");
                } else if (order.status === "CANCELLED" || order.status === "REFUNDED") {
                    clearInterval(pollRef.current!);
                    setState("failed");
                }
                // Any other status: still waiting, expected , keep polling.
            } catch {
                // one failed poll isn't fatal - try again next tick.
            }
            if (attempts >= 20) {
                clearInterval(pollRef.current!);
                // Daraja's sandbox callback delivery is genuinelyy unreliable
                // a timout here can be real-worl flakiness, not necessarily our bug.
                setState("failed");
            }
        }, 3000);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.amount}>Ksh {totalAmount}</Text>
            <Text style={styles.subtitle}>Total amount due</Text>

            {state === "idle" && <PrimaryButton title="Pay with M-Pesa" onPress={handlePay} />}

            {(state === "initiating" || state === "waiting") && (
                <View style={styles.statusBox}>
                    <ActivityIndicator color={colors.primary} size="large" />
                    <Text style={styles.statusText}>{state === "initiating" ? "sending payment request..." : "Check your phone and enter your M-Pesa PIN"}</Text>
                </View>
            )}

            {state === "success" && (
                <View style={styles.statusBox}>
                    <Text style={styles.successText}>Payment confirmed ✓</Text>
                    <PrimaryButton title="Done" onPress={() => navigation.navigate("Main")} />
                </View>
            )}

            {(state === "failed" || state === "error") && (
                <View style={styles.statusBox}>
                    <Text style={styles.error}>{errorMessage ?? "Payment wasn't confirmed. This can happen with real network delays - you can try again."}</Text>
                    <PrimaryButton title="Try Again" onPress={() => setState("idle")} />
                </View>
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", padding: spacing[6] },
    amount: { fontSize: 36, fontWeight: "900", "color": colors.textPrimary },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing[8] },
    statusBox: { alignItems: "center", gap: spacing[4], marginTop: spacing[6] },
    statusText: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
    successText: { fontSize: 18, fontWeight: "700", color: colors.success },
    error: { fontSize: 14, color: colors.error, textAlign: "center" },
});