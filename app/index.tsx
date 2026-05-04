/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function Splash() {
  const [phase, setPhase] = useState(0);

  // Core animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(18)).current;

  const tagOpacity = useRef(new Animated.Value(0)).current;
  const tagTranslate = useRef(new Animated.Value(12)).current;

  const dividerScale = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;

  // Rings
  const ring1Scale = useRef(new Animated.Value(0.1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.9)).current;
  const ring2Scale = useRef(new Animated.Value(0.1)).current;
  const ring2Opacity = useRef(new Animated.Value(0.8)).current;
  const ring3Scale = useRef(new Animated.Value(0.1)).current;
  const ring3Opacity = useRef(new Animated.Value(0.7)).current;

  // Idle pulse rings
  const pulseRing1 = useRef(new Animated.Value(1)).current;
  const pulseRing2 = useRef(new Animated.Value(1)).current;

  // Loading dots
  const dot1 = useRef(new Animated.Value(0.2)).current;
  const dot2 = useRef(new Animated.Value(0.2)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  const startFloatLoop = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const startGlowLoop = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const startPulseRings = () => {
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1.08,
                duration: 1500,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(anim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]),
      ).start();
    pulse(pulseRing1, 0);
    pulse(pulseRing2, 500);
  };

  const startDotsLoop = () => {
    const dot = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(800),
        ]),
      ).start();
    dot(dot1, 0);
    dot(dot2, 200);
    dot(dot3, 400);
  };

  useEffect(() => {
    // Phase 1 – rings burst
    setTimeout(() => {
      setPhase(1);
      Animated.stagger(150, [
        Animated.parallel([
          Animated.timing(ring1Scale, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ring1Opacity, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ring2Scale, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ring2Opacity, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ring3Scale, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ring3Opacity, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, 200);

    // Phase 2 – logo in
    setTimeout(() => {
      setPhase(2);
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start(() => {
        startFloatLoop();
        startGlowLoop();
        startPulseRings();
      });
    }, 700);

    // Phase 3 – brand text
    setTimeout(() => {
      setPhase(3);
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dividerScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1300);

    // Phase 4 – tagline + loader
    setTimeout(() => {
      setPhase(4);
      Animated.parallel([
        Animated.timing(tagOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(tagTranslate, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(loaderOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => startDotsLoop());
    }, 1900);

    const timeout = setTimeout(() => {
      router.replace("/auth/onboarding");
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  const ringSize = width * 0.85;

  return (
    <LinearGradient
      colors={["#020b1a", "#071428", "#0d2550"]}
      locations={[0, 0.5, 1]}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={styles.container}
    >
      {/* Star dots */}
      {[...Array(22)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.star,
            {
              width: i % 5 === 0 ? 2 : 1,
              height: i % 5 === 0 ? 2 : 1,
              opacity: 0.1 + (i % 5) * 0.07,
              top: `${(i * 41 + 7) % 100}%` as any,
              left: `${(i * 67 + 13) % 100}%` as any,
            },
          ]}
        />
      ))}

      {/* Burst rings */}
      {(
        [
          [ring1Scale, ring1Opacity, ringSize * 0.55],
          [ring2Scale, ring2Opacity, ringSize * 0.75],
          [ring3Scale, ring3Opacity, ringSize],
        ] as [Animated.Value, Animated.Value, number][]
      ).map(([sc, op, sz], i) => (
        <Animated.View
          key={i}
          style={[
            styles.ring,
            {
              width: sz,
              height: sz,
              borderRadius: sz / 2,
              borderColor: "rgba(56,145,255,0.6)",
              opacity: op,
              transform: [{ scale: sc }],
            },
          ]}
        />
      ))}

      {/* Idle pulse rings */}
      {phase >= 2 &&
        (
          [
            [pulseRing1, width * 0.55, "rgba(56,145,255,0.12)"],
            [pulseRing2, width * 0.72, "rgba(56,145,255,0.07)"],
          ] as [Animated.Value, number, string][]
        ).map(([sc, sz, bc], i) => (
          <Animated.View
            key={`idle-${i}`}
            style={[
              styles.ring,
              {
                width: sz,
                height: sz,
                borderRadius: sz / 2,
                borderColor: bc,
                transform: [{ scale: sc }],
              },
            ]}
          />
        ))}

      {/* Ambient bottom glow */}
      <LinearGradient
        colors={["transparent", "rgba(10,50,180,0.12)"]}
        style={styles.bottomGlow}
        pointerEvents="none"
      />

      {/* ── Main content ── */}
      <View style={styles.content}>
        {/* Logo card */}
        <Animated.View
          style={[
            styles.logoCard,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { translateY: logoFloat }],
            },
          ]}
        >
          {/* Inner top glass sheen */}
          <LinearGradient
            colors={["rgba(255,255,255,0.09)", "transparent"]}
            style={styles.logoSheen}
            pointerEvents="none"
          />

          {/* Glow layer behind card */}
          <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />

          {/* ← Replace with your actual Image ↓ */}
          <Image
            source={require("../assets/images/PatchPayLogo2-removebg-preview.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand name */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslate }],
            alignItems: "center",
            marginTop: 32,
          }}
        >
          <Text style={styles.brandName}>
            <Text style={styles.brandWhite}>Patch</Text>
            <Text style={styles.brandBlue}>Pay</Text>
          </Text>
        </Animated.View>

        {/* Divider */}
        <Animated.View
          style={[styles.dividerRow, { transform: [{ scaleX: dividerScale }] }]}
        >
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={[styles.dividerLine, { transform: [{ scaleX: -1 }] }]} />
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={{
            opacity: tagOpacity,
            transform: [{ translateY: tagTranslate }],
          }}
        >
          <Text style={styles.tagline}>SECURE · FAST · RELIABLE</Text>
        </Animated.View>
      </View>

      {/* Loading indicator */}
      <Animated.View style={[styles.loaderWrapper, { opacity: loaderOpacity }]}>
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
          ))}
        </View>
        <Text style={styles.loaderLabel}>INITIALIZING</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  star: {
    position: "absolute",
    borderRadius: 99,
    backgroundColor: "#a0c8ff",
  },
  ring: {
    position: "absolute",
    borderWidth: 1,
    alignSelf: "center",
  },
  bottomGlow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
  },
  content: {
    alignItems: "center",
    zIndex: 10,
  },
  logoCard: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: "rgba(10,40,120,0.55)",
    borderWidth: 1,
    borderColor: "rgba(80,160,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#1a6ecc",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 16,
  },
  logoSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  logoGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(40,120,255,0.25)",
    alignSelf: "center",
  },
  logoImage: {
    width: 68,
    height: 68,
    zIndex: 2,
  },
  brandName: {
    fontSize: 50,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 56,
  },
  brandWhite: {
    color: "#e8f4ff",
  },
  brandBlue: {
    color: "#5ab4ff",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  dividerLine: {
    width: 44,
    height: 1,
    backgroundColor: "rgba(80,160,255,0.4)",
  },
  dividerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(100,180,255,0.8)",
    shadowColor: "#4db8ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  tagline: {
    color: "rgba(140,195,255,0.55)",
    fontSize: 11,
    letterSpacing: 3.5,
    fontWeight: "400",
    textTransform: "uppercase",
  },
  loaderWrapper: {
    position: "absolute",
    bottom: 56,
    alignItems: "center",
    gap: 10,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },
  dot: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: "rgba(80,160,255,0.8)",
  },
  loaderLabel: {
    color: "rgba(100,150,220,0.4)",
    fontSize: 9,
    letterSpacing: 3,
    fontWeight: "500",
    marginTop: 6,
  },
});
