import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type TransferType = "internal" | "external";

type Props = {
  selected: TransferType | null;
  onSelect: (type: TransferType) => void;
  onContinue: () => void;
};

const OPTIONS: {
  type: TransferType;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}[] = [
  {
    type: "internal",
    title: "PatchPay",
    subtitle: "Send to another PatchPay account",
    icon: "flash-outline",
    color: "#2541c4",
    bg: "#eef1fc",
  },
  {
    type: "external",
    title: "Another bank",
    subtitle: "Send to any external bank account",
    icon: "business-outline",
    color: "#0f6e56",
    bg: "#e1f5ee",
  },
];

export default function TransferTypeSelector({
  selected,
  onSelect,
  onContinue,
}: Props) {
  return (
    <View>
      <Text style={styles.label}>Transfer type</Text>

      {OPTIONS.map((opt) => {
        const active = selected === opt.type;
        return (
          <TouchableOpacity
            key={opt.type}
            onPress={() => onSelect(opt.type)}
            style={[styles.card, active && styles.cardActive]}
          >
            <View style={[styles.iconWrap, { backgroundColor: opt.bg }]}>
              <Ionicons name={opt.icon} size={22} color={opt.color} />
            </View>

            <View style={styles.text}>
              <Text style={styles.title}>{opt.title}</Text>
              <Text style={styles.subtitle}>{opt.subtitle}</Text>
            </View>

            <View style={[styles.radio, active && styles.radioActive]}>
              {active && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        onPress={onContinue}
        disabled={!selected}
        style={[styles.btn, !selected && styles.btnDisabled]}
      >
        <Text style={styles.btnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginBottom: 10,
  },
  cardActive: {
    borderColor: "#2541c4",
    borderWidth: 2,
    backgroundColor: "#f5f7ff",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  subtitle: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: "#2541c4", backgroundColor: "#2541c4" },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  btn: {
    backgroundColor: "#2541c4",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { backgroundColor: "#94a3b8" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
