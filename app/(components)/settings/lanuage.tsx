import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import SettingsHeader from "./components/settingsheader";
// import { updateLanguage } from "@/api/authapi";

const LANGUAGES = [
  { code: "en-GB", label: "English (UK)" },
  { code: "en-US", label: "English (US)" },
  { code: "fr", label: "Français" },
  { code: "ha", label: "Hausa" },
  { code: "ig", label: "Igbo" },
  { code: "yo", label: "Yorùbá" },
  { code: "pt", label: "Português" },
];

export default function LanguageScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState("en-GB");

  const handleSelect = async (code: string) => {
    setSelected(code);
    // await updateLanguage(code);
    router.back();
  };

  return (
    <View className="flex-1 bg-white">
      <SettingsHeader title="Language" />

      <ScrollView
        className="flex-1 -mt-3 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        <View className="mt-3" />
        <View className="bg-surface-card rounded-md border border-surface-border shadow-card px-5">
          {LANGUAGES.map((lang, i) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => handleSelect(lang.code)}
              className={`flex-row items-center justify-between py-4 ${
                i < LANGUAGES.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <Text className="text-slate-800 text-sm font-semibold">
                {lang.label}
              </Text>
              {selected === lang.code && (
                <Feather name="check" size={18} color="#0ea5e9" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
