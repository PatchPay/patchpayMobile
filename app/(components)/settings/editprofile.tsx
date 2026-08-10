import { getUser, updateUser } from "@/api/authapi";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

// ── field ─────────────────────────────────────────────────────────────────────
const Field = ({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
  editable?: boolean;
}) => (
  <View className="mb-4">
    <Text className="text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      editable={editable}
      className={`border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 ${
        editable ? "bg-white" : "bg-slate-50 text-slate-400"
      }`}
    />
  </View>
);

// ── component ─────────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const router = useRouter();

  // seed with whatever you loaded from getUser() on the parent screen / a fetch here
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    try {
      setLoading(true);

      const userData = await getUser();

      console.log("User data:", userData);

      setFirstName(userData.firstName || "");
      setMiddleName(userData.middleName || "");
      setSurname(userData.surname || "");
      setEmail(userData.email || "");
      setPhoneNumber(userData.phoneNumber || "");
      setCountry(userData.country || "");
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({
        firstName,
        middleName,
        surname,

        phoneNumber,
        country,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SettingsHeader title="Edit Personal Information" />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-500">Loading profile...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 -mt-3 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10"
        >
          {/* Personal Information */}
          <View className="bg-surface-card rounded-md border border-surface-border shadow-card px-5 py-4 mt-3 mb-4">
            <Field
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
            />

            <Field
              label="Middle Name"
              value={middleName}
              onChangeText={setMiddleName}
            />

            <Field label="Surname" value={surname} onChangeText={setSurname} />
          </View>

          {/* Contact Information */}
          <View className="bg-surface-card rounded-md border border-surface-border shadow-card px-5 py-4 mb-4">
            <Field
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <Field
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* Location */}
          <View className="bg-surface-card rounded-md border border-surface-border shadow-card px-5 py-4 mb-6">
            <Field label="Country" value={country} onChangeText={setCountry} />
          </View>

          {/* Save */}
          <TouchableOpacity
            disabled={saving}
            onPress={handleSave}
            className={`rounded-md py-4 items-center ${
              saving ? "bg-slate-400" : "bg-brand"
            }`}
          >
            <Text className="text-white font-bold text-sm">
              {saving ? "Saving…" : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
