import { ActivityIndicator, Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";

export const UI = {
  screen: "flex-1 bg-surface",
  page: "px-5 pt-6 pb-32",
  card: "rounded-md border border-surface-border bg-surface-card p-4 shadow-card",
  label: "mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted",
  title: "text-2xl font-bold tracking-tight text-ink",
  body: "text-sm leading-5 text-ink-muted",
};

type ButtonProps = ComponentProps<typeof Pressable> & { label: string; loading?: boolean; variant?: "primary" | "secondary" | "danger" };
export function Button({ label, loading, variant = "primary", disabled, className = "", ...props }: ButtonProps) {
  const styles = {
    primary: "bg-brand",
    secondary: "border border-brand-light bg-surface-card",
    danger: "bg-danger",
  };
  const text = variant === "secondary" ? "text-brand-light" : "text-white";
  return <Pressable accessibilityRole="button" disabled={disabled || loading} className={`h-14 items-center justify-center rounded-md px-5 active:opacity-80 ${styles[variant]} ${disabled ? "opacity-50" : ""} ${className}`} {...props}>
    {loading ? <ActivityIndicator color={variant === "secondary" ? "#1D4ED8" : "#FFFFFF"} /> : <Text className={`text-base font-bold ${text}`}>{label}</Text>}
  </Pressable>;
}

type InputProps = TextInputProps & { label: string; icon?: ComponentProps<typeof Feather>["name"]; right?: ReactNode; error?: string | null };
export function Input({ label, icon, right, error, className = "", ...props }: InputProps) {
  return <View className="mb-4">
    <Text className={UI.label}>{label}</Text>
    <View className={`h-14 flex-row items-center rounded-md border bg-surface-card px-4 ${error ? "border-danger" : "border-surface-border"}`}>
      {icon && <Feather name={icon} size={18} color="#64748B" />}
      <TextInput className={`ml-3 flex-1 text-base text-ink ${className}`} placeholderTextColor="#94A3B8" {...props} />
      {right}
    </View>
    {!!error && <Text className="mt-2 text-xs text-danger">{error}</Text>}
  </View>;
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return <View className="mb-3 mt-6 flex-row items-center justify-between"><Text className="text-lg font-bold text-ink">{title}</Text>{action}</View>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <View accessibilityLabel="Loading" className={`rounded-md bg-blue-100 ${className}`} />;
}

export function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <View className="mb-6 flex-row items-start justify-between">
    <View className="flex-1 pr-4"><Text className="text-2xl font-bold tracking-tight text-ink">{title}</Text>{subtitle && <Text className="mt-1 text-sm text-ink-muted">{subtitle}</Text>}</View>
    {action}
  </View>;
}

export function EmptyState({ icon = "inbox", title, message, action }: { icon?: ComponentProps<typeof Feather>["name"]; title: string; message: string; action?: ReactNode }) {
  return <View className="items-center rounded-lg border border-dashed border-surface-border bg-surface-card px-6 py-10">
    <View className="mb-4 h-14 w-14 items-center justify-center rounded-md bg-blue-100"><Feather name={icon} size={25} color="#1D4ED8" /></View>
    <Text className="text-base font-bold text-ink">{title}</Text><Text className="mt-2 text-center text-sm leading-5 text-ink-muted">{message}</Text>{action && <View className="mt-5 w-full">{action}</View>}
  </View>;
}

export function StatusBadge({ label, tone = "info" }: { label: string; tone?: "info" | "success" | "warning" | "danger" }) {
  const tones = { info: "bg-blue-100 text-brand-light", success: "bg-green-100 text-green-700", warning: "bg-amber-100 text-amber-700", danger: "bg-red-100 text-danger" };
  return <View className={`self-start rounded-full px-2.5 py-1 ${tones[tone]}`}><Text className="text-xs font-bold capitalize">{label}</Text></View>;
}
