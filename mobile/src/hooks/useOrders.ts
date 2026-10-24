import { useCallback, useState } from "react";
import { Alert } from "react-native";
// Runs a function every time this screen comes into focus ( a tab is selected, or you navigate back to it).
import { useFocusEffect } from "@react-navigation/native";
import { useCustomer } from "../context/CustomerContext";
import { api, ApiError } from "../api/client";
import type { Order } from "../utils/orders";

// Loads the logged-in customer's orders. Shared by Home and Orders so the logic lives in one place.
export function useOrders() {
    const { customer } = useCustomer();     // who is logged in
    const [orders, setOrders] = useState<Order[]>([]);  // the loaded orders
    const [loading, setLoading] = useState(true);   // true only until the FIRST load finishes
    const [error, setError] = useState<string | null>(null);    // message to show, or null
    const [cancellingId, setCancellingId] = useState<string | null>(null);  // which order is being cancelled right now

    // Fetches the orders. Never throws: failures go into `error`.
    const reload = useCallback(async () => {
        if (!customer) return;      // nobody logged in yet: nothing to load
        try {
            setOrders(await api.get<Order[]>(`/customers/${customer.id}/orders`));  // GET and store
            setError(null);     // success clears any old error
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Couldn't load your orders. Check your connection and try again.");
        }
    }, [customer]);

    // Reload one every focus. Tab screens stay mounted, so a plain useEffect would load once and then go stale
    // (e.g. you place an order, switch to Home, and the new order wouldn't appear).
    useFocusEffect(
        useCallback(() => {
            reload().finally(() => setLoading(false));  // first load ends the spinner; later loads don't bring it back
        }, [reload])
    );

    async function cancelOrder(orderId: string) {
        setCancellingId(orderId);
        try {
            await api.patch(`/orders/${orderId}/cancel`, {});       // cancel
            await reload();         // refresh so the order moves to Past
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "couldn't cancel the order. Please try again.");
        } finally {
            setCancellingId(null);      // runs on success AND failure
        }
    }

    // cancelling confirmation since canceling can't be undone
    function confirmCancel(orderId: string) {
        Alert.alert("Cancel this order?", "This can't be undone.", [
            { text: "Keep order", style: "cancel" },        // dismiss, do nothing
            { text: "Cancel order", style: "destructive", onPress: () => cancelOrder(orderId) },    // red button, runs the cancel
        ])
    }

    // setError is return too, because the Orders screen reports cancel failures through it.
    return { orders, loading, error, cancellingId, reload, confirmCancel };
}