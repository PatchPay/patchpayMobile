import { Feather } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import SettingsHeader from "./components/settingsheader";
// import { getKycStatus } from "@/api/authapi";

type Step = {
  label: string;
  status: "done" | "pending" | "locked";
};

// seed with data from your API
const steps: Step[] = [
  { label: "Phone Number Verification", status: "done" },
  { label: "Email Verification", status: "done" },
  { label: "Government-Issued ID", status: "done" },
  { label: "Proof of Address", status: "pending" },
  { label: "Facial Verification", status: "locked" },
];

const StepRow = ({ step }: { step: Step }) => {
  const config = {
    done: { icon: "check-circle", color: "#0ea5e9", bg: "bg-sky-50" },
    pending: { icon: "clock", color: "#f59e0b", bg: "bg-amber-50" },
    locked: { icon: "lock", color: "#cbd5e1", bg: "bg-slate-50" },
  }[step.status];

  return (
    <View className="flex-row items-center py-4 border-b border-slate-100">
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center mr-4 ${config.bg}`}
      >
        <Feather name={config.icon as any} size={16} color={config.color} />
      </View>
      <View className="flex-1">
        <Text className="text-slate-800 text-sm font-semibold">
          {step.label}
        </Text>
        <Text className="text-slate-400 text-xs mt-0.5 capitalize">
          {step.status}
        </Text>
      </View>
      {step.status === "pending" && (
        <TouchableOpacity className="bg-brand rounded-md px-3 py-1.5">
          <Text className="text-white text-xs font-semibold">Continue</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function KycScreen() {
  const completed = steps.filter((s) => s.status === "done").length;
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <View className="flex-1 bg-white">
      <SettingsHeader title="Identity Verification" />

      <ScrollView
        className="flex-1 -mt-3 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        <View className="bg-surface-card rounded-md border border-surface-border shadow-card px-5 py-4 mt-3 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-slate-800 text-sm font-bold">
              Verification Progress
            </Text>
            <Text className="text-sky-500 text-sm font-bold">{progress}%</Text>
          </View>
          <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <View
              className="h-2 bg-sky-400 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        <View className="bg-surface-card rounded-md border border-surface-border shadow-card px-5">
          {steps.map((step, i) => (
            <StepRow key={i} step={step} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
