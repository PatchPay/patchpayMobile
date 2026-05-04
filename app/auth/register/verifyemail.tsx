import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useRegister } from "./registercontext";

// ── Replace with your real API call ──────────────────────────────────────────
async function verifyOtp(
  email: string,
  otp: string,
  countryCode: string,
): Promise<void> {
  console.log("📤 Sending OTP request:", { email, otp, countryCode });

  const res = await fetch(
    "https://patchpaybackend.onrender.com/api/users/verify-email",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, countryCode }),
    },
  );

  console.log("📥 Response status:", res.status);

  const data = await res.json().catch(() => ({}));

  console.log("📥 Response body:", data);

  if (!res.ok) {
    throw new Error(data?.message ?? "Verification failed.");
  }
}

async function resendOtp(email: string): Promise<void> {
  console.log("📤 Resending OTP:", email);

  const res = await fetch(
    "https://patchpaybackend.onrender.com/api/users/resend-otp",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
  );

  const data = await res.json().catch(() => ({})); // ✅ FIX

  console.log("📥 Status:", res.status);
  console.log("📥 Body:", data);

  if (!res.ok) {
    throw new Error(data?.message ?? "Could not resend code.");
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyEmail() {
  const { formData } = useRegister();
  const email = formData.email ?? "";
  const countryCode = formData.countryCode ?? "";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focused, setFocused] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // ── Auto-submit once all digits filled ───────────────────────────────────
  useEffect(() => {
    if (digits.every((d) => d.length === 1)) {
      Keyboard.dismiss();
      handleVerify(digits.join(""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDigitChange = (value: string, index: number) => {
    // Allow pasting full OTP into first box
    if (value.length === OTP_LENGTH) {
      const pasted = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      const next = [...pasted, ...Array(OTP_LENGTH).fill("")].slice(
        0,
        OTP_LENGTH,
      );
      setDigits(next);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
    }
  };

  const handleVerify = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(email, otp, countryCode);
      setVerified(true);
      setTimeout(() => {
        // resetForm();
        router.replace("/auth/login"); // ← adjust to your home route
      }, 1600);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      // Clear boxes so user can re-enter
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await resendOtp(email);
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message ?? "Could not resend code.");
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => {
    return a + "*".repeat(Math.max(b.length, 3)) + c;
  });

  // ── Success screen ────────────────────────────────────────────────────────
  if (verified) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successRing}>
          <View style={styles.successIcon}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
        </View>
        <Text style={styles.successTitle}>Email verified!</Text>
        <Text style={styles.successSubtitle}>
          Your account is ready. Taking you home…
        </Text>
      </View>
    );
  }

  // ── Main screen ───────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.shell}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.stepTag}>Verification</Text>
          </View>

          <View style={styles.iconBadge}>
            <Text style={styles.iconEmoji}>✉️</Text>
          </View>

          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{" "}
            <Text style={styles.emailHighlight}>{maskedEmail}</Text>. Enter it
            below to verify your account.
          </Text>

          {/* OTP Input Row */}
          <View style={styles.otpRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputRefs.current[i] = r;
                }}
                style={[
                  styles.otpBox,
                  focused === i && styles.otpBoxFocused,
                  digit ? styles.otpBoxFilled : null,
                  error ? styles.otpBoxError : null,
                ]}
                value={digit}
                onChangeText={(v) => handleDigitChange(v, i)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, i)
                }
                onFocus={() => setFocused(i)}
                onBlur={() => setFocused(-1)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH} // allows paste detection on first box
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                selectTextOnFocus
                editable={!loading}
                caretHidden
              />
            ))}
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>!</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Verify button (manual fallback) */}
          <Pressable
            onPress={() => handleVerify(digits.join(""))}
            disabled={loading || digits.some((d) => !d)}
            style={({ pressed }) => [
              styles.verifyBtn,
              pressed && styles.verifyBtnPressed,
              (loading || digits.some((d) => !d)) && styles.verifyBtnDisabled,
            ]}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.verifyBtnText}>Verifying…</Text>
              </View>
            ) : (
              <Text style={styles.verifyBtnText}>Verify Email</Text>
            )}
          </Pressable>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>
              Didn&lsquo;t receive the code?{" "}
            </Text>
            {cooldown > 0 ? (
              <Text style={styles.resendCooldown}>Resend in {cooldown}s</Text>
            ) : (
              <Pressable onPress={handleResend} disabled={resending}>
                <Text
                  style={[styles.resendLink, resending && { opacity: 0.5 }]}
                >
                  {resending ? "Sending…" : "Resend code"}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Progress dots */}
          <View style={styles.progressRow}>
            {[0, 1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressDot,
                  step === 3 && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  headerRow: { marginBottom: 24 },
  stepTag: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Email icon badge
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconEmoji: { fontSize: 26 },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 23,
    marginBottom: 36,
  },
  emailHighlight: {
    color: "#0f172a",
    fontWeight: "600",
  },

  // OTP boxes
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 28,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  otpBoxFocused: {
    borderColor: "#2563eb",
    backgroundColor: "#ffffff",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  otpBoxFilled: {
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  otpBoxError: {
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
  },

  // Error
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 0.5,
    borderColor: "#FECACA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  errorIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E24B4A",
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
    overflow: "hidden",
  },
  errorText: { flex: 1, fontSize: 13, color: "#B91C1C", lineHeight: 18 },

  // Verify button
  verifyBtn: {
    height: 52,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyBtnPressed: {
    backgroundColor: "#1d4ed8",
    shadowOpacity: 0.1,
  },
  verifyBtnDisabled: {
    backgroundColor: "#93c5fd",
    shadowOpacity: 0,
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // Resend
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  resendLabel: { fontSize: 14, color: "#94a3b8" },
  resendLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
  resendCooldown: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
  },

  // Step progress dots (matches the multi-step register flow)
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 40,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e2e8f0",
  },
  progressDotActive: {
    width: 20,
    backgroundColor: "#2563eb",
  },

  // Success
  successContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  successRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  successCheck: { fontSize: 28, color: "#ffffff", fontWeight: "700" },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },
});
