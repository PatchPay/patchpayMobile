import { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useRegister } from "./registercontext";
import { ScreenShell, InputField, PrimaryButton } from "./componentsdata";
import Feather from "@expo/vector-icons/Feather";

function getStrengthScore(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_COLORS = ["#E24B4A", "#E24B4A", "#EF9F27", "#1D9E75", "#1D9E75"];
const STRENGTH_LABELS = ["", "Weak", "Weak", "Fair", "Strong"];

function StrengthBars({ score }: { score: number }) {
  const barColor = (i: number) => {
    if (i >= score) return "#E5E5E5";
    if (score <= 1) return "#E24B4A";
    if (score === 2) return "#EF9F27";
    return "#1D9E75";
  };
  return (
    <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 99,
            backgroundColor: barColor(i),
          }}
        />
      ))}
    </View>
  );
}

export default function StepOne() {
  const { formData, updateField } = useRegister();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  const typeLabels: Record<string, string> = {
    personal: "Personal Account",
    merchant: "Merchant Account",
  };

  const strengthScore = getStrengthScore(formData.password);
  const passwordsMatch =
    confirmPassword.length > 0 && formData.password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && formData.password !== confirmPassword;

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirm = "Please confirm your password";
    } else if (formData.password !== confirmPassword) {
      newErrors.confirm = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    router.push("/auth/register/steptwo");
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenShell
        step={1}
        totalSteps={formData.type === "personal" ? 3 : 4}
        title="Create your account"
        subtitle={
          formData.type
            ? `Setting up your ${typeLabels[formData.type] ?? "account"}`
            : "Let's get you started"
        }
      >
        <InputField
          label="Email address"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={formData.email}
          onChangeText={(text) => {
            updateField("email", text);
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
          }}
          error={errors.email}
        />

        {/* Password row — full width, ring sits outside */}
        <View style={{ marginBottom: 4 }}>
          <View
            style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}
          >
            {/* InputField takes full remaining width */}
            <View style={{ flex: 1 }}>
              <InputField
                label="Password"
                placeholder="Minimum 8 characters"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => {
                  updateField("password", text);
                  if (errors.password)
                    setErrors((e) => ({ ...e, password: undefined }));
                }}
                error={errors.password}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    // hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={18}
                      color="#999"
                    />
                  </TouchableOpacity>
                }
              />
            </View>
          </View>

          <StrengthBars score={strengthScore} />

          {formData.password.length > 0 && (
            <Text
              style={{
                fontSize: 11,
                color: STRENGTH_COLORS[strengthScore],
                marginTop: 4,
              }}
            >
              {STRENGTH_LABELS[strengthScore]}
            </Text>
          )}
        </View>

        {/* Confirm password — same full width as password (no ring beside it) */}
        <View>
          <InputField
            label="Confirm password"
            placeholder="Re-enter your password"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirm)
                setErrors((e) => ({ ...e, confirm: undefined }));
            }}
            error={errors.confirm}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={18}
                  color="#999"
                />
              </TouchableOpacity>
            }
          />

          {passwordsMatch && (
            <Text
              style={{
                fontSize: 11,
                color: "#1D9E75",
                marginTop: -10,
                marginBottom: 8,
              }}
            >
              ✓ Passwords match
            </Text>
          )}
          {passwordsMismatch && !errors.confirm && (
            <Text
              style={{
                fontSize: 11,
                color: "#E24B4A",
                marginTop: -10,
                marginBottom: 8,
              }}
            >
              Passwords do not match
            </Text>
          )}
        </View>

        <PrimaryButton label="Continue" onPress={handleContinue} />
      </ScreenShell>
    </ScrollView>
  );
}
