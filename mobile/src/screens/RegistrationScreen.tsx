import { useState } from "react";
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { api, ApiError } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "Registration">;

// matches the backend's own regex exactly (createCustomerSchema on the
// server) - checking the same rule here catches a bad number instantly,
// before a network round-trip, not after one fails.
const PHONE_REGEX = /^\+254\d{9}$/;

export function RegistrationScreen({ navigation }: Props) {
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        setError(null);
        if (!PHONE_REGEX.test(phone)) {
            setError("Phone must be in the format +254XXXXXXXX");
            return;
        }

        setLoading(true);
        try {
            const customer = await api.post<{ id: string }>("/customers", { phone, name: name || undefined });
            navigation.replace("Home", { customerId: customer.id });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Your Account</Text>

            <TextInput
              style={styles.input}
              placeholder="+254712345678"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none" 
            />
            <TextInput
              style={styles.input}
              placeholder="Name (optional)"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName} 
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {loading ? <ActivityIndicator color={colors.primary} /> : <PrimaryButton title="Continue" onPress={handleSubmit} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white, padding: spacing[6], justifyContent: "center" },
    title: { fontSize: 24, fontWeight: "800", color: colors.textPrimary, marginBottom: spacing[6] },
    input: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: 14, padding: spacing[4], marginBottom: spacing[4], fontSize: 16, color: colors.textPrimary },
    error: { color: colors.error, marginBottom: spacing[4], fontSize: 13 },
});