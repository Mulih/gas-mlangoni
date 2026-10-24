import { useCallback, useState } from "react";
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

    // setError is return too, because the Orders screen reports cancel failures through it.
    return { orders, loading, error, setError, reload };
}