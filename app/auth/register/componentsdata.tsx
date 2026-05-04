import {
  View,
  Text,
  TextInput,
  Pressable,
  //   ActivityIndicator,
  TextInputProps,
  StyleSheet,
} from "react-native";
import { useState } from "react";

// ─── Progress Bar ────────────────────────────────────────────────────────────

type ProgressBarProps = {
  currentStep: number; // 1-based
  totalSteps: number;
  label?: string;
};

export function ProgressBar({
  currentStep,
  totalSteps,
  label,
}: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          {label ?? `Step ${currentStep} of ${totalSteps}`}
        </Text>
        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.dotRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i + 1 < currentStep && styles.dotDone,
              i + 1 === currentStep && styles.dotActive,
              i + 1 > currentStep && styles.dotFuture,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Screen Shell ─────────────────────────────────────────────────────────────

type ScreenShellProps = {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  stepLabel?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

export function ScreenShell({
  children,
  step,
  totalSteps,
  stepLabel,
  title,
  subtitle,
  onBack,
}: ScreenShellProps) {
  return (
    <View style={styles.shell}>
      {/* Back button */}
      {onBack && (
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      )}

      <ProgressBar
        currentStep={step}
        totalSteps={totalSteps}
        label={stepLabel}
      />

      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <View style={styles.formArea}>{children}</View>
    </View>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────

type InputFieldProps = TextInputProps & {
  label: string;
  error?: string;
  rightIcon?: React.ReactNode;
};

export function InputField({
  label,
  error,
  rightIcon,
  ...props
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor="#b0b8c4"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />

        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ─── Primary Button ───────────────────────────────────────────────────────────

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

// export function PrimaryButton({
//   label,
//   onPress,
//   loading,
//   disabled,
// }: PrimaryButtonProps) {
//   return (
//     <Pressable
//       onPress={onPress}
//       disabled={loading || disabled}
//       style={({ pressed }) => [
//         styles.primaryBtn,
//         (pressed || disabled) && styles.primaryBtnPressed,
//       ]}
//     >
//       {loading ? (
//         <ActivityIndicator color="#fff" />
//       ) : (
//         <Text style={styles.primaryBtnText}>{label}</Text>
//       )}
//     </Pressable>
//   );
// }

// ─── Review Row ───────────────────────────────────────────────────────────────

export function PrimaryButton({ label, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-blue-600 py-4 px-6 rounded-xl items-center justify-center shadow-md"
    >
      <Text className="text-white font-bold text-base">{label}</Text>
    </Pressable>
  );
}
export function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      {label && <Text style={styles.dividerLabel}>{label}</Text>}
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Shell
  shell: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 4,
  },
  backArrow: {
    fontSize: 18,
    color: "#374151",
    lineHeight: 22,
  },
  backText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.5,
    marginTop: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 28,
    lineHeight: 22,
  },
  formArea: {
    marginTop: 8,
    // flex: 1,
  },

  // Progress
  progressContainer: {
    marginBottom: 4,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  progressPercent: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "600",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#f1f5f9",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0f172a",
    borderRadius: 99,
  },
  dotRow: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  dotDone: { backgroundColor: "#0f172a" },
  dotActive: { backgroundColor: "#0f172a", width: 20 },
  dotFuture: { backgroundColor: "#e2e8f0" },

  // Input
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0f172a",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fafafa",
  },
  inputFocused: {
    borderColor: "#0f172a",
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#ef4444",
  },

  icon: {
    marginLeft: 8,
  },

  // Button
  primaryBtn: {
    backgroundColor: "pink",
  },
  primaryBtnPressed: {
    opacity: 0.75,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Review
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  reviewLabel: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
    flex: 1,
  },
  reviewValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  dividerLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
