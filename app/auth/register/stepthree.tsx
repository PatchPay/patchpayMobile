import { ScrollView, Text, View } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import { useRegister } from "./registercontext";
import { PrimaryButton } from "./componentsdata";

export default function StepThree() {
  const { formData } = useRegister();
  const isPersonal = formData.type === "personal";
  return <ScrollView className="flex-1 bg-surface" contentContainerClassName="px-5 pt-16 pb-10">
    <View className="mb-8 h-14 w-14 items-center justify-center rounded-md bg-blue-100"><ShieldCheck size={27} color="#1D4ED8" /></View>
    <Text className="text-3xl font-bold tracking-tight text-ink">Almost there</Text>
    <Text className="mt-3 text-base leading-6 text-ink-muted">We use these details to keep your escrow activity protected and compliant.</Text>
    <View className="my-8 rounded-md border border-surface-border bg-surface-card p-5"><Text className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Account type</Text><Text className="mt-2 text-lg font-bold text-ink">{isPersonal ? "Personal" : "Business"} PatchPay account</Text></View>
    <PrimaryButton label={isPersonal ? "Finish personal registration" : "Continue to organisation details"} onPress={() => {}} />
  </ScrollView>;
}
