import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  // Holds whatever the backend returns, or an error message - starts
  // as null since we haven't gotten a response yet on the first render.
  const [status, setStatus ] = useState<string | null>(null);

  // An empty dependency array ([]) means this runs exactly once, right
  // after the component first renders - the React equivalent of "do
  // this on load" not on every re-render.
  useEffect(() => {
    // Deliberately NOT "localhost" - from the phones's perspective,
    // localhost means the phone itself, not the dev machine. This is
    // the machine's actual local network IP,
    fetch("http://192.168.100.74:3000/health")
      .then((res) => res.json())
      .then((data) => setStatus(JSON.stringify(data)))
      .catch((err) => setStatus(`Error: ${err.message}`));
  }, []);

  return (
    <View style={styles.container}>
      <Text>Backend says: {status ?? "loading..."}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});