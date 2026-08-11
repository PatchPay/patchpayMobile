/* eslint-disable react-hooks/exhaustive-deps */
import { router } from "expo-router";
import { ArrowLeft, ChevronRight, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getMyEscrow } from "@/api/escrowapi";
import { useAuth } from "@/hooks/useAuth"; // adjust to wherever you store the logged-in user
import {
  formatDate,
  formatMoney,
  getCounterpartyName,
  getRole,
  RolePill,
  StatusPill,
} from "./escrowshared";

type FilterTab = "all" | "buyer" | "seller";

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "buyer", label: "As Buyer" },
  { key: "seller", label: "As Seller" },
];

const EscrowListScreen = () => {
  const { user } = useAuth(); // expects user.id
  const [escrows, setEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    const loadEscrows = async () => {
      try {
        const result = await getMyEscrow();

        console.log("MY ESCROWS:", result);

        result?.forEach((escrow: any) => {
          console.log("ESCROW ROLE:", {
            escrowId: escrow.id,
            creatorId: escrow.creatorId,
            recipientId: escrow.recipientId,
            currentUserId: user?.id,
            role: getRole(escrow, user?.id),
          });
        });

        setEscrows(result || []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    loadEscrows();
  }, []);

  const filtered = escrows.filter((escrow) => {
    if (filter === "all") {
      return true;
    }

    const role = getRole(escrow, user?.id);

    console.log("FILTER CHECK:", {
      escrowId: escrow.id,
      filter,
      role,
      userId: user?.id,
    });

    return role === filter;
  });

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#4f46e5" />
        <Text className="text-gray-400 mt-3">Loading escrow transactions…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="bg-brand px-5 pt-10 pb-6 rounded-b-lg">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1 -ml-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft color="white" size={22} />
          </TouchableOpacity>

          <View className="bg-white/20 p-3 rounded-full">
            <ShieldCheck color="white" size={22} />
          </View>

          <Text className="text-white text-lg font-semibold ml-3">
            Escrow Transactions
          </Text>
        </View>

        {/* Filter tabs */}
        <View className="flex-row bg-white/10 rounded-md mt-6 p-1">
          {FILTERS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilter(tab.key)}
              className={`flex-1 py-2 rounded-md items-center ${
                filter === tab.key ? "bg-white" : ""
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filter === tab.key ? "text-brand" : "text-white"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="p-5"
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-6">
            <ShieldCheck color="#9ca3af" size={32} />
            <Text className="text-gray-500 mt-3 text-center">
              {filter === "all"
                ? "You don't have any escrow transactions yet."
                : `You don't have any escrow transactions as ${filter} yet.`}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const role = getRole(item, user?.id);
          const counterpartyName = getCounterpartyName(item, role);

          return (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(components)/escrow/[id]",
                  params: { id: String(item.id) },
                })
              }
              className="bg-surface-card rounded-md border border-surface-border p-4 shadow-card flex-row items-center"
            >
              <View className="bg-brand/10 p-3 rounded-full">
                <ShieldCheck color="#4f46e5" size={18} />
              </View>

              <View className="ml-3 flex-1">
                <Text
                  className="font-semibold text-slate-800"
                  numberOfLines={1}
                >
                  {item.description || counterpartyName}
                </Text>
                <Text className="text-gray-400 text-xs mt-1" numberOfLines={1}>
                  {role === "buyer" ? "Seller" : "Buyer"}: {counterpartyName} ·{" "}
                  {formatDate(item.expiryDate)}
                </Text>
                <View className="flex-row items-center gap-2 mt-2">
                  <RolePill role={role} />
                  <StatusPill status={item.status} />
                </View>
              </View>

              <View className="items-end ml-2">
                <Text className="font-bold text-slate-800">
                  {formatMoney(item.amount, item.currency)}
                </Text>
                <ChevronRight color="#cbd5e1" size={18} />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

export default EscrowListScreen;
