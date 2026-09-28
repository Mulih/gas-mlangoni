import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "../navigation/types";
import { useCustomer } from "../context/CustomerContext";
import { api, ApiError } from "../api/client";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";
import { Card } from "../components/Card";
import * as Location from "expo-location";

type Props = NativeStackScreenProps<RootStackParamList, "Order">;

// KNOWN SIMPLIFICATION, not a hidden gap; only one vendor exists in the whole system
// right now, and no proximity/selection screen exists as i cut it from the MVP
// hardcoding it accurately reflects current reality rather than pretending
// a discovery flow exists.
const VENDOR_ID = "952338ac-4aa8-4a2d-8c7e-19ac4fd6fa51";

interface CatalogItem { brand: string; size: string; quantity: number; price: string }
interface Address { id: string; estateName: string }
interface CustomerWithAddresses { id: string; addresses: Address[] }

const DELIVERY_MODES = [
    { value: "ON_DEMAND" as const, label: "On-Demand", description: "Delivered within 25 minutes" },
    { value: "SCHEDULED" as const, label: "Scheduled", description: "Choose a later time" },
];

const SIZE_DESCRIPTIONS: Record<string, string> = {
    "6kg": "Ideal for small homes",
    "13kg": "Most popular",
    "50kg": "For businesses",
};

