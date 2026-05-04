import { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useRegister } from "./register/registercontext";

export default function SelectUser() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigation = useNavigation();
  const { updateField } = useRegister();

  const users = [
    {
      key: "personal",
      label: "Personal",
      description: "Individual account for everyday use",
      image: require("../../assets/images/personal.png"),
    },
    {
      key: "merchant",
      label: "Merchant",
      description: "Business & retail commerce",
      image: require("../../assets/images/Merchant.png"),
    },
  ];

  const handleContinue = () => {
    if (!selected) return;

    updateField("type", selected as "personal" | "merchant");

    router.push("/auth/register/stepone");
  };

  return (
    <View className="flex-1 bg-white px-5 justify-center">
      <Pressable
        onPress={() => navigation.goBack()}
        className="absolute top-16 left-5 z-10 w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
      >
        <Text className="text-gray-700 text-xl">←</Text>
      </Pressable>

      <View className="items-center mb-10">
        <Text className="text-gray-900 text-3xl font-bold mb-2">
          Who are you?
        </Text>
        <Text className="text-gray-500 text-sm text-center">
          Select your account type to continue
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-4">
        {users.map((user) => {
          const isSelected = selected === user.key;

          return (
            <Pressable
              key={user.key}
              onPress={() => setSelected(user.key)}
              className={`w-[48%] rounded-2xl p-6 items-center border
              ${
                isSelected
                  ? "bg-blue-50 border-blue-500"
                  : "bg-gray-50 border-gray-200"
              }
            `}
            >
              <Image
                source={user.image}
                className="w-10 h-10 mb-3"
                resizeMode="contain"
              />

              <Text className="text-base font-bold">{user.label}</Text>

              <Text className="text-xs text-center text-gray-500">
                {user.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-10">
        <Pressable
          disabled={!selected}
          onPress={handleContinue}
          className={`py-4 rounded-2xl items-center
          ${selected ? "bg-blue-600" : "bg-gray-200"}
        `}
        >
          <Text
            className={`font-bold text-base ${
              selected ? "text-white" : "text-gray-400"
            }`}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
