import React from "react";
import { View, Text } from "react-native";
import { withdrawStyles as styles } from "../styles/withdraw.styles";

interface SummaryRowProps {
  label: string;
  value: string;
  /** Purple + larger font — use for the amount field */
  accent?: boolean;
  /** Monospace font — use for transaction references */
  mono?: boolean;
}

/**
 * A single label/value row used in the Confirm and Success summary cards.
 *
 * Usage:
 *   <SummaryRow label="Amount"    value="₦10,000.00" accent />
 *   <SummaryRow label="Reference" value="TXN-ABC123"  mono  />
 *   <SummaryRow label="Bank"      value="GTBank Plc"        />
 */
const SummaryRow: React.FC<SummaryRowProps> = ({
  label,
  value,
  accent,
  mono,
}) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text
      style={[
        styles.summaryValue,
        accent && styles.summaryValueAccent,
        mono && styles.summaryValueMono,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {value}
    </Text>
  </View>
);

export default SummaryRow;
