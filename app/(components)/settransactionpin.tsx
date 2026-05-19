/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  Alert,
  Vibration,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { setTransactionPin } from "@/api/walletapi";

const PIN_LENGTH = 4;

export default function SetTransactionPinScreen() {
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [createPin, setCreatePin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Animated values for each dot
  const dotScales = useRef(
    Array.from({ length: PIN_LENGTH }, () => new Animated.Value(1)),
  ).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const currentPin = step === "create" ? createPin : confirmPin;
  const setCurrentPin = step === "create" ? setCreatePin : setConfirmPin;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate dot when filled
  const animateDot = (index: number) => {
    Animated.sequence([
      Animated.spring(dotScales[index], {
        toValue: 1.35,
        speed: 50,
        bounciness: 12,
        useNativeDriver: true,
      }),
      Animated.spring(dotScales[index], {
        toValue: 1,
        speed: 50,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Shake animation on mismatch
  const triggerShake = () => {
    Vibration.vibrate(400);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDigit = (digit: string) => {
    if (currentPin.length >= PIN_LENGTH) return;
    setError("");
    const next = currentPin + digit;
    setCurrentPin(next);
    animateDot(next.length - 1);

    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        if (step === "create") {
          setStep("confirm");
        } else {
          handleSubmit(next);
        }
      }, 200);
    }
  };

  const handleDelete = () => {
    if (currentPin.length === 0) return;
    setCurrentPin(currentPin.slice(0, -1));
    setError("");
  };

  const handleSubmit = async (finalPin: string) => {
    if (createPin !== finalPin) {
      triggerShake();
      setError("PINs don't match. Let's start over.");
      setTimeout(() => {
        setCreatePin("");
        setConfirmPin("");
        setStep("create");
        setError("");
      }, 1500);
      return;
    }
    try {
      setLoading(true);
      await setTransactionPin(createPin, finalPin);
      Alert.alert(
        "PIN Created",
        "Your transaction PIN has been set successfully.",
        [{ text: "Done", onPress: () => router.back() }],
      );
    } catch (e) {
      triggerShake();
      setError("Something went wrong. Please try again.");
      setCreatePin("");
      setConfirmPin("");
      setStep("create");
    } finally {
      setLoading(false);
    }
  };

  const NUMPAD = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "del"],
  ];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Blue gradient header ─────────────────────────── */}
      <LinearGradient
        colors={["#0a2fa8", "#1a56db", "#3b82f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Subtle circle decorations */}
        <View style={styles.circleTopRight} />
        <View style={styles.circleBottomLeft} />
        <View style={styles.circleMid} />

        {/* Back */}
        <TouchableOpacity
          onPress={() =>
            step === "confirm"
              ? (setStep("create"), setConfirmPin(""))
              : router.back()
          }
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Shield icon */}
        <View style={styles.iconWrap}>
          <Feather name="shield" size={26} color="#fff" />
        </View>

        <Text style={styles.headerTitle}>
          {step === "create" ? "Create Transaction PIN" : "Confirm Your PIN"}
        </Text>
        <Text style={styles.headerSub}>
          {step === "create"
            ? "Set a 4-digit PIN to authorise payments"
            : "Re-enter your PIN to confirm it"}
        </Text>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View
            style={[
              styles.stepLine,
              step === "confirm" && styles.stepLineActive,
            ]}
          />
          <View
            style={[styles.stepDot, step === "confirm" && styles.stepDotActive]}
          />
        </View>
        <View style={styles.stepLabels}>
          <Text style={styles.stepLabelText}>Create</Text>
          <Text style={styles.stepLabelText}>Confirm</Text>
        </View>
      </LinearGradient>

      {/* ── Body ─────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.body,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* PIN dots */}
        <Animated.View
          style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < currentPin.length;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  filled && styles.dotFilled,
                  { transform: [{ scale: dotScales[i] }] },
                ]}
              >
                {filled && <View style={styles.dotInner} />}
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Error message */}
        {!!error && (
          <View style={styles.errorBox}>
            <Feather
              name="alert-circle"
              size={13}
              color="#dc2626"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Numpad */}
        <View style={styles.numpad}>
          {NUMPAD.map((row, r) => (
            <View key={r} style={styles.numRow}>
              {row.map((key, c) => {
                if (key === "") return <View key={c} style={styles.keyEmpty} />;

                if (key === "del") {
                  return (
                    <TouchableOpacity
                      key={c}
                      style={styles.keyDel}
                      onPress={handleDelete}
                      activeOpacity={0.65}
                    >
                      <Feather name="delete" size={20} color="#1a56db" />
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={c}
                    style={styles.key}
                    onPress={() => handleDigit(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.keyText}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Security note */}
        <View style={styles.securityNote}>
          <View style={styles.securityIconWrap}>
            <Feather name="lock" size={13} color="#1a56db" />
          </View>
          <Text style={styles.securityText}>
            Your PIN is encrypted end-to-end. PatchPay staff will never ask for
            it.
          </Text>
        </View>

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingRow}>
            <Text style={styles.loadingText}>Saving your PIN…</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f6ff",
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    position: "relative",
    overflow: "hidden",
  },
  circleTopRight: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  circleBottomLeft: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  circleMid: {
    position: "absolute",
    top: 40,
    right: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "transparent",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 5,
  },
  headerSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 22,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  stepDotActive: {
    backgroundColor: "#fff",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: "#fff",
  },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  stepLabelText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // ── Body ─────────────────────────────────────────────────
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
    alignItems: "center",
  },

  // ── Dots ─────────────────────────────────────────────────
  dotsRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 28,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#93c5fd",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  dotFilled: {
    borderColor: "#1a56db",
    backgroundColor: "#1a56db",
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },

  // ── Error ─────────────────────────────────────────────────
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    alignSelf: "stretch",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },

  // ── Numpad ───────────────────────────────────────────────
  numpad: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  numRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  key: {
    width: 80,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    // iOS shadow
    shadowColor: "#1a56db",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    // Android
    elevation: 2,
  },
  keyText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  keyDel: {
    width: 80,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  keyEmpty: {
    width: 80,
    height: 72,
  },

  // ── Security note ────────────────────────────────────────
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  securityIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: "#1e40af",
    lineHeight: 16,
  },

  // ── Loading ──────────────────────────────────────────────
  loadingRow: {
    marginTop: 18,
    alignItems: "center",
  },
  loadingText: {
    color: "#1a56db",
    fontSize: 13,
    fontWeight: "500",
  },
});
