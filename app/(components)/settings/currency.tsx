import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import SettingsHeader from "./components/settingsheader";
// import { updateDefaultCurrency } from "@/api/authapi";

const CURRENCIES = [
  { code: "NGN", label: "Nigerian Naira" },
  { code: "USD", label: "US Dollar" },
  { code: "GBP", label: "British Pound" },
  { code: "EUR", label: "Euro" },
  { code: "GHS", label: "Ghanaian Cedi" },
  { code: "KES", label: "Kenyan Shilling" },
];

export default function CurrencyScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState("NGN");

  const handleSelect = async (code: string) => {
    setSelected(code);
    // await updateDefaultCurrency(code);
    router.back();
  };

  return (
    <View className="flex-1 bg-white">
      <SettingsHeader title="Default Currency" />

      <ScrollView
        className="flex-1 -mt-3 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        <View className="mt-3" />
        <View className="bg-surface-card rounded-md border border-surface-border shadow-card px-5">
          {CURRENCIES.map((currency, i) => (
            <TouchableOpacity
              key={currency.code}
              onPress={() => handleSelect(currency.code)}
              className={`flex-row items-center justify-between py-4 ${
                i < CURRENCIES.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <View>
                <Text className="text-slate-800 text-sm font-semibold">
                  {currency.code}
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  {currency.label}
                </Text>
              </View>
              {selected === currency.code && (
                <Feather name="check" size={18} color="#0ea5e9" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
