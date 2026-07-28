import { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useRegister } from "./register/registercontext";
import { Button } from "@/app/(components)/ui";

const accountTypes = [
  { key: "personal", label: "Personal account", copy: "Create, fund, and track secure escrow payments.", image: require("../../assets/images/personal.png") },
  { key: "merchant", label: "Business account", copy: "Manage commercial transactions with confidence.", image: require("../../assets/images/Merchant.png") },
] as const;

export default function SelectUser() {
  const [selected, setSelected] = useState<(typeof accountTypes)[number]["key"] | null>(null);
  const { updateField } = useRegister();
  const continueRegistration = () => { if (selected) { updateField("type", selected); router.push("/auth/register/stepone"); } };

  return <View className="flex-1 bg-surface px-5 pt-16">
    <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" className="mb-10 h-11 w-11 items-center justify-center rounded-sm border border-surface-border bg-surface-card"><Feather name="arrow-left" size={20} color="#0F172A" /></Pressable>
    <Text className="text-3xl font-bold tracking-tight text-ink">Build your account</Text><Text className="mt-2 text-base leading-6 text-ink-muted">Choose the way you’ll use PatchPay. You can complete your profile in a few secure steps.</Text>
    <View className="mt-8 gap-4">
      {accountTypes.map((account) => { const active = account.key === selected; return <Pressable key={account.key} onPress={() => setSelected(account.key)} accessibilityRole="radio" accessibilityState={{ selected: active }} className={`flex-row items-center rounded-md border p-4 ${active ? "border-brand-light bg-blue-50" : "border-surface-border bg-surface-card"}`}>
        <View className="mr-4 h-14 w-14 items-center justify-center rounded-sm bg-blue-100"><Image source={account.image} className="h-9 w-9" resizeMode="contain" /></View>
        <View className="flex-1"><Text className="text-base font-bold text-ink">{account.label}</Text><Text className="mt-1 text-sm leading-5 text-ink-muted">{account.copy}</Text></View>
        <View className={`ml-3 h-5 w-5 rounded-full border-2 ${active ? "border-brand-light bg-brand-light" : "border-slate-300"}`}>{active && <View className="m-1 h-2 w-2 rounded-full bg-white" />}</View>
      </Pressable>; })}
    </View>
    <View className="mt-auto pb-10"><Button label="Continue" onPress={continueRegistration} disabled={!selected} /></View>
  </View>;
}
