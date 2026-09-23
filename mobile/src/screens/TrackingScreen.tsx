import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TextInput } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { api, ApiError } from "../api/client";
import { Card } from "../components/Card";
import { StatusPill } from "../components/StatusPill";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";


type Props = NativeStackScreenProps<RootStackParamList, "Tracking">;

interface OrderWithRider {
    status: string;
    rider: { name: string; phone: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
    ESCROW_HELD: "Payment Confirmed", DISPATCHING: "Finding Rider", DISPATCH_TIMEOUT: "Delayed - Reassigning",
    ASSIGNED: "Rider Assigned", EN_ROUTE: "Out for Delivery", AUDIT_IN_PROGRESS: "Arriving",
    DELIVERED: "Delivered", PAYOUT_RELEASED: "Delivered", COMPLETED: "Completed",
};

export function TrackingScreen({ route }: Props) {
    const { orderId } = route.params;
    const [order, setOrder] = useState<OrderWithRider | null>(null);
    const [weightInput, setWeightInput] = useState("");
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Polling, no push mechanism exists yet
        async function poll() {
            try {
                setOrder(await api.get<OrderWithRider>(`/orders/${orderId}`));
            } catch {
                // one failed poll is fatal - the next tick tries again.
            }
        }
        poll();
        const interval = setInterval(poll, 4000);
        return () => clearInterval(interval);
    }, [orderId]);

    async function handleConfirmDelivery() {
        const measuredWeight = Number(weightInput);
        if (!measuredWeight || measuredWeight <= 0) {
            setError("Enter the weight shown on the rider's scale");
            return;
        }
        setConfirming(true);
        setError(null);
        try {
            setOrder(await api.patch<OrderWithRider>(`/orders/${orderId}/confirm-delivery`, { measuredWeight }));
        } catch (err) {
            setError (err instanceof ApiError ? err.message : "Failed to confirm delivery");
        } finally {
            setConfirming(false);
        }
    }

    if (!order) return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>;

    return (
        <View style={styles.container}>
            <Card style={styles.statusCard}>
                <Text style={styles.statusLabel}>Order Status</Text>
                <StatusPill label={STATUS_LABELS[order.status] ?? order.status} status={order.status} />
            </Card>

            {order.rider ? (
                <Card>
                    <Text style={styles.sectionLabel}>Your Rider</Text>
                    <Text style={styles.riderName}>{order.rider.name}</Text>
                    <Text style={styles.riderPhone}>{order.rider.phone}</Text>
                </Card>
            ) : (
                <Card><Text style={styles.waitingText}>Waiting for a rider to be assigned...</Text></Card>
            )}

            {order.status === "EN_ROUTE" && (
                <Card>
                    <Text style={styles.sectionLabel}>Confirm Delivery</Text>
                    <Text style={styles.helperText}>Enter the weight shown on the rider's scale to confirm your delivery.</Text>
                    <TextInput
                      style={styles.weightInput}
                      placeholder="e.g. 24.8"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      value={weightInput}
                      onChangeText={setWeightInput}
                    />
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    {confirming ? <ActivityIndicator color={colors.primary} /> : <PrimaryButton title="Confirm Delivery" onPress={handleConfirmDelivery} />}
                </Card>
            )}

            {order.status === " DELIVERED" && (
                <Card style={styles.successCard}><Text style={styles.successText}>Delivered ✓</Text></Card>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.whiteSoft, padding: spacing[5], gap: spacing[4] },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
    statusCard: { alignItems: "flex-start", gap: spacing[2] },
    statusLabel: { fontSize: 12, color: colors.textSecondary },
    sectionLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing[2] },
    riderName: { fontSize: 16, fontWeight: "700",color: colors.textPrimary },
    riderPhone: { fontSize: 13, color: colors.textSecondary },
    waitingText: { color: colors.textSecondary, fontSize: 13 },
    helperText: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing[3] },
    weightInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, padding: spacing[3], fontSize: 16, color: colors.textPrimary, marginBottom: spacing[3] },
    error: { color: colors.error, marginBottom: spacing[3], fontSize: 13 },
    successCard: { alignItems: "center" },
    successText: { fontSize: 18, fontWeight: "700", color: colors.success },
});