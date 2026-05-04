/* eslint-disable react-hooks/exhaustive-deps */
import {
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  // Dimensions,
  Animated,
  Easing,
} from "react-native";
// import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";

// const { width, height } = Dimensions.get("window");

const slides = [
  {
    icon: "💸",
    title: "Instant Transfers",
    subtitle:
      "Send and receive money in seconds — no delays, no stress. PatchPay moves at the speed of your life.",
    accent: "#3B82F6",
    illustration: "transfer",
  },
  {
    icon: "🔒",
    title: "Bank-Level Security",
    subtitle:
      "Your funds are protected with end-to-end encryption and multi-factor authentication. Always safe.",
    accent: "#0EA5E9",
    illustration: "security",
  },
  {
    icon: "🌍",
    title: "Pay Anyone, Anywhere",
    subtitle:
      "Local or international, PatchPay connects you to the world with zero hidden fees and full transparency.",
    accent: "#6366F1",
    illustration: "global",
  },
];

const AUTO_SLIDE_DURATION = 3500;

// --- Illustrations ---

function TransferIllustration({ pulse }: { pulse: Animated.Value }) {
  const arrowSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowSlide, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(arrowSlide, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const arrowX = arrowSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 8],
  });
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  return (
    <View
      style={{
        width: 220,
        height: 180,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Glow */}
      <Animated.View
        style={{
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: "#3B82F6",
          opacity: 0.12,
          transform: [{ scale: pulseScale }],
        }}
      />

      {/* Cards */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        {/* Sender card */}
        <View
          style={{
            width: 70,
            height: 80,
            borderRadius: 16,
            backgroundColor: "#1E3A5F",
            borderWidth: 1.5,
            borderColor: "#3B82F6AA",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "#3B82F655",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 14 }}>👤</Text>
          </View>
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#3B82F6AA",
            }}
          />
          <View
            style={{
              width: 24,
              height: 3,
              borderRadius: 2,
              backgroundColor: "#334155",
            }}
          />
        </View>

        {/* Animated arrow */}
        <Animated.View
          style={{
            transform: [{ translateX: arrowX }],
            alignItems: "center",
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 22, color: "#3B82F6" }}>→</Text>
          <View
            style={{
              width: 30,
              height: 14,
              borderRadius: 7,
              backgroundColor: "#3B82F622",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 8, color: "#3B82F6", fontWeight: "700" }}>
              $$$
            </Text>
          </View>
        </Animated.View>

        {/* Receiver card */}
        <View
          style={{
            width: 70,
            height: 80,
            borderRadius: 16,
            backgroundColor: "#1E3A5F",
            borderWidth: 1.5,
            borderColor: "#3B82F6AA",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "#3B82F655",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 14 }}>👤</Text>
          </View>
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#3B82F6AA",
            }}
          />
          <View
            style={{
              width: 24,
              height: 3,
              borderRadius: 2,
              backgroundColor: "#334155",
            }}
          />
        </View>
      </View>

      {/* Success ping */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 10,
          right: 20,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#22C55E",
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale: pulseScale }],
          shadowColor: "#22C55E",
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Text style={{ fontSize: 12 }}>✓</Text>
      </Animated.View>
    </View>
  );
}

