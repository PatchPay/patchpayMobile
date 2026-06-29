import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  CheckCircle,
  Clock,
  FileText,
  Lock,
  ShieldCheck,
  Truck,
} from "lucide-react-native";

type Props = {
  role: "buyer" | "seller";
};

const EscrowDetailsScreen = ({ role }: Props) => {
  const isBuyer = role === "buyer";

  const escrow = {
    id: "ESC-20260629-12345",
    amount: "₦500,000",
    product: "iPhone 15 Pro",
    buyer: "Daniel",
    seller: "John Doe",
    status: "FUNDED",
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView>
        {/* Header */}

        <View className="bg-indigo-700 px-5 pt-10 pb-8 rounded-b-3xl">
          <View className="flex-row items-center">
            <View className="bg-white/20 p-3 rounded-full">
              <ShieldCheck color="white" size={22} />
            </View>

            <View className="ml-3">
              <Text className="text-white text-lg font-semibold">
                {isBuyer ? "Escrow Details" : "Escrow Payment"}
              </Text>

              <Text className="text-white/60 text-xs">{escrow.id}</Text>
            </View>

            <View className="ml-auto bg-green-500 px-3 py-1 rounded-full">
              <Text className="text-white text-xs">Protected</Text>
            </View>
          </View>

          <View className="mt-6">
            <Text className="text-white/60 text-xs uppercase">
              Amount Secured
            </Text>

            <Text className="text-white text-3xl font-bold mt-1">
              {escrow.amount}
            </Text>
          </View>
        </View>

        <View className="p-5 space-y-4">
          {/* Order Card */}

          <View className="bg-white rounded-2xl p-5">
            <Text className="text-gray-400 text-xs uppercase mb-3">
              Order Summary
            </Text>

            <Row title="Product" value={escrow.product} />

            <Row title="Buyer" value={escrow.buyer} />

            <Row title="Seller" value={escrow.seller} />

            <Row title="Payment" value="Invoice Paid" />

            <Row title="Status" value="FUNDED" />
          </View>

          {/* Protection box */}

          <View className="bg-green-100 rounded-2xl p-4 flex-row items-center">
            <View className="bg-green-500 p-3 rounded-full">
              <Lock size={20} color="white" />
            </View>

            <View className="ml-3 flex-1">
              <Text className="font-semibold text-green-700">
                Payment secured
              </Text>

              <Text className="text-gray-600 text-xs mt-1">
                Funds are held until delivery is confirmed.
              </Text>
            </View>
          </View>

          {/* Timeline */}

          <View className="bg-white rounded-2xl p-5">
            <Text className="text-gray-400 text-xs uppercase mb-4">
              Progress
            </Text>

            <Timeline done text="Quote accepted" />

            <Timeline done text="Invoice generated" />

            <Timeline done text="Payment completed" />

            <Timeline
              active
              text={
                isBuyer
                  ? "Waiting for seller delivery"
                  : "Deliver product/service"
              }
            />

            <Timeline text="Funds released" />
          </View>

          {/* Seller Info */}

          {!isBuyer && (
            <View className="bg-blue-100 rounded-2xl p-4">
              <Text className="font-semibold text-blue-700">Next step</Text>

              <Text className="text-gray-700 text-sm mt-2">
                Deliver the item. Buyer confirmation will release your funds.
              </Text>
            </View>
          )}

          {/* Documents */}

          <View className="bg-white rounded-2xl p-5 flex-row items-center">
            <FileText size={25} color="#4f46e5" />

            <View className="ml-3">
              <Text className="font-semibold">Invoice Document</Text>

              <Text className="text-gray-400 text-xs">
                View payment invoice
              </Text>
            </View>
          </View>

          {/* Action Button */}

          <TouchableOpacity
            className={`rounded-2xl py-4 items-center mt-3 ${
              isBuyer ? "bg-indigo-600" : "bg-green-600"
            }`}
          >
            <Text className="text-white font-semibold">
              {isBuyer ? "Confirm Delivery" : "Mark Delivered"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Row = ({ title, value }: { title: string; value: string }) => {
  return (
    <View className="flex-row justify-between py-3 border-b border-gray-100">
      <Text className="text-gray-400">{title}</Text>

      <Text className="font-medium">{value}</Text>
    </View>
  );
};

const Timeline = ({
  text,
  done,
  active,
}: {
  text: string;
  done?: boolean;
  active?: boolean;
}) => {
  return (
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
};

export default EscrowDetailsScreen;
