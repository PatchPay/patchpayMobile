import { router, useLocalSearchParams } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle,
  FileText,
  Lock,
  PackageCheck,
  ShieldCheck,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

import {
  confirmEscrowReceipt,
  disputeEscrow,
  getDeliveryProofUrl,
  getEscrowById,
  markEscrowDelivered,
  normalizeDeliveryProofImage,
} from "@/api/escrowapi";

import { useAuth } from "@/hooks/useAuth";

import {
  formatDate,
  formatMoney,
  getCounterpartyName,
  getId,
  getRole,
  Row,
} from "./escrowshared";

const EscrowDetailsScreen = () => {
  const { user } = useAuth();

  const params = useLocalSearchParams<{ id: string | string[] }>();

  const escrowId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [escrow, setEscrow] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Buyer confirmation (now requires a photo of the received item)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);

  const [confirmationImage, setConfirmationImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Buyer dispute
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputing, setDisputing] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  // Seller delivery
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [delivering, setDelivering] = useState(false);

  const [proofImage, setProofImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const [deliverError, setDeliverError] = useState<string | null>(null);

  /**
   * Load escrow from backend
   */
  const loadEscrow = useCallback(
    async (showLoader = true) => {
      if (!escrowId) return;

      try {
        if (showLoader) {
          setLoading(true);
        }

        const result = await getEscrowById(escrowId);

        setEscrow(result);
      } catch (error: any) {
        console.log("GET ESCROW ERROR:", {
          message: error?.message,
          status: error?.response?.status,
          response: error?.response?.data,
        });

        if (error?.response?.status === 404) {
          setEscrow(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [escrowId],
  );

  useEffect(() => {
    loadEscrow();
  }, [loadEscrow]);

  /**
   * Pull-to-refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEscrow(false);
  };

  /**
   * BUYER (recipient):
   * Take a photo of the item as received. This is the proof that gets
   * uploaded alongside the confirm-receipt request.
   *
   * Backend: multer field name must match deliveryUploadMiddleware's
   * uploadBuyerConfirmationProof config — verify against that file.
   */
  const handleTakeConfirmationPhoto = async () => {
    setConfirmError(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setConfirmError(
        "Camera permission is required to take a confirmation photo.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];

    try {
      const normalized = normalizeDeliveryProofImage({
        uri: asset.uri,
        name: asset.fileName || undefined,
        type: asset.mimeType || undefined,
      });

      setConfirmationImage(normalized);
      setConfirmError(null);
    } catch (error: any) {
      setConfirmError(
        error?.message || "Please retake the photo (JPG, PNG, or WEBP).",
      );
    }
  };

  /**
   * Close confirm-receipt modal
   */
  const closeConfirmModal = () => {
    if (confirmingReceipt) return;

    setShowConfirmModal(false);
    setConfirmationImage(null);
    setConfirmError(null);
  };

  /**
   * BUYER (recipient):
   * Confirm receipt by submitting a photo of what was received.
   *
   * Backend:
   * POST /escrow/:id/confirm-receipt (multipart, field: confirmation proof)
   *
   * This automatically releases the escrow funds.
   */
  const handleConfirmReceipt = async () => {
    if (!escrowId) return;

    if (!isRecipient) {
      setConfirmError("Only the buyer can confirm receipt.");
      return;
    }

    if (escrow?.status !== "DELIVERED") {
      setConfirmError(
        "Receipt can only be confirmed after the seller marks the escrow as delivered.",
      );
      return;
    }

    if (!confirmationImage?.uri) {
      setConfirmError("Please take a photo of the item you received first.");
      return;
    }

    setConfirmingReceipt(true);
    setConfirmError(null);

    try {
      const updatedEscrow = await confirmEscrowReceipt(
        escrowId,
        confirmationImage,
      );

      setShowConfirmModal(false);
      setConfirmationImage(null);

      // Immediately update UI with backend response
      if (updatedEscrow) {
        setEscrow(updatedEscrow);
      }

      // Then refresh to make sure everything is synchronized
      await loadEscrow(false);

      Alert.alert(
        "Receipt Confirmed",
        "Receipt has been confirmed and the escrow funds have been released to the seller.",
      );
    } catch (error: any) {
      console.log("CONFIRM RECEIPT ERROR:", {
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
      });

      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.message;

      if (status === 403) {
        setConfirmError("Only the buyer can confirm receipt for this escrow.");
      } else if (status === 400) {
        setConfirmError(
          backendMessage || "Receipt can only be confirmed after delivery.",
        );
      } else if (status === 404) {
        setConfirmError("This escrow could no longer be found.");
      } else if (status === 409) {
        setConfirmError(
          backendMessage || "Receipt has already been confirmed.",
        );
      } else if (status === 413) {
        setConfirmError("Confirmation photo must be 5MB or smaller.");
      } else if (status === 415) {
        setConfirmError(backendMessage || "This image type is not supported.");
      } else if (!error?.response || error?.code === "ERR_NETWORK") {
        setConfirmError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      } else {
        setConfirmError(backendMessage || "Failed to confirm receipt.");
      }
    } finally {
      setConfirmingReceipt(false);
    }
  };

  /**
   * BUYER (recipient):
   * Close dispute modal
   */
  const closeDisputeModal = () => {
    if (disputing) return;

    setShowDisputeModal(false);
    setDisputeReason("");
    setDisputeError(null);
  };

  /**
   * BUYER (recipient):
   * Submit a dispute with a reason.
   *
   * Backend:
   * POST /escrow/:id/dispute
   * body: { reason }
   *
   * Only valid while escrow is FUNDED or DELIVERED (see disputeEscrow controller).
   */
  const handleSubmitDispute = async () => {
    if (!escrowId) return;

    const trimmedReason = disputeReason.trim();

    if (!trimmedReason) {
      setDisputeError("Please tell us why you're disputing this order.");
      return;
    }

    if (!isRecipient) {
      setDisputeError("Only the buyer can dispute this escrow.");
      return;
    }

    if (escrow?.status !== "DELIVERED" && escrow?.status !== "FUNDED") {
      setDisputeError(
        "This escrow can no longer be disputed in its current state.",
      );
      return;
    }

    setDisputing(true);
    setDisputeError(null);

    try {
      const updatedEscrow = await disputeEscrow(escrowId, trimmedReason);

      if (updatedEscrow) {
        setEscrow(updatedEscrow);
      }

      setShowDisputeModal(false);
      setDisputeReason("");

      await loadEscrow(false);

      Alert.alert(
        "Dispute Submitted",
        "Your dispute has been submitted. Our team will review it and follow up with both parties.",
      );
    } catch (error: any) {
      console.log("DISPUTE ESCROW ERROR:", {
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
      });

      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.message;

      if (status === 403) {
        setDisputeError("Only the buyer can dispute this escrow.");
      } else if (status === 400) {
        setDisputeError(
          backendMessage ||
            "This escrow can no longer be disputed in its current state.",
        );
      } else if (status === 404) {
        setDisputeError("This escrow could no longer be found.");
      } else if (!error?.response || error?.code === "ERR_NETWORK") {
        setDisputeError(
          "Unable to connect to the server. Please check your connection and try again.",
        );
      } else {
        setDisputeError(backendMessage || "Failed to submit dispute.");
      }
    } finally {
      setDisputing(false);
    }
  };

  /**
   * SELLER (creator):
   * Pick delivery proof image
   */
  const handlePickProofImage = async () => {
    setDeliverError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setDeliverError(
        "Photo library permission is required to select delivery proof.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];

    if (!asset.uri || /^https?:\/\//i.test(asset.uri)) {
      setDeliverError("Please choose an image stored on this device.");
      return;
    }

    try {
      const normalized = normalizeDeliveryProofImage({
        uri: asset.uri,
        name: asset.fileName || undefined,
        type: asset.mimeType || undefined,
      });

      setProofImage(normalized);
      setDeliverError(null);
    } catch (error: any) {
      setDeliverError(
        error?.message || "Please choose a JPG, PNG, or WEBP image.",
      );
    }
  };

  /**
   * Close delivery modal
   */
  const closeDeliverModal = () => {
    if (delivering) return;

    setShowDeliverModal(false);
    setProofImage(null);
    setDeliverError(null);
  };

  /**
   * SELLER (creator):
   * Submit delivery proof
   */
  const handleMarkDelivered = async () => {
    if (!escrowId) return;

    if (!proofImage?.uri) {
      setDeliverError("Please choose a delivery-proof image first.");
      return;
    }

    if (!isCreator) {
      setDeliverError(
        "Only the seller can submit delivery proof for this escrow.",
      );
      return;
    }

    if (escrow?.status !== "FUNDED") {
      setDeliverError(
        "Delivery proof can only be submitted for a funded escrow.",
      );
      return;
    }

    if (__DEV__) {
      console.log("DELIVERY PROOF REQUEST", {
        escrowId,
        userId: user?.id,
        role,
        fieldName: "deliveryProof",
        uri: proofImage.uri,
        name: proofImage.name,
        type: proofImage.type,
      });
    }

    setDelivering(true);
    setDeliverError(null);

    try {
      const updatedEscrow = await markEscrowDelivered(escrowId, proofImage);

      if (updatedEscrow) {
        setEscrow(updatedEscrow);
      }

      setShowDeliverModal(false);
      setProofImage(null);

      await loadEscrow(false);

      Alert.alert(
        "Delivery Submitted",
        "Delivery proof has been submitted successfully. The buyer can now confirm receipt.",
      );
    } catch (error: any) {
      console.log("DELIVERY PROOF ERROR:", {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        response: error?.response?.data,
      });

      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.message;

      if (status === 400) {
        setDeliverError(
          backendMessage || "The delivery-proof image could not be submitted.",
        );
      } else if (status === 403) {
        setDeliverError(
          "You are not permitted to submit delivery proof for this escrow.",
        );
      } else if (status === 409) {
        setDeliverError(
          "Delivery proof has already been submitted for this escrow.",
        );
      } else if (status === 413) {
        setDeliverError("Delivery proof image must be 5MB or smaller.");
      } else if (status === 415) {
        setDeliverError(backendMessage || "This image type is not supported.");
      } else if (status === 500) {
        setDeliverError(
          "The server could not save delivery proof. Please try again.",
        );
      } else if (!error?.response || error?.code === "ERR_NETWORK") {
        setDeliverError(
          "Unable to connect to the server. Please check your connection and try again.",
        );
      } else {
        setDeliverError(backendMessage || "Failed to submit delivery proof.");
      }
    } finally {
      setDelivering(false);
    }
  };

  /**
   * Loading state
   */
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center">
        <ShieldCheck size={36} color="#9ca3af" />

        <Text className="text-gray-400 mt-3">Loading escrow…</Text>
      </SafeAreaView>
    );
  }

  /**
   * Escrow not found
   */
  if (!escrow) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center px-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-10 left-5 p-2"
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }}
        >
          <ArrowLeft size={22} color="#374151" />
        </TouchableOpacity>

        <ShieldCheck color="#9ca3af" size={36} />

        <Text className="text-gray-500 mt-3 text-center">
          We couldn&#39;t find that escrow transaction.
        </Text>
      </SafeAreaView>
    );
  }

  /**
   * Current user / role
   *
   * Backend contract (see escrowController.js):
   *   creatorId   = SELLER (the quote's user_data / the party who gets paid)
   *   recipientId = BUYER  (quote's destinatary_user / the party who pays & confirms receipt)
   */
  const creatorId = getId(escrow.creatorId);
  const recipientId = getId(escrow.recipientId);

  const currentUserId = user?.id;

  const isCreator =
    currentUserId !== undefined && String(creatorId) === String(currentUserId);

  const isRecipient =
    currentUserId !== undefined &&
    String(recipientId) === String(currentUserId);

  // isCreator  -> seller
  // isRecipient -> buyer

  const role = getRole(escrow, currentUserId);

  const counterpartyName = getCounterpartyName(escrow, role);

  /**
   * Escrow status helpers
   */

  const isFunded = escrow.status === "FUNDED";

  const isDelivered = escrow.status === "DELIVERED";

  const isReleased = escrow.status === "RELEASED";

  const isRefunded = escrow.status === "REFUNDED";

  const isDisputed = escrow.status === "DISPUTED";

  // Buyer can dispute once funds are secured, whether or not delivery has
  // happened yet — matches the backend's FUNDED || DELIVERED guard.
  const canDispute = isFunded || isDelivered;

  const deliveryProofUrl = getDeliveryProofUrl(escrow.deliveryProofUrl);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

        <View className="bg-brand px-5 pt-10 pb-8 rounded-b-lg">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 p-1 -ml-1"
              hitSlop={{
                top: 10,
                bottom: 10,
                left: 10,
                right: 10,
              }}
            >
              <ArrowLeft color="white" size={22} />
            </TouchableOpacity>

            <View className="bg-white/20 p-3 rounded-full">
              <ShieldCheck color="white" size={22} />
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-white text-lg font-semibold">
                {isRecipient ? "Your Escrow" : "Escrow Payment"}
              </Text>

              <Text className="text-white/60 text-xs">{escrow.escrowUprn}</Text>
            </View>

            {/* STATUS */}
            <View
              className={`px-3 py-1 rounded-full ${
                isFunded
                  ? "bg-green-600"
                  : isDelivered
                    ? "bg-blue-600"
                    : isReleased
                      ? "bg-emerald-700"
                      : isRefunded
                        ? "bg-purple-600"
                        : isDisputed
                          ? "bg-red-600"
                          : "bg-gray-500"
              }`}
            >
              <Text className="text-white text-xs font-semibold">
                {escrow.status}
              </Text>
            </View>
          </View>

          {/* AMOUNT */}
          <View className="mt-6">
            <Text className="text-white/60 text-xs uppercase">
              {isRecipient ? "Amount Secured" : "Amount to Receive"}
            </Text>

            <Text className="text-white text-3xl font-bold mt-1">
              {formatMoney(escrow.amount, escrow.currency)}
            </Text>
          </View>
        </View>

        <View className="p-5">
          {/* ================================================= */}
          {/* ORDER SUMMARY */}
          {/* ================================================= */}

          <View className="bg-surface-card rounded-md border border-surface-border p-5 shadow-card mb-4">
            <Text className="text-gray-400 text-xs uppercase mb-3">
              Order Summary
            </Text>

            <Row
              title="Description"
              value={escrow.description || "No description"}
            />

            <Row
              title={isRecipient ? "Seller" : "Buyer"}
              value={counterpartyName || "Unknown"}
            />

            <Row
              title="Amount"
              value={formatMoney(escrow.amount, escrow.currency)}
            />

            <Row title="Currency" value={escrow.currency} />

            <Row title="Expires" value={formatDate(escrow.expiryDate)} />

            <Row title="Status" value={escrow.status} />
          </View>

          {/* ================================================= */}
          {/* DISPUTED (either side) */}
          {/* ================================================= */}

          {isDisputed && (
            <View className="bg-red-50 rounded-2xl p-4 flex-row items-center mb-4">
              <View className="bg-red-600 p-3 rounded-full">
                <AlertTriangle size={20} color="white" />
              </View>

              <View className="ml-3 flex-1">
                <Text className="font-semibold text-red-700">
                  Escrow disputed
                </Text>

                <Text className="text-gray-600 text-xs mt-1">
                  {escrow.metadata?.disputeReason
                    ? `Reason: ${escrow.metadata.disputeReason}`
                    : "This escrow is under review. Our team will follow up with both parties."}
                </Text>
              </View>
            </View>
          )}

          {/* ================================================= */}
          {/* BUYER (recipient) INFORMATION */}
          {/* ================================================= */}

          {isRecipient && (
            <>
              {/* FUNDED */}
              {isFunded && (
                <View className="bg-green-50 rounded-2xl p-4 flex-row items-center mb-4">
                  <View className="bg-green-600 p-3 rounded-full">
                    <Lock size={20} color="white" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-green-700">
                      Payment secured
                    </Text>

                    <Text className="text-gray-600 text-xs mt-1">
                      Your payment is safely held in escrow until you confirm
                      receipt.
                    </Text>
                  </View>
                </View>
              )}

              {/* DELIVERED */}
              {isDelivered && (
                <View className="bg-blue-50 rounded-2xl p-4 flex-row items-center mb-4">
                  <View className="bg-blue-600 p-3 rounded-full">
                    <PackageCheck size={20} color="white" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-blue-700">
                      Seller marked the order delivered
                    </Text>

                    <Text className="text-gray-600 text-xs mt-1">
                      Review the delivery proof below. If everything checks out,
                      take a photo of the item to confirm receipt. If
                      something&#39;s wrong, you can dispute instead.
                    </Text>
                  </View>
                </View>
              )}

              {/* RELEASED */}
              {isReleased && (
                <View className="bg-emerald-50 rounded-2xl p-4 flex-row items-center mb-4">
                  <View className="bg-emerald-600 p-3 rounded-full">
                    <CheckCircle size={20} color="white" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-emerald-700">
                      Transaction completed
                    </Text>

                    <Text className="text-gray-600 text-xs mt-1">
                      You confirmed receipt and the escrow funds were released
                      to the seller.
                    </Text>
                  </View>
                </View>
              )}

              {/* ================================================= */}
              {/* BUYER TIMELINE */}
              {/* ================================================= */}

              <View className="bg-surface-card rounded-md border border-surface-border p-5 shadow-card mb-4">
                <Text className="text-gray-400 text-xs uppercase mb-4">
                  Transaction Progress
                </Text>

                <EscrowTimeline completed={true} text="Quote accepted" />

                <EscrowTimeline completed={true} text="Invoice generated" />

                <EscrowTimeline
                  completed={isFunded || isDelivered || isReleased}
                  text="Payment secured"
                />

                <EscrowTimeline
                  completed={isDelivered || isReleased}
                  active={isFunded}
                  text="Seller delivers order"
                />

                <EscrowTimeline
                  completed={isReleased}
                  active={isDelivered}
                  text="Buyer confirms receipt"
                />

                <EscrowTimeline
                  completed={isReleased}
                  text="Funds released to seller"
                />
              </View>

              {/* ================================================= */}
              {/* DELIVERY PROOF (seller's) */}
              {/* ================================================= */}

              {deliveryProofUrl && (
                <View className="bg-white rounded-2xl p-5 mb-4">
                  <View className="flex-row items-center mb-3">
                    <Truck size={20} color="#4f46e5" />

                    <Text className="font-semibold ml-2">Delivery Proof</Text>
                  </View>

                  <Image
                    source={{
                      uri: deliveryProofUrl,
                    }}
                    className="w-full h-56 rounded-xl"
                    resizeMode="cover"
                  />

                  {escrow.sellerDeliveredAt && (
                    <Text className="text-gray-400 text-xs mt-2">
                      Delivered on {formatDate(escrow.sellerDeliveredAt)}
                    </Text>
                  )}
                </View>
              )}

              {/* ================================================= */}
              {/* BUYER'S OWN CONFIRMATION PROOF (after release) */}
              {/* ================================================= */}

              {escrow.buyerConfirmationProofUrl && (
                <View className="bg-white rounded-2xl p-5 mb-4">
                  <View className="flex-row items-center mb-3">
                    <Camera size={20} color="#4f46e5" />

                    <Text className="font-semibold ml-2">
                      Your Confirmation Photo
                    </Text>
                  </View>

                  <Image
                    source={{
                      uri: getDeliveryProofUrl(
                        escrow.buyerConfirmationProofUrl,
                      ) ?? undefined,
                    }}
                    className="w-full h-56 rounded-xl"
                    resizeMode="cover"
                  />

                  {escrow.buyerReceivedAt && (
                    <Text className="text-gray-400 text-xs mt-2">
                      Submitted on {formatDate(escrow.buyerReceivedAt)}
                    </Text>
                  )}
                </View>
              )}

              {/* ================================================= */}
              {/* BUYER ACTIONS */}
              {/* ================================================= */}

              {isDelivered && (
                <TouchableOpacity
                  onPress={() => setShowConfirmModal(true)}
                  disabled={confirmingReceipt}
                  className="bg-brand rounded-2xl py-4 items-center mb-3"
                >
                  <View className="flex-row items-center">
                    <Camera size={19} color="white" />

                    <Text className="text-white font-semibold ml-2">
                      Confirm Receipt
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {canDispute && (
                <TouchableOpacity
                  onPress={() => setShowDisputeModal(true)}
                  disabled={disputing}
                  className="border border-red-300 rounded-2xl py-4 items-center mb-4"
                >
                  <View className="flex-row items-center">
                    <AlertTriangle size={19} color="#dc2626" />

                    <Text className="text-red-600 font-semibold ml-2">
                      Dispute Escrow
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* WAITING */}
              {isFunded && (
                <View className="bg-blue-50 rounded-2xl p-4 mb-4">
                  <Text className="font-semibold text-blue-700">
                    Waiting for seller
                  </Text>

                  <Text className="text-gray-600 text-sm mt-1">
                    The seller needs to submit delivery proof before you can
                    confirm receipt. If you believe there&lsquo;s a problem with
                    this order already, you can raise a dispute above.
                  </Text>
                </View>
              )}

              {/* COMPLETED */}
              {isReleased && (
                <View className="bg-emerald-50 rounded-2xl p-4 mb-4">
                  <Text className="font-semibold text-emerald-700">
                    Receipt confirmed
                  </Text>

                  <Text className="text-gray-600 text-sm mt-1">
                    The transaction has been completed and the seller has
                    received the escrow funds.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* ================================================= */}
          {/* SELLER (creator) INFORMATION */}
          {/* ================================================= */}

          {isCreator && (
            <>
              {/* FUNDED */}
              {isFunded && (
                <View className="bg-blue-50 rounded-2xl p-4 flex-row items-center mb-4">
                  <View className="bg-blue-600 p-3 rounded-full">
                    <Wallet size={20} color="white" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-blue-700">
                      Funds reserved for you
                    </Text>

                    <Text className="text-gray-600 text-xs mt-1">
                      {formatMoney(escrow.currentBalance, escrow.currency)} is
                      being held securely until the buyer confirms receipt.
                    </Text>
                  </View>
                </View>
              )}

              {/* DELIVERED */}
              {isDelivered && (
                <View className="bg-yellow-50 rounded-2xl p-4 flex-row items-center mb-4">
                  <View className="bg-yellow-500 p-3 rounded-full">
                    <Truck size={20} color="white" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-yellow-700">
                      Delivery submitted
                    </Text>

                    <Text className="text-gray-600 text-xs mt-1">
                      Your delivery proof has been submitted. Waiting for the
                      buyer to confirm receipt.
                    </Text>
                  </View>
                </View>
              )}

              {/* RELEASED */}
              {isReleased && (
                <View className="bg-emerald-50 rounded-2xl p-4 flex-row items-center mb-4">
                  <View className="bg-emerald-600 p-3 rounded-full">
                    <CheckCircle size={20} color="white" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-emerald-700">
                      Funds released
                    </Text>

                    <Text className="text-gray-600 text-xs mt-1">
                      The buyer confirmed receipt and the escrow funds have been
                      released to you.
                    </Text>
                  </View>
                </View>
              )}

              {/* ================================================= */}
              {/* SELLER TIMELINE */}
              {/* ================================================= */}

              <View className="bg-surface-card rounded-md border border-surface-border p-5 shadow-card mb-4">
                <Text className="text-gray-400 text-xs uppercase mb-4">
                  Transaction Progress
                </Text>

                <EscrowTimeline completed={true} text="Quote accepted" />

                <EscrowTimeline completed={true} text="Invoice generated" />

                <EscrowTimeline
                  completed={isFunded || isDelivered || isReleased}
                  text="Buyer payment secured"
                />

                <EscrowTimeline
                  completed={isDelivered || isReleased}
                  active={isFunded}
                  text="Deliver product/service"
                />

                <EscrowTimeline
                  completed={isReleased}
                  active={isDelivered}
                  text="Buyer confirms receipt"
                />

                <EscrowTimeline
                  completed={isReleased}
                  text="Funds released to you"
                />
              </View>

              {/* ================================================= */}
              {/* SELLER DELIVERY PROOF */}
              {/* ================================================= */}

              {deliveryProofUrl && (
                <View className="bg-white rounded-2xl p-5 mb-4">
                  <View className="flex-row items-center mb-3">
                    <Truck size={20} color="#4f46e5" />

                    <Text className="font-semibold ml-2">
                      Your Delivery Proof
                    </Text>
                  </View>

                  <Image
                    source={{
                      uri: deliveryProofUrl,
                    }}
                    className="w-full h-56 rounded-xl"
                    resizeMode="cover"
                  />

                  {escrow.sellerDeliveredAt && (
                    <Text className="text-gray-400 text-xs mt-2">
                      Submitted on {formatDate(escrow.sellerDeliveredAt)}
                    </Text>
                  )}
                </View>
              )}

              {/* ================================================= */}
              {/* BUYER'S CONFIRMATION PROOF (visible to seller too) */}
              {/* ================================================= */}

              {escrow.buyerConfirmationProofUrl && (
                <View className="bg-white rounded-2xl p-5 mb-4">
                  <View className="flex-row items-center mb-3">
                    <Camera size={20} color="#4f46e5" />

                    <Text className="font-semibold ml-2">
                      Buyer&#39;s Confirmation Photo
                    </Text>
                  </View>

                  <Image
                    source={{
                      uri:
                        getDeliveryProofUrl(
                          escrow.buyerConfirmationProofUrl,
                        ) || undefined,
                    }}
                    className="w-full h-56 rounded-xl"
                    resizeMode="cover"
                  />

                  {escrow.buyerReceivedAt && (
                    <Text className="text-gray-400 text-xs mt-2">
                      Submitted on {formatDate(escrow.buyerReceivedAt)}
                    </Text>
                  )}
                </View>
              )}

              {/* ================================================= */}
              {/* SELLER ACTION */}
              {/* ================================================= */}

              {isFunded && (
                <TouchableOpacity
                  onPress={() => setShowDeliverModal(true)}
                  disabled={delivering}
                  className="bg-brand rounded-2xl py-4 items-center mb-4"
                >
                  <View className="flex-row items-center">
                    <Truck size={19} color="white" />

                    <Text className="text-white font-semibold ml-2">
                      Mark Delivered
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {isDelivered && (
                <View className="bg-yellow-50 rounded-2xl p-4 mb-4">
                  <Text className="font-semibold text-yellow-700">
                    Waiting for buyer confirmation
                  </Text>

                  <Text className="text-gray-600 text-sm mt-1">
                    You have submitted your delivery proof. The buyer must
                    confirm receipt before the funds are released.
                  </Text>
                </View>
              )}

              {isReleased && (
                <View className="bg-emerald-50 rounded-2xl p-4 mb-4">
                  <Text className="font-semibold text-emerald-700">
                    Transaction completed
                  </Text>

                  <Text className="text-gray-600 text-sm mt-1">
                    The buyer confirmed receipt and the funds have been released
                    to your account.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* ================================================= */}
          {/* INVOICE */}
          {/* ================================================= */}

          <View className="bg-white rounded-2xl p-5 flex-row items-center mb-4">
            <FileText size={25} color="#4f46e5" />

            <View className="ml-3 flex-1">
              <Text className="font-semibold">Invoice Document</Text>

              <Text className="text-gray-400 text-xs mt-1">
                {isRecipient
                  ? "View your payment invoice"
                  : "View invoice sent to buyer"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ===================================================== */}
      {/* BUYER CONFIRM RECEIPT MODAL (camera capture) */}
      {/* ===================================================== */}

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={closeConfirmModal}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-5 w-full">
            <Text className="text-lg font-semibold mb-1">Confirm Receipt</Text>

            <Text className="text-gray-500 text-sm mb-4">
              Take a photo of the item you received. This confirms receipt and
              will release {formatMoney(escrow.amount, escrow.currency)} to the
              seller. This action cannot be undone.
            </Text>

            {/* CAMERA CAPTURE */}
            <TouchableOpacity
              onPress={handleTakeConfirmationPhoto}
              disabled={confirmingReceipt}
              className="border border-dashed border-slate-300 rounded-xl h-40 items-center justify-center overflow-hidden"
            >
              {confirmationImage ? (
                <Image
                  source={{
                    uri: confirmationImage.uri,
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center">
                  <Camera size={30} color="#94a3b8" />

                  <Text className="text-slate-400 text-sm mt-2">
                    Tap to take a photo
                  </Text>

                  <Text className="text-slate-400 text-xs mt-1">
                    JPG, PNG or WEBP • Max 5MB
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {confirmationImage && (
              <TouchableOpacity
                onPress={handleTakeConfirmationPhoto}
                disabled={confirmingReceipt}
                className="mt-2 self-start"
              >
                <Text className="text-brand text-xs font-medium">
                  Retake photo
                </Text>
              </TouchableOpacity>
            )}

            {/* ERROR */}
            {confirmError && (
              <Text className="text-red-500 text-xs mt-2">{confirmError}</Text>
            )}

            {/* BUTTONS */}
            <View className="flex-row mt-5 gap-3">
              <TouchableOpacity
                onPress={closeConfirmModal}
                disabled={confirmingReceipt}
                className="flex-1 py-3 rounded-xl items-center bg-slate-100"
              >
                <Text className="text-slate-700 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmReceipt}
                disabled={confirmingReceipt || !confirmationImage}
                className={`flex-1 py-3 rounded-xl items-center ${
                  confirmationImage && !confirmingReceipt
                    ? "bg-brand"
                    : "bg-slate-300"
                }`}
              >
                <View className="flex-row items-center">
                  <PackageCheck size={17} color="white" />

                  <Text className="text-white font-semibold ml-2">
                    {confirmingReceipt ? "Confirming…" : "Confirm Receipt"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===================================================== */}
      {/* BUYER DISPUTE MODAL */}
      {/* ===================================================== */}

      <Modal
        visible={showDisputeModal}
        transparent
        animationType="fade"
        onRequestClose={closeDisputeModal}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-5 w-full">
            <View className="flex-row items-center mb-1">
              <XCircle size={20} color="#dc2626" />

              <Text className="text-lg font-semibold ml-2">Dispute Escrow</Text>
            </View>

            <Text className="text-gray-500 text-sm mb-4">
              Tell us what&#39;s wrong with this order. This will pause the
              escrow and flag it for review — the seller will be notified.
            </Text>

            {/* REASON INPUT */}
            <TextInput
              value={disputeReason}
              onChangeText={(text) => {
                setDisputeReason(text);

                if (disputeError) {
                  setDisputeError(null);
                }
              }}
              placeholder="e.g. Item arrived damaged, wrong item sent…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              editable={!disputing}
              className="border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />

            {/* ERROR */}
            {disputeError && (
              <Text className="text-red-500 text-xs mt-2">{disputeError}</Text>
            )}

            {/* BUTTONS */}
            <View className="flex-row mt-5 gap-3">
              <TouchableOpacity
                onPress={closeDisputeModal}
                disabled={disputing}
                className="flex-1 py-3 rounded-xl items-center bg-slate-100"
              >
                <Text className="text-slate-700 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitDispute}
                disabled={disputing || !disputeReason.trim()}
                className={`flex-1 py-3 rounded-xl items-center ${
                  disputeReason.trim() && !disputing
                    ? "bg-red-600"
                    : "bg-red-200"
                }`}
              >
                <Text className="text-white font-semibold">
                  {disputing ? "Submitting…" : "Submit Dispute"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===================================================== */}
      {/* SELLER DELIVERY MODAL */}
      {/* ===================================================== */}

      <Modal
        visible={showDeliverModal}
        transparent
        animationType="fade"
        onRequestClose={closeDeliverModal}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-5 w-full">
            <Text className="text-lg font-semibold mb-1">
              Submit Delivery Proof
            </Text>

            <Text className="text-gray-500 text-sm mb-4">
              Upload a photo showing that the order was delivered to the buyer.
            </Text>

            {/* IMAGE PICKER */}
            <TouchableOpacity
              onPress={handlePickProofImage}
              disabled={delivering}
              className="border border-dashed border-slate-300 rounded-xl h-40 items-center justify-center overflow-hidden"
            >
              {proofImage ? (
                <Image
                  source={{
                    uri: proofImage.uri,
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center">
                  <Truck size={30} color="#94a3b8" />

                  <Text className="text-slate-400 text-sm mt-2">
                    Tap to choose a photo
                  </Text>

                  <Text className="text-slate-400 text-xs mt-1">
                    JPG, PNG or WEBP • Max 5MB
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* ERROR */}
            {deliverError && (
              <Text className="text-red-500 text-xs mt-2">{deliverError}</Text>
            )}

            {/* BUTTONS */}
            <View className="flex-row mt-5 gap-3">
              <TouchableOpacity
                onPress={closeDeliverModal}
                disabled={delivering}
                className="flex-1 py-3 rounded-xl items-center bg-slate-100"
              >
                <Text className="text-slate-700 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleMarkDelivered}
                disabled={delivering || !proofImage}
                className={`flex-1 py-3 rounded-xl items-center ${
                  proofImage && !delivering ? "bg-brand" : "bg-slate-300"
                }`}
              >
                <Text className="text-white font-semibold">
                  {delivering ? "Submitting…" : "Submit Delivery"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/**
 * ============================================================
 * ESCROW TIMELINE ITEM
 * ============================================================
 */

const EscrowTimeline = ({
  text,
  completed = false,
  active = false,
}: {
  text: string;
  completed?: boolean;
  active?: boolean;
}) => {
  return (
    <View className="flex-row items-center mb-5">
      <View
        className={`w-9 h-9 rounded-full items-center justify-center ${
          completed ? "bg-green-100" : active ? "bg-blue-100" : "bg-gray-100"
        }`}
      >
        {completed ? (
          <CheckCircle size={18} color="#16a34a" />
        ) : active ? (
          <Truck size={18} color="#2563eb" />
        ) : (
          <View className="w-2.5 h-2.5 rounded-full bg-gray-300" />
        )}
      </View>

      <Text
        className={`ml-3 text-sm ${
          completed
            ? "text-green-700 font-medium"
            : active
              ? "text-blue-700 font-semibold"
              : "text-gray-500"
        }`}
      >
        {text}
      </Text>
    </View>
  );
};

export default EscrowDetailsScreen;
