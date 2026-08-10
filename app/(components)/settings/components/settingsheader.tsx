import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";

export default function SettingsHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      <View className="bg-brand pt-14 pb-8 px-6 rounded-b-lg">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center"
          >
            <Feather name="arrow-left" size={16} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold tracking-tight">
            {title}
          </Text>
        </View>
      </View>
    </>
  );
}
