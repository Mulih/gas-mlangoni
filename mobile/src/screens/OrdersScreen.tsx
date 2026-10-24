import { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, SectionList, ActivityIndicator, RefreshControl, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
import { type } from "../theme/typography";
import  { OrderCard } from "../components/OrderCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { type Order, isActive } from "../utils/orders";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Orders">,
  NativeStackScreenProps<RootStackParamList>
>;

// One titled group in the list.
interface OrderSection {
  title: string;  // "Active" or "Past"
  data: Order[];  // the orders in that group (SectionList requires this exact key name)
}

// Maps our 13 internal states to short customer-facing labels.

export function OrdersScreen({ navigation }: Props) {
  const { customer } = useCustomer();   // the logged-in customer
  const [orders, setOrders] = useState<Order[]>([]);  // all orders from the server
  const [loading, setLoading] = useState(true);   // true only for the very first load
  const [refreshing, setRefreshing] = useState(false);  // true while pull-to-refresh runs
  const [error, setError] = useState<string | null>(null);  // message to show in the banner, or null
  const [cancellingId, setCancellingId] = useState<string | null>(null); // which order is being cancelled right now


  // Fetches the customer's orders. 
  const loadOrders = useCallback(async () => {
    if (!customer) return;    // no 
    try {
      setOrders(await api.get<Order[]>(`/customers/${customer!.id}/orders`)); // GET the list and store it
      setError(null);   // success clears any old error
    } catch (err) {
      // Use the backend's message when there is one, otherwise a clear fallback.
      setError(err instanceof ApiError ? err.message : "Failed to load orders");
    }
  }, [customer]);

  // Load once when the screen opens; hide the spinner afterwards whether it worked or not.
  useEffect(() => { loadOrders().finally(() => setLoading(false)); }, [loadOrders]);

  // Pull-to-refresh handler.
  async function handleRefresh() {
    setRefreshing(true);    // show the pull spinner
    await loadOrders();     // reload
    setRefreshing(false);   // hide it
  }

  // Actually cancels (called only after the customer confirms)
  async function cancelOrder(orderId: string) {
    setCancellingId(orderId);   // disables card's buttons so it can't be tapped twice
    try {
      await api.patch(`/orders/${orderId}/cancel`, {});
      await loadOrders();   // refresh so the order moves to "Past"
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't cancel the order. Please try again.");
    } finally {
      setCancellingId(null);  // finally runs on success AND failure
    }
  }

  // cancelling can't be undone, must ask first.
  function handleCancel(orderId: string) {
    Alert.alert("Cancel this order?", "This can't be undone.", [
      { text: "Keep order", style: "cancel" },  // dismiss, do nothing
      { text: "Cancel order", style: "destructive", onPress: () => cancelOrder(orderId) },  // red button, runs the cancel
    ]);
  }

  // Split orders into Active and Past, newest first. useMemo will only recompute when `orders` changes.
  const sections = useMemo<OrderSection[]>(() => {
    // Sort a COPY (spread)
    const newestFirst = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return [
      { title: "Active", data: newestFirst.filter((o) => isActive(o.status)) }, // not finished yet
      { title: "Past", data: newestFirst.filter((o) => !isActive(o.status)) },  // finished
    ].filter((section) => section.data.length > 0);
  }, [orders]);


  // First load: centered spinner.

  if (loading) return (<View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
)
  return (
    <SafeAreaView>
      {/* Screen title */}
      <Text style={styles.header}>My orders</Text>

      {/* error banner with a retry button */}
      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          {/* Retry just reloads the list. */}
          <Pressable onPress={loadOrders} hitSlop={8}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <SectionList<Order, OrderSection>
          sections={sections}     // the active / past groups
          keyExtractor={(item) => item.id}    // unique key per row
          stickySectionHeadersEnabled={false}   // headers scroll away instead of sticking to the top
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          // Section title, e.g. "Active".
          renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
          // One card or row per order; the card decides its own layout
          renderItem={({ item }) => (
            <OrderCard
                order ={item}
                onTrack={(orderId) => navigation.navigate("Tracking", { orderId })}   // open tracking
                onPay={(order) => navigation.navigate("Payment", { orderId: order.id, totalAmount: order.totalAmount })} // open payment
                onCancel={handleCancel}     // confirm first
                cancelling={cancellingId === item.id}   // true only for the order being cancelled
            />
          )}
          // Empty state: hidden when there is an error, because "No orders yet" would be misleadinf if loading failed.
          ListEmptyComponent={
            error ? null : (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="flame-outline" size={36} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No orders yet</Text>
                <Text style={styles.emptyText}>Order your first cylinder and track it here.</Text>
                {/* help customer navigate forward */}
                <PrimaryButton title="Order gas" onPress={() => navigation.navigate("Order")} />
              </View>
            )
          }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },   // fill the screen, white page
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },   // center the spinner
  header: { ...type.display, color: colors.textPrimary, paddingHorizontal: spacing[5], paddingTop: spacing[2], paddingBottom: spacing[3] },   // bit title
  listContent: { paddingHorizontal: spacing[5], paddingBottom: spacing[10], flexGrow: 1 },    // side padding;
  sectionTitle: { ...type.heading, color: colors.textPrimary, marginTop: spacing[3], marginBottom: spacing[3] }, // "Active" / "Past"

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    backgroundColor: colors.errorTint,
    borderRadius: radius.md,
    padding: spacing[3],
    marginHorizontal: spacing[5],
    marginBottom: spacing[2],
  },
  errorText: { ...type.body, color: colors.error, flex: 1 },
  retryText: { ...type.label, color: colors.error },

  empty: { alignItems: "center", paddingTop: spacing[10], gap: spacing[3] },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { ...type.heading, color: colors.textPrimary },
  emptyText: { ...type.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing[2] },
});