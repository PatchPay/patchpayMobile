import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

interface Props {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  children: React.ReactNode;
  style?: object;
}

export default function FieldCard({
  icon,
  iconColor,
  iconBg,
  label,
  children,
  style,
}: Props) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.03,
        elevation: 1,
        ...style,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <Feather name={icon as any} size={16} color={iconColor} />
        </View>

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 11,
          }}
        >
          {label}
        </Text>
      </View>

      {children}
    </View>
  );
}
