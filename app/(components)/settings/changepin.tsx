import { changeTransactionPin } from "@/api/walletapi";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import SettingsHeader from "./components/settingsheader";

type Step = "current" | "new" | "confirm";

const PIN_LENGTH = 4;

const PinDots = ({ length, filled }: { length: number; filled: number }) => (
  <View className="flex-row justify-center gap-3 my-6">
    {Array.from({ length }).map((_, i) => (
      <View
        key={i}
        className={`w-4 h-4 rounded-full ${
          i < filled ? "bg-brand" : "bg-slate-200"
        }`}
      />
    ))}
  </View>
);

const Keypad = ({
  onPress,
  onDelete,
  disabled = false,
}: {
  onPress: (digit: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}) => {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <View className="flex-row flex-wrap">
      {keys.map((key, i) => {
        if (key === "") {
          return <View key={i} className="w-1/3 h-16" />;
        }

        return (
          <TouchableOpacity
            key={i}
            disabled={disabled}
            onPress={() => (key === "del" ? onDelete() : onPress(key))}
            className="w-1/3 h-16 items-center justify-center"
          >
            {key === "del" ? (
              <Feather
                name="delete"
                size={24}
                color={disabled ? "#cbd5e1" : "#334155"}
              />
            ) : (
              <Text className="text-slate-800 text-xl font-medium">{key}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function ChangePinScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("current");

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const stepConfig: Record<
    Step,
    {
      title: string;
      value: string;
      set: (value: string) => void;
    }
  > = {
    current: {
      title: "Enter your current PIN",
      value: currentPin,
      set: setCurrentPin,
    },

    new: {
      title: "Enter a new PIN",
      value: newPin,
      set: setNewPin,
    },

    confirm: {
      title: "Confirm your new PIN",
      value: confirmPin,
      set: setConfirmPin,
    },
  };

  const { title, value, set } = stepConfig[step];

  const handleDigit = async (digit: string) => {
    if (value.length >= PIN_LENGTH || saving) {
      return;
    }

    const next = value + digit;

    set(next);
    setError("");

    // Wait until 4 digits have been entered
    if (next.length !== PIN_LENGTH) {
      return;
    }

    // ─────────────────────────────────────────
    // STEP 1: Current PIN
    // ─────────────────────────────────────────

    if (step === "current") {
      setTimeout(() => {
        setStep("new");
      }, 150);

      return;
    }

    // ─────────────────────────────────────────
    // STEP 2: New PIN
    // ─────────────────────────────────────────

    if (step === "new") {
      // Don't allow the same PIN
      if (next === currentPin) {
        setError("Your new PIN must be different from your current PIN.");

        setTimeout(() => {
          setNewPin("");
        }, 400);

        return;
      }

      setTimeout(() => {
        setStep("confirm");
      }, 150);

      return;
    }

    // ─────────────────────────────────────────
    // STEP 3: Confirm PIN
    // ─────────────────────────────────────────

    if (step === "confirm") {
      if (next !== newPin) {
        setError("PINs don't match. Try again.");

        setTimeout(() => {
          setConfirmPin("");
        }, 400);

        return;
      }

      try {
        setSaving(true);
        setError("");

        // Send all three PINs to backend
        await changeTransactionPin(currentPin, newPin, confirmPin);

        // Successfully changed
        router.back();
      } catch (error: any) {
        console.log("❌ Change PIN error:", error?.response?.data || error);

        const message =
          error?.response?.data?.message || "Unable to change transaction PIN.";

        setError(message);

        // If current PIN was wrong, go back to current PIN
        if (
          message.toLowerCase().includes("current") &&
          message.toLowerCase().includes("incorrect")
        ) {
          setCurrentPin("");

          setTimeout(() => {
            setStep("current");
          }, 400);
        } else {
          setConfirmPin("");
        }
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDelete = () => {
    if (saving) return;

    set(value.slice(0, -1));
    setError("");
  };

  return (
    <View className="flex-1 bg-white">
      <SettingsHeader title="Change Transaction Pin" />

      <View className="flex-1 -mt-3 px-5">
        <Text className="text-slate-800 text-base font-bold text-center mt-8">
          {saving ? "Updating your PIN..." : title}
        </Text>

        <Text className="text-slate-400 text-xs text-center mt-1">
          {PIN_LENGTH}-digit PIN
        </Text>

        <PinDots length={PIN_LENGTH} filled={value.length} />

        {error ? (
          <Text className="text-red-500 text-xs text-center mb-4 px-4">
            {error}
          </Text>
        ) : null}

        <View className="flex-1 justify-end pb-8">
          <Keypad
            onPress={handleDigit}
            onDelete={handleDelete}
            disabled={saving}
          />
        </View>
      </View>
    </View>
  );
}
