import { Text, View } from "react-native";

interface SummaryRowProps { label: string; value: string; accent?: boolean; mono?: boolean; }

/** Shared financial-detail row used by withdrawal confirmation and receipts. */
const SummaryRow = ({ label, value, accent, mono }: SummaryRowProps) => <View className="flex-row items-center justify-between border-b border-surface-border py-3 last:border-b-0">
  <Text className="mr-4 flex-1 text-sm text-ink-muted">{label}</Text>
  <Text numberOfLines={1} adjustsFontSizeToFit className={`max-w-[62%] text-right text-sm font-semibold text-ink ${accent ? "text-base text-brand-light" : ""} ${mono ? "font-mono text-xs" : ""}`}>{value}</Text>
</View>;

export default SummaryRow;