function SecurityIllustration({ pulse }: { pulse: Animated.Value }) {
  const ringScale = useRef(new Animated.Value(1)).current;
  const shieldBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, {
          toValue: 1.25,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shieldBounce, {
          toValue: -6,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shieldBounce, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View
      style={{
        width: 220,
        height: 180,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Pulsing rings */}
      <Animated.View
        style={{
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: 80,
          borderWidth: 1.5,
          borderColor: "#0EA5E944",
          transform: [{ scale: ringScale }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          borderRadius: 60,
          borderWidth: 1.5,
          borderColor: "#0EA5E966",
          transform: [{ scale: ringScale }],
        }}
      />

      {/* Shield */}
      <Animated.View
        style={{
          transform: [{ translateY: shieldBounce }],
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 80,
            height: 90,
            backgroundColor: "#0C2340",
            borderWidth: 2,
            borderColor: "#0EA5E9",
            borderRadius: 40,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#0EA5E9",
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <Text style={{ fontSize: 32 }}>🔒</Text>
        </View>
      </Animated.View>

      {/* Lock dots */}
      {[...Array(3)].map((_, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            bottom: 20,
            left: 40 + i * 50,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#0EA5E9",
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

function GlobalIllustration({ pulse }: { pulse: Animated.Value }) {
  const rotate = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -8,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const dots = [
    { top: 20, left: 30 },
    { top: 50, right: 25 },
    { bottom: 30, left: 50 },
    { top: 30, right: 50 },
    { bottom: 40, right: 30 },
  ];

  return (
    <View
      style={{
        width: 220,
        height: 180,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Orbit ring */}
      <Animated.View
        style={{
          position: "absolute",
          width: 170,
          height: 170,
          borderRadius: 85,
          borderWidth: 1,
          borderColor: "#6366F133",
          borderStyle: "dashed",
          transform: [{ rotate: spin }],
        }}
      />

      {/* Globe */}
      <Animated.View
        style={{
          transform: [{ translateY: float }],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: "#1A1060",
            borderWidth: 2.5,
            borderColor: "#6366F1",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#6366F1",
            shadowOpacity: 0.6,
            shadowRadius: 20,
            elevation: 12,
          }}
        >
          <Text style={{ fontSize: 40 }}>🌍</Text>
        </View>
      </Animated.View>

      {/* Connection dots */}
      {dots.map((pos, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            ...pos,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#6366F1",
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 1],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1.3],
                }),
              },
            ],
            shadowColor: "#6366F1",
            shadowOpacity: 0.8,
            shadowRadius: 4,
          }}
        />
      ))}
    </View>
  );
}

// --- Main Screen ---

export default function Index() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const blobAnim = useRef(new Animated.Value(0)).current;

  // Pulse loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // Blob float
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(blobAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // Auto-slide with progress
  useEffect(() => {
    progressAnim.setValue(0);
    const progressTimer = Animated.timing(progressAnim, {
      toValue: 1,
      duration: AUTO_SLIDE_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    progressTimer.start();

    const timer = setTimeout(() => {
      const next = (current + 1) % slides.length;
      // Fade + slide out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrent(next);
        slideAnim.setValue(30);
        // Fade + slide in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.back(1.4)),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, AUTO_SLIDE_DURATION);

    return () => {
      clearTimeout(timer);
      progressTimer.stop();
    };
  }, [current]);

  const slide = slides[current];
  const blobY = blobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#060E1E" />
      <View style={{ flex: 1, backgroundColor: "#060E1E" }}>
        {/* Animated background blobs */}
        <Animated.View
          style={{
            position: "absolute",
            top: -100,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: 160,
            backgroundColor: "#1D4ED8",
            opacity: 0.2,
            transform: [{ translateY: blobY }],
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            top: 100,
            right: -100,
            width: 260,
            height: 260,
            borderRadius: 130,
            backgroundColor: "#0EA5E9",
            opacity: 0.12,
            transform: [{ translateY: blobY }],
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            bottom: -60,
            left: 40,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "#6366F1",
            opacity: 0.1,
          }}
        />

        {/* Header */}
        <View style={{ paddingTop: 64, alignItems: "center" }}>
          <View
            style={{
              backgroundColor: "#1E3A5F",
              borderWidth: 1,
              borderColor: "#3B82F655",
              borderRadius: 999,
              paddingHorizontal: 20,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                color: "#93C5FD",
                fontSize: 11,
                letterSpacing: 3,
                textTransform: "uppercase",
                fontWeight: "700",
              }}
            >
              PatchPay
            </Text>
          </View>
        </View>

        {/* Illustration area */}
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              alignItems: "center",
            }}
          >
            {slide.illustration === "transfer" && (
              <TransferIllustration pulse={pulseAnim} />
            )}
            {slide.illustration === "security" && (
              <SecurityIllustration pulse={pulseAnim} />
            )}
            {slide.illustration === "global" && (
              <GlobalIllustration pulse={pulseAnim} />
            )}
          </Animated.View>
        </View>

        {/* Text content */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingHorizontal: 32,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 30,
              fontWeight: "800",
              textAlign: "center",
              letterSpacing: -0.5,
              marginBottom: 12,
            }}
          >
            {slide.title}
          </Text>
          <Text
            style={{
              color: "#94A3B8",
              fontSize: 15,
              textAlign: "center",
              lineHeight: 24,
              paddingHorizontal: 8,
            }}
          >
            {slide.subtitle}
          </Text>
        </Animated.View>

        {/* Bottom */}
        <View style={{ paddingHorizontal: 32, paddingBottom: 52 }}>
          {/* Progress dots with live fill */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              marginBottom: 36,
            }}
          >
            {slides.map((_, i) => (
              <View
                key={i}
                style={{
                  height: 5,
                  width: i === current ? 36 : 8,
                  borderRadius: 3,
                  backgroundColor: "#1E293B",
                  overflow: "hidden",
                }}
              >
                {i === current && (
                  <Animated.View
                    style={{
                      height: "100%",
                      borderRadius: 3,
                      backgroundColor: slide.accent,
                      width: progressWidth,
                    }}
                  />
                )}
                {i < current && (
                  <View
                    style={{
                      height: "100%",
                      borderRadius: 3,
                      backgroundColor: "#475569",
                      width: "100%",
                    }}
                  />
                )}
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={() => router.push("/auth/selectuser")}
            style={{
              backgroundColor: "#2563EB",
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: "center",
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.45,
              shadowRadius: 20,
              elevation: 10,
            }}
            activeOpacity={0.85}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "700",
                letterSpacing: 0.5,
              }}
            >
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            style={{ marginTop: 16, alignItems: "center" }}
            activeOpacity={0.6}
          >
            <Text style={{ color: "#475569", fontSize: 14 }}>
              Already have an account?{" "}
              <Text style={{ color: "#93C5FD", fontWeight: "600" }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
