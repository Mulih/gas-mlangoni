import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { StatusPill } from "../components/StatusPill";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

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
});