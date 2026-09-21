import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable } from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { useCustomer } from "../context/CustomerContext";
import { api, ApiError } from "../api/client";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";
import { Card } from "../components/Card";
import { StatusPill } from "../components/StatusPill";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Orders">,
  NativeStackScreenProps<RootStackParamList>
>;

interface Order { id: string; brand: string; size: string; status: string; totalAmount: string; createdAt: string }

// Maps our 13 internal states to short customer-facing labels.
const STATUS_LABELS: Record<string, string> = {
  PLACED: "Placed", ESCROW_HELD: "Payment Confirmed", DISPATCHING: "Finding Rider",
  DISPATCH_TIMEOUT: "Delayed", ASSIGNED: "Rider Assigned", EN_ROUTE: "Out for Delivery",
  AUDIT_IN_PROGRESS: "Arriving", AUDIT_FAILED: "Under Review", DELIVERED: "Delivered",
  PAYOUT_RELEASED: "Delivered", COMPLETED: "Completed", CANCELLED: "Cancelled", REFUNDED: "Refunded",
};

export function OrdersScreen({ navigation }: Props) {
  const { customer } = useCustomer();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setOrders(await api.get<Order[]>(`/customers/${customer!.id}/orders`));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load orders");
    }
  }, [customer]);

  useEffect(() => { loadOrders().finally(() => setLoading(false)); }, [loadOrders]);

  async function handleCancel(orderId: string) {
    try {
      await api.patch(`/orders/${orderId}/cancel`, {});
      await loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to cancel order");
    }
  }

  

  if (loading) return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Orders</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
      style={{ flex: 1 }}
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadOrders(); setRefreshing(false); }} tintColor={colors.primary} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders yet.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Pressable onPress={() => item.status !== "PLACED" && navigation.navigate("Tracking", { orderId: item.id })}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.size} — {item.brand}</Text>
                <Text style={styles.cardAmount}>KSh {item.totalAmount}</Text>
              </View>
              <StatusPill label={STATUS_LABELS[item.status] ?? item.status} status={item.status} />
              <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </Pressable>
            {item.status === "PLACED" && (
              <Pressable style={styles.cancelButton} onPress={() => handleCancel(item.id)}>
                <Text style={styles.cancelText}>Cancel Order</Text>
              </Pressable>
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  header: { fontSize: 22, fontWeight: "800", color: colors.textPrimary, padding: spacing[5], paddingBottom: spacing[2] },
  listContent: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  emptyText: { color: colors.textSecondary, textAlign: "center", marginTop: spacing[8] },
  error: { color: colors.error, paddingHorizontal: spacing[5], fontSize: 13 },
  card: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, padding: spacing[4], marginBottom: spacing[3] },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  cardAmount: { fontSize: 15, fontWeight: "800", color: colors.primary },
  cardStatus: { fontSize: 13, color: colors.textSecondary, marginTop: spacing[1] },
  cardDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  cancelButton: { marginTop: spacing[2] },
  cancelText: { color: colors.error, fontSize: 12, fontWeight: "700" },
});