import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getUser } from "@/api/authapi";

// ── helpers ───────────────────────────────────────────────────────────────────
const getInitials = (firstName?: string, surname?: string) =>
  `${firstName?.[0] ?? ""}${surname?.[0] ?? ""}`.toUpperCase() || "U";

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// ── info row ──────────────────────────────────────────────────────────────────
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: string;
}) => (
  <View className="flex-row items-center py-4 border-b border-slate-100">
    <View className="w-9 h-9 rounded-xl bg-sky-50 items-center justify-center mr-4">
      <Feather name={icon as any} size={16} color="#0ea5e9" />
    </View>
    <View className="flex-1">
      <Text className="text-slate-400 text-[10px] uppercase tracking-widest mb-0.5">
        {label}
      </Text>
      <Text className="text-slate-800 text-sm font-semibold">
        {value || "—"}
      </Text>
    </View>
  </View>
);

// ── component ─────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await getUser();
        setUser(u);
      } catch (e) {
        console.log("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const fullName = loading
    ? "Loading…"
    : `${user?.firstName ?? ""} ${user?.middleName ?? ""} ${user?.surname ?? ""}`.trim();

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />

      {/* ── Header curve ──────────────────────────────────────────────── */}
      <View className="bg-blue-600 pt-14 pb-20 px-6 rounded-b-[40px]">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-white text-xl font-bold tracking-tight">
            My Profile
          </Text>
          <TouchableOpacity className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center">
            <Feather name="settings" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View className="items-center">
          <View className="relative">
            <View className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-sky-200 items-center justify-center">
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-blue-700 text-3xl font-bold">
                  {loading ? "…" : getInitials(user?.firstName, user?.surname)}
                </Text>
              )}
            </View>

            {/* Upload button */}
            <TouchableOpacity
              onPress={pickImage}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-sky-400 border-2 border-white items-center justify-center"
            >
              <Feather name="camera" size={13} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text className="text-white text-lg font-bold mt-3">{fullName}</Text>
          <View className="flex-row items-center gap-1 mt-1">
            <View className="w-1.5 h-1.5 rounded-full bg-sky-300" />
            <Text className="text-sky-200 text-xs">
              {user?.accountType ?? "Personal"} Account
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 -mt-6 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        {/* ── Status pill ───────────────────────────────────────────────── */}
        <View className="flex-row justify-center mb-5">
          <View className="bg-white rounded-2xl shadow-sm shadow-slate-200 px-6 py-3 flex-row gap-6">
            <View className="items-center">
              <View className="flex-row items-center gap-1 mb-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <Text className="text-sky-500 text-xs font-semibold">
                  {user?.status_client ?? "Active"}
                </Text>
              </View>
              <Text className="text-slate-400 text-[10px] uppercase tracking-wide">
                Status
              </Text>
            </View>

            <View className="w-px bg-slate-100" />

            <View className="items-center">
              <Text className="text-slate-800 text-xs font-semibold mb-0.5">
                {user?.emailVerified ? "Verified ✓" : "Unverified"}
              </Text>
              <Text className="text-slate-400 text-[10px] uppercase tracking-wide">
                Email
              </Text>
            </View>

            <View className="w-px bg-slate-100" />

            <View className="items-center">
              <Text className="text-slate-800 text-xs font-semibold mb-0.5">
                {user?.notification ? "On" : "Off"}
              </Text>
              <Text className="text-slate-400 text-[10px] uppercase tracking-wide">
                Alerts
              </Text>
            </View>
          </View>
        </View>

        {/* ── Personal Info ─────────────────────────────────────────────── */}
        <View className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100 px-5 mb-4">
          <Text className="text-slate-800 font-bold text-sm pt-4 pb-2">
            Personal Information
          </Text>
          <InfoRow icon="user" label="First Name" value={user?.firstName} />
          <InfoRow icon="user" label="Middle Name" value={user?.middleName} />
          <InfoRow icon="user" label="Surname" value={user?.surname} />
          <InfoRow
            icon="calendar"
            label="Member Since"
            value={formatDate(user?.createdAt)}
          />
        </View>

        {/* ── Contact Info ──────────────────────────────────────────────── */}
        <View className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100 px-5 mb-4">
          <Text className="text-slate-800 font-bold text-sm pt-4 pb-2">
            Contact Details
          </Text>
          <InfoRow icon="mail" label="Email Address" value={user?.email} />
          <InfoRow
            icon="phone"
            label="Phone Number"
            value={user?.phoneNumber}
          />
        </View>

        {/* ── Location ──────────────────────────────────────────────────── */}
        <View className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100 px-5 mb-6">
          <Text className="text-slate-800 font-bold text-sm pt-4 pb-2">
            Location
          </Text>
          <InfoRow icon="globe" label="Country" value={user?.country} />
          <InfoRow icon="flag" label="Country Code" value={user?.countryCode} />
        </View>

        {/* ── Edit profile button ───────────────────────────────────────── */}
        <TouchableOpacity className="bg-blue-600 rounded-2xl py-4 items-center flex-row justify-center gap-2">
          <Feather name="edit-2" size={15} color="#fff" />
          <Text className="text-white font-bold text-sm">Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
