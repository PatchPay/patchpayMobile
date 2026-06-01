import { View, TouchableOpacity, Text } from "react-native";

interface Props {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  activeColor: string;
}

export default function SelectPill({
  options,
  value,
  onChange,
  activeColor,
}: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          onPress={() => onChange(o)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 20,
            backgroundColor: value === o ? activeColor : "#f1f5f9",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: value === o ? "#fff" : "#475569",
            }}
          >
            {o}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