export function OrderScreen({ navigation }: Props) {
    const { customer } = useCustomer();
    const [orderType, setOrderType] = useState<"REFILL" | "NEW_CYLINDER">("REFILL");
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [changingAddress, setChangingAddress] = useState(false);
    const [deliveryMode, setDeliveryMode] = useState<"ON_DEMAND" | "SCHEDULED">("ON_DEMAND");
    const [newEstateName, setNewEstateName] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                // Promise.all - catalog and address list dont depend on each other
                // no reason to fetch them one after another
                const [catalogData, customerData] = await Promise.all([
                    api.get<CatalogItem[]>(`/vendors/${VENDOR_ID}/inventory`),
                    api.get<CustomerWithAddresses>(`/customers/${customer!.id}`),
                ]);
                setCatalog(catalogData);
                setAddresses(customerData.addresses);
                if (customerData.addresses.length > 0) setSelectedAddressId(customerData.addresses[0].id);
                else setChangingAddress(true);
            } catch (err) {
                setError(err instanceof ApiError ? err.message: "Failed to load order options");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function handleAddAddress() {
        if (!newEstateName.trim()) return;
        setError(null);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            setError("Location permisstion is needed to add a delivery address");
            return;
        }

        try {
            const position = await Location.getCurrentPositionAsync({});
            const address = await api.post<Address>(`/customers/${customer!.id}Address`, {
                estateName: newEstateName,
                gpsLat: position.coords.latitude,
                gpsLng: position.coords.longitude,
            });
            setAddresses([...addresses, address]);
            setSelectedAddressId(address.id);
            setNewEstateName("");
            setChangingAddress(false);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to add address");
        }
    }

    async function handlePlaceOrder() {
        if (!selectedItem || !selectedAddressId) {
            setError("Please select a cylinder and delivery address");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const order = await api.post<{ id: string; totalAmount: string }>(`/customers/${customer!.id}/orders`, {
                vendorId: VENDOR_ID, addressId: selectedAddressId,
                brand: selectedItem.brand, size: selectedItem.size, deliveryMode,
            });
            navigation.navigate("Payment", { orderId: order.id, totalAmount: order.totalAmount });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to place order");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>;
    }
    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.tabRow}>
                <Pressable style={[styles.tab, orderType === "REFILL" && styles.tabActive]} onPress={() => setOrderType("REFILL")}>
                    <Text style={[styles.tabText, orderType === "REFILL" && styles.tabTextActive]}>Refill</Text>
                </Pressable>
                <Pressable style={[styles.tab, orderType === "NEW_CYLINDER" && styles.tabActive]} onPress={() => setOrderType("NEW_CYLINDER")}>
                    <Text style={[styles.tabText, orderType === "NEW_CYLINDER" && styles.tabTextActive]}>New Cylinder</Text>
                </Pressable>
            </View>
            <Text style={styles.selectionTitle}>Select Cylinder Size</Text>
            {catalog.length === 0 ? (
                <Text style={styles.emptyText}>No cylinders currently available from this vendor.</Text>
            ) : (
                catalog.map((item) => {
                    const isSelected = selectedItem?.brand === item.brand && selectedItem?.size === item.size;
                    return (
                        <Pressable key={`${item.brand}-${item.size}`} style={[styles.option, isSelected && styles.optionSelected]} onPress={() => setSelectedItem(item)}>
                            <Card style={[styles.option, isSelected && styles.optionSelected]}>
                                <View style={styles.optionIconBadge}>
                                    <Ionicons name="flame" size={20} color={colors.primary} />
                                </View>
                                <View style={styles.optionBody}>
                                    <Text style={styles.optionSize}>{item.size} - {item.brand}</Text>
                                    <Text style={styles.optionDescription}>{SIZE_DESCRIPTIONS[item.size] ?? `${item.quantity} in stock`}</Text>
                                    <Text style={styles.optionPrice}>Ksh {item.price}</Text>
                                </View>
                                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                    {isSelected && <View style={styles.radioDot} />}
                                </View>
                            </Card>
                        </Pressable>
                    );
                })
            )}

            <Text style={styles.selectionTitle}>Delivery Mode</Text>
            {DELIVERY_MODES.map((mode) => (
                <Pressable key={mode.value} onPress={() => setDeliveryMode(mode.value)}>
                    <Card style={[styles.option, deliveryMode === mode.value && styles.optionSelected]}>
                        <View style={styles.optionBody}>
                            <Text style={styles.optionSize}>{mode.label}</Text>
                            <Text style={styles.optionDescription}>{mode.description}</Text>
                        </View>
                        <View style={[styles.radio, deliveryMode === mode.value && styles.radioSelected]}>
                            {deliveryMode === mode.value && <View style={styles.radioDot} />}
                        </View>
                    </Card>
                </Pressable>
            ))}

            <Text style={styles.selectionTitle}>Delivery Address</Text>
            {selectedAddress && !changingAddress ? (
                <Card style={styles.addressRow}>
                    <View>
                        <Text style={styles.addressLabel}>Delivering to</Text>
                        <Text style={styles.optionSize}>{selectedAddress.estateName}</Text>
                    </View>
                    <Pressable onPress={() => setChangingAddress(true)}>
                        <Text style={styles.changeLink}>Change</Text>
                    </Pressable>
                </Card>
            ) : (
                <>
                  {addresses.map((address) => (
                    <Pressable key={address.id} onPress={() => {setSelectedAddressId(address.id); setChangingAddress(false); }}>
                        <Card style={[styles.option, selectedAddressId === address.id && styles.optionSelected]}>
                            <Text style={styles.optionSize}>{address.estateName}</Text>
                        </Card>
                    </Pressable>
                  ))}
                  <View style={styles.addAddressRow}>
                    <TextInput style={styles.addAddressInput} placeholder="Add new estate/area" placeholderTextColor={colors.textMuted} value={newEstateName} onChangeText={setNewEstateName} />
                    <Pressable style={styles.addAddressButton} onPress={handleAddAddress}>
                        <Text style={styles.addAddressButtonText}>Add</Text>
                    </Pressable>
                  </View>
                </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.submitContainer}>
                {submitting ? <ActivityIndicator color={colors.primary} /> : <PrimaryButton title="Continue" onPress={handlePlaceOrder} />}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    content: { padding: spacing[5], paddingBottom: spacing[10] },
    centered: {flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
    tabRow: { flexDirection: "row", backgroundColor: colors.borderLight, borderRadius: radius.md, padding: 4, gap: 4 },
    tab: { flex: 1, paddingVertical: spacing[3], borderRadius: radius.md, alignItems: "center" },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
    tabTextActive: { color: colors.white },
    selectionTitle: { fontSize: 17, fontWeight: "800", color: colors.textPrimary, marginTop: spacing[5], marginBottom: spacing[3] },
    emptyText: { color: colors.textSecondary, fontSize: 14 },
    option: { flexDirection: "row", alignItems: "center", gap: spacing[3], marginBottom: spacing[3] },
    optionSelected: { borderColor: colors.primary, borderWidth: 2 },
    optionIconBadge: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: `${colors.primary}15`, alignItems: "center", justifyContent: "center" },
    optionBody: { flex: 1, gap: 2 },
    optionSize: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
    optionDescription: { fontSize: 12, color: colors.textSecondary },
    optionPrice: { fontSize: 15, fontWeight: "800", color: colors.primary },
    radio: { width: 20, height: 20, borderRadius: 10, borderColor: colors.borderLight, alignItems: "center", justifyContent: "center" },
    radioSelected: { borderColor: colors.primary },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    addressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    addressLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
    changeLink: { color: colors.primary, fontWeight: "700", fontSize: 13 },
    addAddressRow: { flexDirection: "row", gap: spacing[2] },
    addAddressInput: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, padding: spacing[3], fontSize: 14, color: colors.textPrimary },
    addAddressButton: { paddingHorizontal: spacing[4], justifyContent: "center", backgroundColor: colors.black, borderRadius: radius.md },
    addAddressButtonText: { color: colors.white, fontWeight: "700" },
    error: { color: colors.error, marginTop: spacing[4], fontSize: 13 },
    submitContainer: { marginTop: spacing[6] },
});
