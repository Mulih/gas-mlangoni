import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "./Card";
import { PrimaryButton } from "./PrimaryButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";
import { fonts, type } from "../theme/typography";
import { type Order, STATUS_LABELS, STATUS_MESSAGES, STAGES, isActive, stageOf, formatKsh, formatOrderDate } from "../utils/orders";

type IconName = keyof typeof Ionicons.glyphMap;

// which icon sits in the red circle for each active state
const STATUS_ICONS: Record<string, IconName> = {
    PLACED: "card",         // waiting for payment
    ESCROW_HELD: "checkmark-circle",     // pament received
    DISPATCHING: "search",      // looking for a rider
    DISPATCH_TIMEOUT: "time",   // taking longer than usual
    ASSIGNED: "person",     // a rider is assigned
    EN_ROUTE: "navigate",   // on the way
    AUDIT_IN_PROGRESS: "scale", // weight check at the door
    AUDIT_FAILED: "alert-circle",   // under review
};

const UNSUCCESSFUL = ["CANCELLED", "REFUNDED"];

// what the parent screen must give each card.
interface OrderCardProps {
    order: Order;   // the order to display
    onTrack: (orderId: string) => void; // open the tracking screen
    onPay: (order: Order) => void;  // open the Payment screen (needs id + amount, so we pass the whole order)
    onCancel: (orderId: string) => void;    // ask the parent to cancel
    cancelling?: boolean;
}

// order stepper
function OrderStepper({ current }: { current: number }) {
    return (
        // one row holding 4 equal columns.
        <View style={styles.stepper}>
            {STAGES.map((label, index) => {
                const reached = index <= current;
                const isCurrent = index === current;
                const isFirst = index === 0;
                const isLast = index === STAGES.length - 1;
                return (
                    // key lets React track each column between renders.
                    <View key={label} style={styles.stepColumn}>
                        {/* Row */}
                        <View style={styles.stepTrack}>
                            <View style={[styles.connector, reached && styles.connectorDone, isFirst && styles.connectorHidden]} />
                            <View style={[styles.node, reached ? styles.nodeDone : styles.nodePending]}>
                                {/* finished steps show a white tick. */}
                                {reached && !isCurrent ? <Ionicons name="checkmark" SIZE={12} color={colors.white} /> : null}
                                {/* current step shows a white dot */}
                                {isCurrent ? <View style={styles.nodeDot} /> : null}
                            </View>
                            <View style={[styles.connector, index < current && styles.connectorDone, isLast && styles.connectorHidden]} />
                        </View>
                        {/* step name under the circle; darker once reached */}
                        <Text style={[styles.stepLabel, reached && styles.stepLabelReached]} numberOfLines={1}>{label}</Text>
                    </View>
                );
            })}
        </View>
    );
}

// The compact row used for finished orders.
function PastOrderRow({ order, onTrack }: Pick<OrderCardProps, "order" | "onTrack">) {
    const failed = UNSUCCESSFUL.includes(order.status); // cancelled or refunded
    return (
        // whole row is tappable; the pressed state tints it.
        <Pressable
            onPress={() => onTrack(order.id)}
            style={({ pressed }) => [styles.pastRow, pressed && styles.pastRowPressed]}
        >
            {/* Small status icon on the left: green tick for success, red cross for cancelled/refunded. */}
            <Ionicons
                name={failed ? "close-circle" : "checkmark-circle"}
                size={26}
                color={failed ? colors.error : colors.success}
            />
            {/* text block between the icon and the price. */}
            <View>
                <Text style={styles.pastTitle} numberOfLines={1}>{order.size} · {order.brand}</Text>
                <Text style={styles.pastCaption} numberOfLines={1}>
                    {STATUS_LABELS[order.status] ?? order.status} · {formatOrderDate(order.createdAt)}
                </Text>
            </View>
            {/* Amount on the right. */}
            <Text style={styles.pastAmount}>{formatKsh(order.totalAmount)}</Text>
        </Pressable>
    );
}

