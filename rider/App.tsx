import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Linking, Pressable } from 'react-native';
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./src/api/config";

// One test rider hardcoded since haven't implemented rider login yet
const RIDER_ID = "44036ea2-7f4a-4c0b-b276-0622dd370353";

// Controls how a notification behaves if it arrives while the app 
// is already open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

interface CurrentOrder {
  id: string; brand: string; size: string; totalAmount: string;
  customer: { name?: string; phone: string };
  address: { estateName: string; gpsLat: number; gpsLng: number };
}

export default function App() {
  const [order, setOrder] = useState<CurrentOrder | null>(null);

  useEffect(() => {
    registerForPushNotifications();
    const interval = setInterval(fetchCurrentOrder, 5000);
    fetchCurrentOrder();
    return () => clearInterval(interval);
  }, []);

  async function registerForPushNotifications() {
    // Physical-device check - push tokens can't be obtained from a
    // simulator/emulator, this would throw otherwise.
    if (!Device.isDevice) return;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const { data: token } = await Notifications.getExpoPushTokenAsync();

    // cache locally
    const cached = await AsyncStorage.getItem("push_token");
    if (cached === token) return;

    await fetch(`${API_BASE_URL}/riders/${RIDER_ID}/push-token`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pushToken: token }),
    });
    await AsyncStorage.setItem("push_token", token);
  }

  async function fetchCurrentOrder() {
    try {
      const res = await fetch(`${API_BASE_URL}/riders/${RIDER_ID}/current-order`);
      const data = await res.json();
      setOrder(data ?? null);
    } catch {

    }
  }

  function openMaps() {
    if (!order) return;
    // universal geo: URI - opens whichever map app the phone already
    // has set as default
    Linking.openURL(`geo:${order.address.gpsLat},${order.address.gpsLng}?q=${order.address.gpsLat},${order.address.gpsLng}`);
  }

  if (!order) {
    return (
      <view style={styles.container}>
        <Text>No active job right now.</Text>
      </view>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Current Delivery</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Deliver</Text>
        <Text>{order.size} - {order.brand}</Text>

        <Text style={styles.label}>Customer</Text>
        <Text style={styles.value}>{order.customer.name || "Customer"}</Text>
        <Text style={styles.value}>{order.customer.phone}</Text>

        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{order.address.estateName}</Text>

        <Text style={styles.label}>Amount</Text>
        <Text>Ksh {order.totalAmount}</Text>
      </View>

      <Pressable style={styles.mapsButton} onPress={openMaps}>
        <Text style={styles.mapsButtonText}>Open in Maps</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20, justifyContent: 'center' },
  emptyText: { textAlign: "center", color: "#666" },
  header: { fontSize: 22, fontWeight: "800", marginBottom: 16 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 20, gap: 4 },
  label: { fontSize: 11, color: "#999", marginTop: 10 },
  value: { fontSize: 15, fontWeight: "600", color: "#111" },
  mapsButton: { backgroundColor: "#FF0000", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 20 },
  mapsButtonText: { color: "#fff", fontWeight: "700" },
});
