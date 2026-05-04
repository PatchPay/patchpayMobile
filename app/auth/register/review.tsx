import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useRegister } from "./registercontext";
import { ReviewRow, Divider } from "./componentsdata";
import { registerUser } from "@/api/authapi";

const TYPE_LABELS: Record<string, string> = {
  personal: "Personal",
  merchant: "Merchant",
};

export default function Review() {
  const { formData } = useRegister();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPersonal = formData.type === "personal";

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        accountType: formData.type === "personal" ? "Personal" : "Merchant",
        firstName: formData.firstName,
        middleName: formData.middleName,
        surname: formData.surname,
        phoneNumber: formData.phone,
        country: formData.country,
        countryCode: formData.countryCode,
        businessName: formData.businessName,
        industry: formData.industry,
        companyAddress: formData.companyAddress,
        companyRegistrationNumber: formData.companyRegistrationNumber,
      };

      const response = await registerUser(payload);
      console.log("Registration success:", response);
      setSubmitted(true);

      setTimeout(() => {
        router.replace({
          pathname: "/auth/register/verifyemail",
          params: {
            email: formData.email,
          },
        });

        // resetForm();
      }, 1500);
    } catch (err: any) {
      console.log("Registration failed:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.successTitle}>You&lsquo;re all set!</Text>
        <Text style={styles.successSubtitle}>
          Your account has been created. Taking you home…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.shell}>
        <View style={styles.headerRow}>
          <Text style={styles.stepTag}>Final step</Text>
        </View>

        <Text style={styles.title}>Review & submit</Text>
        <Text style={styles.subtitle}>
          Please confirm your details before creating your account.
        </Text>

        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {TYPE_LABELS[formData.type] ?? formData.type} Account
          </Text>
        </View>

        <Divider label="Credentials" />
        <ReviewRow label="Email" value={formData.email} />
        <ReviewRow label="Password" value="••••••••" />

        {isPersonal && (
          <>
            <Divider label="Personal details" />
            <ReviewRow
              label="Full name"
              value={[formData.firstName, formData.middleName, formData.surname]
                .filter(Boolean)
                .join(" ")}
            />
            <ReviewRow label="Phone" value={formData.phone} />
            <ReviewRow label="Country" value={formData.country} />
          </>
        )}

        {!isPersonal && (
          <>
            <Divider label="Organisation details" />
            <ReviewRow label="Name" value={formData.businessName} />
            <ReviewRow label="Industry" value={formData.industry} />
            <ReviewRow label="Address" value={formData.companyAddress} />
            <ReviewRow
              label="Reg. number"
              value={formData.companyRegistrationNumber}
            />
          </>
        )}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            By submitting, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit button */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className={`h-14 rounded-xl items-center justify-center mt-6 ${
            loading ? "bg-blue-300" : "bg-blue-600 active:bg-blue-700"
          }`}
        >
          {loading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-semibold text-base">
                Creating account...
              </Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-base">
              Create Account
            </Text>
          )}
        </Pressable>

        <Text style={styles.editHint} onPress={() => !loading && router.back()}>
          ← Edit details
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  headerRow: { marginBottom: 12 },
  stepTag: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 22,
    marginBottom: 20,
  },
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  typeBadgeText: { fontSize: 13, fontWeight: "600", color: "#0f172a" },

  disclaimer: {
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 14,
  },
  disclaimerText: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
    textAlign: "center",
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
    marginBottom: 14,
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

  // Submit button
  submitBtn: {
    height: 52,
    backgroundColor: "#1D9E75",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: "#1D9E75",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnPressed: {
    backgroundColor: "#0F6E56",
    shadowOpacity: 0.1,
    transform: [{ scale: 0.98 }],
  },
  submitBtnLoading: {
    backgroundColor: "#5DCAA5",
    shadowOpacity: 0,
  },
  submitBtnText: {
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

  editHint: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },

  // Success
  successContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1D9E75",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
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
