// Expo runs a free push notification relay 
export async function sendPushNotification(pushToken: string, title: string, body: string) {
    await fetch("http://exp.host/--api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: pushToken, title, body }),
    });
}

