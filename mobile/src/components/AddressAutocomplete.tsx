import { useState, useRef } from "react";
import { View, TextInput, FlatList, Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import uuid from "react-native-uuid";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

interface Prediction { placeId: string; text: string }

export function AddressAutocomplete({ onSelect }: { onSelect: (result: { estateName: string; gpsLat: number; gpsLng: number }) => void }) {
    const [query, setQuery] = useState("");
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(false);
    // Regenerated when a place is actually selected - groups the 
    // autocomplete keystrokes + the final details fetch into one billing
    // session
    const sessionToken = useRef(uuid.v4() as string);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    function handleChangeText(text: string) {
        setQuery(text);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        if (text.length < 3) { setPredictions([]); return; }

        // 400ms debounce - don't fire a request on every single keystroke.
        debounceTimer.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
                    method: "POST",
                    headers: { "Content-Type": "applications/json", "X-Goog-Api-Key": API_KEY! },
                    body: JSON.stringify({
                        input: text,
                        sessionToken: sessionToken.current,
                        includeRegionCodes: ["ke"],
                    }),
                });
                const data = await res.json();
                setPredictions(
                    (data.suggestions ?? []).map((s: any) => ({
                        placeId: s.placePrediction.placeId,
                        text: s.placePrediction.text.text,
                    })),
                );
            } catch (err) {
                console.error("Autcomplete request failed:", err);
                setPredictions([]);
            } finally {
                setLoading(false);
            }
        }, 400);
    }

    async function handleSelect(prediction: Prediction) {
        setQuery(prediction.text);
        setPredictions([]);
        try {
            const res = await fetch(`https://places.googleapis.com/v1/places/${prediction.placeId}`, {
                headers: {
                    "X-Goog-Api-Key": API_KEY!,
                    "X-Goog-FieldMask": "location,formattedAddress",
                },
            });
            const data = await res.json();
            onSelect({
                estateName: data.formattedAddress ?? prediction.text,
                gpsLat: data.location.latitude,
                gpsLng: data.location.longitude,
            });

            sessionToken.current = uuid.v4() as string;
        } catch (err) {
            console.error("Selection failed:", err);
        }
    }

    return (
        <View>
            <TextInput
              style={styles.input}
              placeholder="Search for your address"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={handleChangeText}
            />
            {loading && <ActivityIndicator style={styles.loader} color={colors.primary} />}
            {predictions.length > 0 && (
                <FlatList
                   style={styles.list}
                   data={predictions}
                   keyExtractor={(item) => item.placeId}
                   renderItem={({ item }) => (
                     <Pressable style={styles.row} onPress={() => handleSelect(item)}>
                        <Text style={styles.rowText}>{item.text}</Text>
                     </Pressable>
                   )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    input: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, padding: spacing[3], fontSize: 14, color: colors.textPrimary, backgroundColor: colors.white },
    loader: { marginTop: spacing[2] },
    list: { maxHeight: 200, borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, marginTop: spacing[2], backgroundColor: colors.white },
    row: { padding: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    rowText: { fontSize: 14, color: colors.textPrimary },
});