// Picks the right layout for the order.
export function OrderCard({ order, onTrack, onPay, onCancel, cancelling }: OrderCardProps) {
    // Finished orders get the quiet compact row.
    if (!isActive(order.status)) return <PastOrderRow order={order} onTrack={onTrack} />;

    const unpaid = order.status === "PLACED";
    const stage = stageOf(order.status);

    return (
        // red left edge marks "needs attention / in progress".
        <Card style={styles.activeCard}>
            {/* whole card opens tracking, except unpaid orders */}
            <Pressable onPress={() => onTrack(order.id)} disabled={unpaid}>
                {/* header */}
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Ionicons name={STATUS_ICONS[order.status] ?? "flame"} size={22} color={colors.white} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>{STATUS_LABELS[order.status] ?? order.status}</Text>
                        {STATUS_MESSAGES[order.status] ? <Text style={styles.message}>{STATUS_MESSAGES[order.status]}</Text> : null}
                    </View>
                </View>

                {/* summary strip */}
                <View style={styles.summary}>
                    <View style={styles.summaryText}>
                        <Text style={styles.summaryTitle} numberOfLines={1}>{order.size} · {order.brand}</Text>
                        <Text style={styles.summaryCaption}>{formatOrderDate(order.createdAt)}</Text>
                    </View>
                    <Text style={styles.summaryAmount}>{formatKsh(order.totalAmount)}</Text>
                </View>

                {/* Stepper only when the order is in a trackable stage. */}
                {stage >= 0 ? <OrderStepper current={stage} /> : null}
            </Pressable>

            {/* Actions: unpaid orders get Pay now + Cancel; paid orders get a black Track button. */}
            {unpaid ? (
                <View style={styles.actions}>
                    {/* flex */}
                    <View>
                        <PrimaryButton title="Pay now" onPress={() => onPay(order)} disabled={cancelling} />
                    </View>
                    {/* Quiet text button for the destructive action */}
                    <Pressable onPress={() => onCancel(order.id)} disabled={cancelling} style={styles.cancelButton}>
                        <Text style={[styles.cancelText, cancelling && styles.cancelTextDisabled]}>
                            {cancelling ? "Cancelling..." : "Cancel"}
                        </Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.actions}>
                    {/* variant */}
                    <View style={styles.actionMain}>
                        <PrimaryButton title="Track order" variant="secondary" onPress={() => onTrack(order.id)} />
                    </View>
                </View>
            )}
        </Card>
    );
}

const NODE = 20;    // circle size in px, used by the stepper

const styles = StyleSheet.create({
    activeCard: { borderLeftWidth: 4, borderLeftColor: colors.primary, marginBottom: spacing[4] },
    header: { flexDirection: "row", alignItems: "center", marginBottom: spacing[4] },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: radius.pill,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing[3],
    },
    headerText: { flex: 1 },
    title: { ...type.heading, color: colors.textPrimary },
    message: { ...type.body, color: colors.textSecondary, marginTop: 2 },

    // grey strip with order summary
    summary: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.whiteSoft,
        borderRadius: radius.md,
        padding: spacing[3],
        marginBottom: spacing[4],
    },
    summaryText: { flex: 1 }, // push amount to the right
    summaryTitle: { ...type.label, color: colors.textPrimary }, // "13kg · Total"
    summaryCaption: { ...type.caption, color: colors.textMuted, marginTop: 2 }, // date
    summaryAmount: { ...type.price, color: colors.textPrimary },    // "KSh 2,450"

    stepper: { flexDirection: "row", marginBottom: spacing[4] },
    stepColumn: { flex: 1, alignItems: "center" },  // each column takes 1/4 of the width
    stepTrack: { flexDirection: "row", alignItems: "center", width: "100%" },   // line, circle, line in one row
    connector: { flex: 1, height: 2, backgroundColor: colors.borderLight },     // grey line by default
    connectorDone: { backgroundColor: colors.primary },     // red when the step is reached
    connectorHidden: { backgroundColor: colors.primary },   // invisible at the very start / end
    node: { width: NODE, height: NODE, borderRadius: NODE / 2, alignItems: "center", justifyContent: "center" }, // circle
    nodeDone: { backgroundColor: colors.primary },      // reached: solid red
    nodePending: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.borderLight },    // not yet: empty ring
    nodeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },   // white dot on the current step
    stepLabel: { ...type.caption, color: colors.textMuted, marginTop: spacing[1] },     // grey label
    stepLabelReached: { color: colors.textPrimary },        // darker label once reached

    // Action row
    actions: { flexDirection: "row", alignItems: "center" },
    actionMain: { flex: 1 },        // main button fills the row
    cancelButton: { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },   // padding = bigger tap area
    cancelText: { ...type.label, color: colors.error }, // red "Cancel"
    cancelTextDisabled: { color: colors.textMuted },    // grey while cancelling

    // Past row: compact, flat, with a divider.
    pastRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    pastRowPressed: { backgroundColor: colors.whiteSoft },
    pastText: {flex: 1, marginLeft: spacing[3] },
    pastTitle: { ...type.label, color: colors.textPrimary },
    pastCaption: { ...type.caption, color: colors.textMuted, marginTop: 2 },
    pastAmount: { ...type.price, color: colors.textPrimary, marginLeft: spacing[3] },

})