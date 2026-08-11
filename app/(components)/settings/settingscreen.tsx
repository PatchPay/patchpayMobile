import { LogoutUser } from "@/api/authapi"; // wire up to your real API
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmModal from "../../../model/confimmodal";

// ── setting row ───────────────────────────────────────────────────────────────
type SettingRowProps = {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: "chevron" | "switch" | "none";
  value?: boolean;
  onToggle?: (v: boolean) => void;
};

const SettingRow = ({
  icon,
  label,
  subtitle,
  onPress,
  danger,
  right = "chevron",
  value,
  onToggle,
}: SettingRowProps) => (
  <TouchableOpacity
    activeOpacity={right === "switch" ? 1 : 0.6}
    onPress={right === "switch" ? undefined : onPress}
    className="flex-row items-center py-4 border-b border-slate-100"
  >
    <View
      className={`w-9 h-9 rounded-xl items-center justify-center mr-4 ${
        danger ? "bg-red-50" : "bg-sky-50"
      }`}
    >
      <Feather
        name={icon as any}
        size={16}
        color={danger ? "#ef4444" : "#0ea5e9"}
      />
    </View>
    <View className="flex-1">
      <Text
        className={`text-sm font-semibold ${
          danger ? "text-red-500" : "text-slate-800"
        }`}
      >
        {label}
      </Text>
      {subtitle ? (
        <Text className="text-slate-400 text-xs mt-0.5">{subtitle}</Text>
      ) : null}
    </View>
    {right === "chevron" && (
      <Feather name="chevron-right" size={18} color="#cbd5e1" />
    )}
    {right === "switch" && (
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#e2e8f0", true: "#38bdf8" }}
        thumbColor="#fff"
      />
    )}
  </TouchableOpacity>
);

// ── section wrapper ──────────────────────────────────────────────────────────
const SettingsSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View className="bg-surface-card rounded-md border border-surface-border shadow-card px-5 mb-4">
    <Text className="text-slate-800 font-bold text-sm pt-4 pb-2">{title}</Text>
    {children}
  </View>
);

// ── component ─────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();

  const [biometric, setBiometric] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await LogoutUser();
    router.replace("/auth/login");
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    // await deleteAccount();
    router.replace("../login");
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View className="bg-brand pt-14 pb-8 px-6 rounded-b-lg">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center"
          >
            <Feather name="arrow-left" size={16} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold tracking-tight">
            Settings
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 -mt-3 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        {/* ── Account ───────────────────────────────────────────────────── */}
        <View className="mt-3" />
        <SettingsSection title="Account">
          <SettingRow
            icon="user"
            label="Edit Personal Information"
            subtitle="Name, email, phone, address"
            onPress={() => router.push("/(components)/settings/editprofile")}
          />
          <SettingRow
            icon="credit-card"
            label="Linked Accounts & Cards"
            subtitle="Manage bank accounts and cards"
            onPress={() => router.push("/(components)/settings/linkacct")}
          />
          <SettingRow
            icon="file-text"
            label="Identity Verification (KYC)"
            subtitle="Verified"
            onPress={() => router.push("/settings/kyc")}
          />
        </SettingsSection>

        {/* ── Security ──────────────────────────────────────────────────── */}
        <SettingsSection title="Security">
          <SettingRow
            icon="lock"
            label="Change Password"
            onPress={() => router.push("/(components)/settings/changepassword")}
          />
          <SettingRow
            icon="hash"
            label="Change Transaction PIN"
            onPress={() => router.push("/(components)/settings/changepin")}
          />
          <SettingRow
            icon="shield"
            label="Two-Factor Authentication"
            subtitle={twoFactor ? "Enabled" : "Disabled"}
            right="switch"
            value={twoFactor}
            onToggle={setTwoFactor}
          />
          <SettingRow
            icon="smartphone"
            label="Biometric Login"
            subtitle="Use Face ID / Fingerprint"
            right="switch"
            value={biometric}
            onToggle={setBiometric}
          />
          <SettingRow
            icon="monitor"
            label="Active Sessions & Devices"
            onPress={() => router.push("/settings/sessions")}
          />
        </SettingsSection>

        {/* ── Preferences ───────────────────────────────────────────────── */}
        <SettingsSection title="Preferences">
          <SettingRow
            icon="bell"
            label="Push Notifications"
            right="switch"
            value={pushNotifications}
            onToggle={setPushNotifications}
          />
          <SettingRow
            icon="globe"
            label="Language"
            subtitle="English (UK)"
            onPress={() => router.push("/(components)/settings/lanuage")}
          />
          <SettingRow
            icon="dollar-sign"
            label="Default Currency"
            subtitle="NGN — Nigerian Naira"
            onPress={() => router.push("/(components)/settings/currency")}
          />
        </SettingsSection>

        {/* ── Support ───────────────────────────────────────────────────── */}
        <SettingsSection title="Support & Legal">
          <SettingRow
            icon="help-circle"
            label="Help Center"
            onPress={() => router.push("/(components)/settings/support")}
          />
          <SettingRow
            icon="message-circle"
            label="Contact Support"
            onPress={() => router.push("/(components)/settings/contact")}
          />
          <SettingRow
            icon="file"
            label="Terms & Privacy Policy"
            onPress={() => router.push("/(components)/settings/terms")}
          />
        </SettingsSection>

        {/* ── Danger zone ───────────────────────────────────────────────── */}
        <SettingsSection title="Danger Zone">
          <SettingRow
            icon="log-out"
            label="Log Out"
            danger
            onPress={() => setShowLogoutModal(true)}
          />
          <SettingRow
            icon="trash-2"
            label="Delete Account"
            subtitle="Permanently remove your account"
            danger
            onPress={() => setShowDeleteModal(true)}
          />
        </SettingsSection>

        <Text className="text-slate-300 text-[11px] text-center mt-2">
          App version 1.0.0
        </Text>
      </ScrollView>

      {/* ── Logout modal ──────────────────────────────────────────────── */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out?"
        icon="log-out"
        confirmLabel="Log Out"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      {/* ── Delete account modal ─────────────────────────────────────── */}
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        icon="trash-2"
        confirmLabel="Delete"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />
    </View>
  );
}
