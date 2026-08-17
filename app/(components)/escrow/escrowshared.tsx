import { CheckCircle, Clock, Truck } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

export const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};

export const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const getId = (value: any) =>
  typeof value === "object" && value !== null ? (value.id ?? value._id) : value;

export const getRole = (
  escrow: any,
  userId?: string | number,
): "buyer" | "seller" => {
  if (!escrow || userId === undefined || userId === null) {
    return "seller";
  }

  const creatorId = getId(escrow.creatorId);
  const recipientId = getId(escrow.recipientId);

  console.log("ROLE CHECK:", {
    escrowId: escrow.id,
    creatorId,
    recipientId,
    userId,
    creatorMatch: String(creatorId) === String(userId),
    recipientMatch: String(recipientId) === String(userId),
  });

  if (String(creatorId) === String(userId)) {
    return "seller";
  }

  if (String(recipientId) === String(userId)) {
    return "buyer";
  }

  return "seller";
};
export const getCounterpartyName = (escrow: any, role: "buyer" | "seller") => {
  if (role === "seller") {
    return (
      escrow?.recipient?.firstName || escrow?.recipient?.companyName || "Buyer"
    );
  }

  return escrow?.creator?.firstName || escrow?.creator?.companyName || "Seller";
};

export const Row = ({ title, value }: { title: string; value: string }) => (
  <View className="flex-row justify-between py-3 border-b border-gray-100">
    <Text className="text-gray-400">{title}</Text>
    <Text className="font-medium">{value}</Text>
  </View>
);

export const Timeline = ({
  text,
  done,
  active,
}: {
  text: string;
  done?: boolean;
  active?: boolean;
}) => (
  <View className="flex-row items-center mb-4">
    <View
      className={`p-2 rounded-full ${
        done ? "bg-green-100" : active ? "bg-indigo-100" : "bg-gray-200"
      }`}
    >
      {done ? (
        <CheckCircle size={16} color="green" />
      ) : active ? (
        <Clock size={16} color="blue" />
      ) : (
        <Truck size={16} color="gray" />
      )}
    </View>
    <Text
      className={`ml-3 ${
        active ? "text-indigo-600 font-semibold" : "text-gray-700"
      }`}
    >
      {text}
    </Text>
  </View>
);

export const StatusPill = ({ status }: { status: string }) => {
  const normalizedStatus = status?.toUpperCase();

  const getStatusStyles = () => {
    switch (normalizedStatus) {
      case "DELIVERED":
      case "RELEASED":
        return {
          container: "bg-green-100",
          text: "text-green-700",
        };

      case "FUNDED":
        return {
          container: "bg-yellow-100",
          text: "text-yellow-700",
        };

      case "CANCELLED":
      case "DISPUTED":
        return {
          container: "bg-red-100",
          text: "text-red-700",
        };

      case "REFUNDED":
        return {
          container: "bg-orange-100",
          text: "text-orange-700",
        };

      case "CREATED":
      default:
        return {
          container: "bg-gray-100",
          text: "text-gray-600",
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <View className={`px-2 py-0.5 rounded-full ${styles.container}`}>
      <Text className={`text-[10px] font-semibold ${styles.text}`}>
        {normalizedStatus}
      </Text>
    </View>
  );
};

export const RolePill = ({ role }: { role: "buyer" | "seller" }) => (
  <View
    className={`px-2 py-0.5 rounded-full ${
      role === "buyer" ? "bg-blue-100" : "bg-amber-100"
    }`}
  >
    <Text
      className={`text-[10px] font-semibold ${
        role === "buyer" ? "text-blue-700" : "text-amber-700"
      }`}
    >
      {role === "buyer" ? "Buyer" : "Seller"}
    </Text>
  </View>
);
