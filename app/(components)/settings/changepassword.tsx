import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import SettingsHeader from "./components/settingsheader";
// import { changePassword } from "@/api/authapi";

const PasswordField = ({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) => {
  const [hidden, setHidden] = useState(true);
  return (
    <View className="mb-4">
      <Text className="text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">
        {label}
      </Text>
      <View className="flex-row items-center border border-slate-200 rounded-md px-4">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          className="flex-1 py-3 text-sm text-slate-800"
        />
        <TouchableOpacity onPress={() => setHidden(!hidden)}>
          <Feather
            name={hidden ? "eye" : "eye-off"}
            size={16}
            color="#94a3b8"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }
    setSaving(true);
    try {
      // await changePassword({ currentPassword, newPassword });
      router.back();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SettingsHeader title="Change Password" />

      <ScrollView
        className="flex-1 -mt-3 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        <View className="bg-surface-card rounded-md border border-surface-border shadow-card px-5 py-4 mt-3 mb-4">
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <PasswordField
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {error ? (
          <Text className="text-red-500 text-xs mb-4 px-1">{error}</Text>
        ) : null}

        <Text className="text-slate-400 text-xs mb-6 px-1 leading-5">
          Use at least 8 characters, including a number and a symbol, for a
          stronger password.
        </Text>

        <TouchableOpacity
          disabled={saving}
          onPress={handleSubmit}
          className="bg-brand rounded-md py-4 items-center"
        >
          <Text className="text-white font-bold text-sm">
            {saving ? "Updating…" : "Update Password"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
