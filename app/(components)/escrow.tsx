import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getMyEscrow } from "@/api/escrowapi";
import { useAuth } from "@/hooks/useAuth"; // adjust to wherever you store the logged-in user
import {
  CheckCircle,
  Clock,
  FileText,
  Lock,
  PackageCheck,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react-native";

const formatMoney = (amount: number, currency: string) => {
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

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const EscrowDetailsScreen = () => {
  const { user } = useAuth(); // expects user._id
  const [escrow, setEscrow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEscrow = async () => {
      try {
        const result = await getMyEscrow();
        if (result?.length) {
          // pick most relevant active escrow first, fallback to latest
          const active = result.find((e: any) => e.status === "FUNDED");
          setEscrow(active || result[0]);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    loadEscrow();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center">
        <Text className="text-gray-400">Loading escrow…</Text>
      </SafeAreaView>
    );
  }

  if (!escrow) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center px-6">
        <ShieldCheck color="#9ca3af" size={32} />
        <Text className="text-gray-500 mt-3 text-center">
          You don&rsquo;t have any escrow transactions yet.
        </Text>
      </SafeAreaView>
    );
  }

  const isCreator = escrow?.creatorId?._id === user?._id;
  const counterpartyName = isCreator
    ? escrow?.recipientId?.firstName ||
      escrow?.recipientId?.companyName ||
      "Seller"
    : escrow?.creatorId?.firstName || escrow?.creatorId?.companyName || "Buyer";

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
                {isCreator ? "Escrow You Funded" : "Escrow Payment for You"}
              </Text>
              <Text className="text-white/60 text-xs">{escrow.escrowUprn}</Text>
            </View>

            <View
              className={`ml-auto px-3 py-1 rounded-full ${
                escrow.status === "FUNDED" ? "bg-green-500" : "bg-gray-400"
              }`}
            >
              <Text className="text-white text-xs">{escrow.status}</Text>
            </View>
          </View>

          <View className="mt-6">
            <Text className="text-white/60 text-xs uppercase">
              {isCreator ? "Amount You Secured" : "Amount Owed To You"}
            </Text>
            <Text className="text-white text-3xl font-bold mt-1">
              {formatMoney(escrow.amount, escrow.currency)}
            </Text>
          </View>
        </View>

        <View className="p-5 space-y-4">
          {/* Order Card — shared, but labels differ */}
          <View className="bg-white rounded-2xl p-5">
            <Text className="text-gray-400 text-xs uppercase mb-3">
              Order Summary
            </Text>
            <Row title="Description" value={escrow.description} />
            <Row
              title={isCreator ? "Seller" : "Buyer"}
              value={counterpartyName}
            />
            <Row title="Currency" value={escrow.currency} />
            <Row title="Expires" value={formatDate(escrow.expiryDate)} />
            <Row title="Status" value={escrow.status} />
          </View>

          {/* CREATOR (buyer) view */}
          {isCreator && (
            <>
              <View className="bg-green-100 rounded-2xl p-4 flex-row items-center">
                <View className="bg-green-500 p-3 rounded-full">
                  <Lock size={20} color="white" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-green-700">
                    Payment secured
                  </Text>
                  <Text className="text-gray-600 text-xs mt-1">
                    Funds are held until you confirm delivery.
                  </Text>
                </View>
              </View>

              <View className="bg-white rounded-2xl p-5">
                <Text className="text-gray-400 text-xs uppercase mb-4">
                  Progress
                </Text>
                <Timeline done text="Quote accepted" />
                <Timeline done text="Invoice generated" />
                <Timeline done text="Payment completed" />
                <Timeline active text="Waiting for seller delivery" />
                <Timeline text="Funds released" />
              </View>

              <View className="bg-blue-100 rounded-2xl p-4">
                <Text className="font-semibold text-blue-700">Next step</Text>
                <Text className="text-gray-700 text-sm mt-2">
                  Once you receive your order, confirm delivery to release funds
                  to the seller.
                </Text>
              </View>

              <View className="bg-white rounded-2xl p-5 flex-row items-center">
                <FileText size={25} color="#4f46e5" />
                <View className="ml-3">
                  <Text className="font-semibold">Invoice Document</Text>
                  <Text className="text-gray-400 text-xs">
                    View payment invoice
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                disabled={escrow.status !== "FUNDED"}
                className={`rounded-2xl py-4 items-center mt-3 ${
                  escrow.status === "FUNDED" ? "bg-indigo-600" : "bg-gray-300"
                }`}
              >
                <View className="flex-row items-center">
                  <PackageCheck size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Confirm Delivery
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* RECIPIENT (seller) view */}
          {!isCreator && (
            <>
              <View className="bg-indigo-100 rounded-2xl p-4 flex-row items-center">
                <View className="bg-indigo-500 p-3 rounded-full">
                  <Wallet size={20} color="white" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-indigo-700">
                    Funds reserved for you
                  </Text>
                  <Text className="text-gray-600 text-xs mt-1">
                    {formatMoney(escrow.currentBalance, escrow.currency)} will
                    be released once the buyer confirms delivery.
                  </Text>
                </View>
              </View>

              <View className="bg-white rounded-2xl p-5">
                <Text className="text-gray-400 text-xs uppercase mb-4">
                  Progress
                </Text>
                <Timeline done text="Quote accepted" />
                <Timeline done text="Invoice generated" />
                <Timeline done text="Buyer payment received" />
                <Timeline active text="Deliver product/service" />
                <Timeline text="Funds released to you" />
              </View>

              <View className="bg-yellow-100 rounded-2xl p-4">
                <Text className="font-semibold text-yellow-700">
                  Action required
                </Text>
                <Text className="text-gray-700 text-sm mt-2">
                  Deliver the item to the buyer, then mark it as delivered. Your
                  payout is released after buyer confirmation.
                </Text>
              </View>

              <View className="bg-white rounded-2xl p-5 flex-row items-center">
                <FileText size={25} color="#4f46e5" />
                <View className="ml-3">
                  <Text className="font-semibold">Invoice Document</Text>
                  <Text className="text-gray-400 text-xs">
                    View invoice sent to buyer
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                disabled={escrow.status !== "FUNDED"}
                className={`rounded-2xl py-4 items-center mt-3 ${
                  escrow.status === "FUNDED" ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <View className="flex-row items-center">
                  <Truck size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Mark Delivered
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Row = ({ title, value }: { title: string; value: string }) => (
  <View className="flex-row justify-between py-3 border-b border-gray-100">
    <Text className="text-gray-400">{title}</Text>
    <Text className="font-medium">{value}</Text>
  </View>
);

const Timeline = ({
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

export default EscrowDetailsScreen;
