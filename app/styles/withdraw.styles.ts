import { Platform, StyleSheet } from "react-native";

export const withdrawStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f2f4f8",
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    paddingTop: Platform.OS === "ios" ? 56 : 44,
    paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },

  // ── Balance pill ──────────────────────────────────────────────────────────
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: "#eef2ff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 20,
  },
  balancePillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6a3de8",
  },

  // ── Amount input ──────────────────────────────────────────────────────────
  amountSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    gap: 4,
  },
  amountCurrency: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1e2d8f",
    marginTop: 4,
  },
  amountInput: {
    fontSize: 44,
    fontWeight: "800",
    color: "#0f1923",
    letterSpacing: -1,
    minWidth: 120,
    textAlign: "center",
  },
  errorText: {
    textAlign: "center",
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },

  // ── Quick-amount chips ────────────────────────────────────────────────────
  chipsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  // ── White card ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  fieldInput: {
    fontSize: 15,
    color: "#0f1923",
    fontWeight: "500",
    paddingVertical: 4,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 16,
  },

  // ── Bank selector ─────────────────────────────────────────────────────────
  bankSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bankSelectorPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: "#cbd5e1",
    fontWeight: "500",
  },
  bankSelectorValue: {
    flex: 1,
    fontSize: 15,
    color: "#0f1923",
    fontWeight: "600",
  },
  bankIconCircleSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  bankIconTextSmall: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6a3de8",
  },

  // ── Resolved / error badges ───────────────────────────────────────────────
  resolvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  resolvedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16a34a",
  },
  resolveErrorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    backgroundColor: "#fff1f1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  resolveErrorText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ef4444",
  },

  // ── CTA button ────────────────────────────────────────────────────────────
  ctaButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#2541c4",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  // ── Ghost button ──────────────────────────────────────────────────────────
  ghostButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  ghostButtonText: {
    color: "#6a3de8",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Summary card ──────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f1923",
    maxWidth: "55%",
    textAlign: "right",
  },
  summaryValueAccent: {
    color: "#6a3de8",
    fontSize: 15,
  },
  summaryValueMono: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 11,
  },

  // ── Warning box ───────────────────────────────────────────────────────────
  warningBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#fff8ec",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#92400e",
    lineHeight: 18,
    fontWeight: "500",
  },

  // ── PIN input ─────────────────────────────────────────────────────────────
  pinCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#eef2ff",
  },
  pinInput: {
    fontSize: 18,
    color: "#0f1923",
    fontWeight: "700",
    letterSpacing: 4,
    paddingVertical: 6,
  },

  // ── Centered state screens ────────────────────────────────────────────────
  centeredState: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  processingRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  resultCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f1923",
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: "center",
  },
  stateSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
    paddingHorizontal: 10,
  },

  // ── Bank modal ────────────────────────────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 20 : 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f1923",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f1923",
    fontWeight: "500",
  },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  bankItemSelected: {
    backgroundColor: "#f5f3ff",
  },
  bankIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  bankIconText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6a3de8",
  },
  bankItemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#0f1923",
  },
  separator: {
    height: 1,
    backgroundColor: "#f8fafc",
    marginLeft: 68,
  },

  // ── Confirm step ──────────────────────────────────────────────────────────
  confirmIconWrap: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  confirmIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f1923",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  confirmSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 24,
  },
});
