import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import SettingsHeader from "./components/settingsheader";
// import { getLinkedAccounts, unlinkAccount } from "@/api/authapi";

type LinkedAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  type: "bank" | "card";
  isDefault?: boolean;
};

// seed with data from your API
const MOCK_ACCOUNTS: LinkedAccount[] = [
  {
    id: "1",
    bankName: "GTBank",
    accountNumber: "•••• 4821",
    type: "bank",
    isDefault: true,
  },
  {
    id: "2",
    bankName: "Access Bank",
    accountNumber: "•••• 0093",
    type: "bank",
  },
  { id: "3", bankName: "Visa Debit", accountNumber: "•••• 7712", type: "card" },
];

export default function LinkedAccountsScreen() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>(MOCK_ACCOUNTS);

  const handleUnlink = (id: string) => {
    // await unlinkAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <View className="flex-1 bg-white">
      <SettingsHeader title="Linked Accounts & Cards" />

      <ScrollView
        className="flex-1 -mt-3 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        <View className="mt-3" />
        <View className="bg-surface-card rounded-md border border-surface-border shadow-card px-5 mb-6">
          {accounts.map((account, i) => (
            <View
              key={account.id}
              className={`flex-row items-center py-4 ${
                i < accounts.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <View className="w-9 h-9 rounded-xl bg-sky-50 items-center justify-center mr-4">
                <Feather
                  name={account.type === "card" ? "credit-card" : "briefcase"}
                  size={16}
                  color="#0ea5e9"
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-slate-800 text-sm font-semibold">
                    {account.bankName}
                  </Text>
                  {account.isDefault && (
                    <View className="bg-sky-50 px-2 py-0.5 rounded-full">
                      <Text className="text-sky-500 text-[10px] font-semibold">
                        Default
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-slate-400 text-xs mt-0.5">
                  {account.accountNumber}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleUnlink(account.id)}>
                <Feather name="x" size={16} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          ))}

          {accounts.length === 0 && (
            <Text className="text-slate-400 text-sm text-center py-8">
              No linked accounts or cards yet.
            </Text>
          )}
        </View>

        <TouchableOpacity className="bg-brand rounded-md py-4 items-center flex-row justify-center gap-2">
          <Feather name="plus" size={15} color="#fff" />
          <Text className="text-white font-bold text-sm">
            Link a New Account or Card
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
