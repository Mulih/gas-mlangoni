import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useCustomer } from "../context/CustomerContext";
import { api, ApiError } from "../api/client";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";

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

export function OrdersScreen({ navigation }: Props) {
    const { customer } = useCustomer();
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
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
        try {
            // Hardcoded coordinates
            // map picker to be selected
            const address = await api.post<Address>(`/customers/${customer!.id}/addresses`, {
                estateName: newEstateName, gpsLat: -1.2833, gpsLng: 36.8167,
            });
            setAddresses([...addresses, address]);
            setSelectedAddressId(address.id);
            setNewEstateName("");
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

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.selectionTitle}>Select Cylinder Size</Text>
            {catalog.length === 0 ? (
                <Text style={styles.emptyText}>No cylinders currently available from this vendor.</Text>
            ) : (
                catalog.map((item) => {
                    const isSelected = selectedItem?.brand === item.brand && selectedItem?.size === item.size;
                    return (
                        <Pressable key={`${item.brand}-${item.size}`} style={[styles.option, isSelected && styles.optionSelected]} onPress={() => setSelectedItem(item)}>
                            <View>
                                <Text style={styles.optionSize}>{item.size} - {item.brand}</Text>
                                <Text style={styles.optionStock}>{item.quantity} in stock</Text>
                            </View>
                            <Text style={styles.optionPrice}>Ksh {item.price}</Text>
                        </Pressable>
                    );
                })
            )}

            <Text style={styles.selectionTitle}>Delivery Mode</Text>
            {DELIVERY_MODES.map((mode) => (
                <Pressable key={mode.value} style={[styles.option, deliveryMode === mode.value && styles.optionSelected]} onPress={() => setDeliveryMode(mode.value)}>
                    <View>
                        <Text style={styles.optionSize}>{mode.label}</Text>
                        <Text style={styles.optionStock}>{mode.description}</Text>
                    </View>
                </Pressable>
            ))}

            <Text style={styles.selectionTitle}>Delivery Address</Text>
            {addresses.map((address) => (
                <Pressable key={address.id} style={[styles.option, selectedAddressId === address.id && styles.optionSelected]} onPress={() => setSelectedAddressId(address.id)}>
                    <Text style={styles.optionSize}>{address.estateName}</Text>
                </Pressable>
            ))}
            <View style={styles.addAddressRow}>
                <TextInput style={styles.addAddressInput} placeholder="Add new estate/area" placeholderTextColor={colors.textMuted} value={newEstateName} onChangeText={setNewEstateName} />
                <Pressable style={styles.addAddressButton} onPress={handleAddAddress}>
                    <Text style={styles.addAddressButtonText}>Add</Text>
                </Pressable>
            </View>

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
    selectionTitle: { fontSize: 16, fontWeight: "800", color: colors.textPrimary, marginTop: spacing[5], marginBottom: spacing[3] },
    emptyText: { color: colors.textSecondary, fontSize: 14 },
    option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing[4], borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, marginBottom: spacing[3] },
    optionSelected: { borderColor: colors.primary, borderWidth: 2 },
    optionSize: { fontSize: 15, fontWeight: "700", color: colors.primary },
    optionStock: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    optionPrice: { fontSize: 15, fontWeight: "800", color: colors.primary },
    addAddressRow: { flexDirection: "row", gap: spacing[2] },
    addAddressInput: { flex: 1, borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, padding: spacing[3], fontSize: 14, color: colors.textPrimary },
    addAddressButton: { paddingHorizontal: spacing[4], justifyContent: "center", backgroundColor: colors.black, borderRadius: radius.md },
    addAddressButtonText: { color: colors.white, fontWeight: "700" },
    error: { color: colors.error, marginTop: spacing[4], fontSize: 13 },
    submitContainer: { marginTop: spacing[6] },
});
