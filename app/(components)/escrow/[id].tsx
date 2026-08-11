/* eslint-disable react-hooks/exhaustive-deps */
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  FileText,
  Lock,
  PackageCheck,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getEscrowById,
  markEscrowDelivered,
  releaseEscrow,
} from "@/api/escrowapi";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@/hooks/useAuth"; // adjust to wherever you store the logged-in user
import ConfirmModal from "@/model/confimmodal";
import {
  formatDate,
  formatMoney,
  getCounterpartyName,
  getRole,
  Row,
  Timeline,
} from "./escrowshared";

const EscrowDetailsScreen = () => {
  const { user } = useAuth(); // expects user.id
  const { id } = useLocalSearchParams<{ id: string }>();
  const [escrow, setEscrow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [delivering, setDelivering] = useState(false);
  const [deliverError, setDeliverError] = useState<string | null>(null);

  const loadEscrow = async () => {
    try {
      const result = await getEscrowById(id as string);
      setEscrow(result);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadEscrow();
  }, [id]);

  const handleConfirmDelivery = async () => {
    setReleasing(true);
    try {
      await releaseEscrow(id as string);
      setShowReleaseModal(false);
      await loadEscrow(); // refresh status from the server
    } catch (err) {
      console.log(err);
    } finally {
      setReleasing(false);
    }
  };

  const handlePickProofImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setProofImage(result.assets[0].uri);
      setDeliverError(null);
    }
  };

  const closeDeliverModal = () => {
    setShowDeliverModal(false);
    setProofImage(null);
    setDeliverError(null);
  };

  const handleMarkDelivered = async () => {
    if (!proofImage) {
      setDeliverError("Please choose a delivery-proof image first");
      return;
    }
    setDelivering(true);
    setDeliverError(null);
    try {
      await markEscrowDelivered(id as string, { uri: proofImage });
      setShowDeliverModal(false);
      setProofImage(null);
      await loadEscrow();
    } catch (err: any) {
      // surfaces the backend's 409 "already submitted" / 403 / etc. messages
      setDeliverError(
        err?.response?.data?.message || "Failed to submit delivery proof",
      );
    } finally {
      setDelivering(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center">
        <Text className="text-gray-400">Loading escrow…</Text>
      </SafeAreaView>
    );
  }

  if (!escrow) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center px-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-10 left-5 p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="#374151" />
        </TouchableOpacity>
        <ShieldCheck color="#9ca3af" size={32} />
        <Text className="text-gray-500 mt-3 text-center">
          We couldn&rsquo;t find that escrow transaction.
        </Text>
      </SafeAreaView>
    );
  }

  const isCreator = escrow?.creatorId?.id === user?.id;
  const role = getRole(escrow, user?.id);
  const counterpartyName = getCounterpartyName(escrow, role);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView>
        {/* Header */}
        <View className="bg-brand px-5 pt-10 pb-8 rounded-b-lg">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 p-1 -ml-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft color="white" size={22} />
            </TouchableOpacity>

            <View className="bg-white/20 p-3 rounded-full">
              <ShieldCheck color="white" size={22} />
            </View>

            <View className="ml-3">
              <Text className="text-white text-lg font-semibold">
                {isCreator ? "Escrow You Funded" : "Escrow Payment for You"}
              </Text>
              <Text className="text-white/60 text-xs">{escrow.escrowUprn}</Text>
            </View>

            <View
              className={`ml-auto px-3 py-1 rounded-full ${
                escrow.status === "FUNDED" ? "bg-success" : "bg-ink-muted"
              }`}
            >
              <Text className="text-white text-xs">{escrow.status}</Text>
            </View>
          </View>

          <View className="mt-6">
            <Text className="text-white/60 text-xs uppercase">
              {isCreator ? "Amount You Secured" : "Amount Owed To You"}
            </Text>
            <Text className="text-white text-3xl font-bold mt-1">
              {formatMoney(escrow.amount, escrow.currency)}
            </Text>
          </View>
        </View>

        <View className="p-5 space-y-4">
          {/* Order Card — shared, but labels differ */}
          <View className="bg-surface-card rounded-md border border-surface-border p-5 shadow-card">
            <Text className="text-gray-400 text-xs uppercase mb-3">
              Order Summary
            </Text>
            <Row title="Description" value={escrow.description} />
            <Row
              title={isCreator ? "Seller" : "Buyer"}
              value={counterpartyName}
            />
            <Row title="Currency" value={escrow.currency} />
            <Row title="Expires" value={formatDate(escrow.expiryDate)} />
            <Row title="Status" value={escrow.status} />
          </View>

          {/* CREATOR (buyer) view */}
          {isCreator && (
            <>
              <View className="bg-green-50 rounded-md p-4 flex-row items-center">
                <View className="bg-success p-3 rounded-full">
                  <Lock size={20} color="white" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-green-700">
                    Payment secured
                  </Text>
                  <Text className="text-gray-600 text-xs mt-1">
                    Funds are held until you confirm delivery.
                  </Text>
                </View>
              </View>

              <View className="bg-surface-card rounded-md border border-surface-border p-5 shadow-card">
                <Text className="text-gray-400 text-xs uppercase mb-4">
                  Progress
                </Text>
                <Timeline done text="Quote accepted" />
                <Timeline done text="Invoice generated" />
                <Timeline done text="Payment completed" />
                <Timeline
                  done={escrow.status === "DELIVERED"}
                  active={escrow.status === "FUNDED"}
                  text="Seller marks delivery"
                />
                <Timeline
                  active={escrow.status === "DELIVERED"}
                  text="Funds released"
                />
              </View>

              {escrow.status === "DELIVERED" && escrow.deliveryProofUrl ? (
                <View className="bg-white rounded-2xl p-5">
                  <Text className="font-semibold mb-3">
                    Delivery Proof Submitted
                  </Text>
                  <Image
                    source={{ uri: escrow.deliveryProofUrl }}
                    className="w-full h-48 rounded-xl"
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View className="bg-blue-100 rounded-2xl p-4">
                  <Text className="font-semibold text-blue-700">Next step</Text>
                  <Text className="text-gray-700 text-sm mt-2">
                    Once the seller marks the order delivered, you can confirm
                    receipt to release funds to them.
                  </Text>
                </View>
              )}

              <View className="bg-white rounded-2xl p-5 flex-row items-center">
                <FileText size={25} color="#4f46e5" />
                <View className="ml-3">
                  <Text className="font-semibold">Invoice Document</Text>
                  <Text className="text-gray-400 text-xs">
                    View payment invoice
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                disabled={escrow.status !== "DELIVERED"}
                onPress={() => setShowReleaseModal(true)}
                className={`rounded-2xl py-4 items-center mt-3 ${
                  escrow.status === "DELIVERED" ? "bg-brand" : "bg-slate-300"
                }`}
              >
                <View className="flex-row items-center">
                  <PackageCheck size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    {escrow.status === "DELIVERED"
                      ? "Confirm Delivery"
                      : "Waiting for Seller Delivery"}
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* RECIPIENT (seller) view */}
          {!isCreator && (
            <>
              <View className="bg-blue-100 rounded-md p-4 flex-row items-center">
                <View className="bg-brand-light p-3 rounded-full">
                  <Wallet size={20} color="white" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-indigo-700">
                    Funds reserved for you
                  </Text>
                  <Text className="text-gray-600 text-xs mt-1">
                    {formatMoney(escrow.currentBalance, escrow.currency)} will
                    be released once the buyer confirms delivery.
                  </Text>
                </View>
              </View>

              <View className="bg-surface-card rounded-md border border-surface-border p-5 shadow-card">
                <Text className="text-gray-400 text-xs uppercase mb-4">
                  Progress
                </Text>
                <Timeline done text="Quote accepted" />
                <Timeline done text="Invoice generated" />
                <Timeline done text="Buyer payment received" />
                <Timeline
                  done={escrow.status === "DELIVERED"}
                  active={escrow.status === "FUNDED"}
                  text="Deliver product/service"
                />
                <Timeline
                  active={escrow.status === "DELIVERED"}
                  text="Funds released to you"
                />
              </View>

              <View className="bg-yellow-100 rounded-2xl p-4">
                <Text className="font-semibold text-yellow-700">
                  {escrow.status === "DELIVERED"
                    ? "Delivery submitted"
                    : "Action required"}
                </Text>
                <Text className="text-gray-700 text-sm mt-2">
                  {escrow.status === "DELIVERED"
                    ? "You've submitted delivery proof. Your payout will be released once the buyer confirms receipt."
                    : "Deliver the item to the buyer, then mark it as delivered. Your payout is released after buyer confirmation."}
                </Text>
              </View>

              {escrow.status === "DELIVERED" && escrow.deliveryProofUrl && (
                <View className="bg-white rounded-2xl p-5">
                  <Text className="font-semibold mb-3">
                    Your Delivery Proof
                  </Text>
                  <Image
                    source={{ uri: escrow.deliveryProofUrl }}
                    className="w-full h-48 rounded-xl"
                    resizeMode="cover"
                  />
                </View>
              )}

              <View className="bg-white rounded-2xl p-5 flex-row items-center">
                <FileText size={25} color="#4f46e5" />
                <View className="ml-3">
                  <Text className="font-semibold">Invoice Document</Text>
                  <Text className="text-gray-400 text-xs">
                    View invoice sent to buyer
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                disabled={escrow.status !== "FUNDED"}
                onPress={() => setShowDeliverModal(true)}
                className={`rounded-2xl py-4 items-center mt-3 ${
                  escrow.status === "FUNDED" ? "bg-brand" : "bg-slate-300"
                }`}
              >
                <View className="flex-row items-center">
                  <Truck size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    {escrow.status === "FUNDED"
                      ? "Mark Delivered"
                      : escrow.status === "DELIVERED"
                        ? "Delivery Submitted"
                        : "Mark Delivered"}
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showReleaseModal}
        title="Confirm Delivery"
        message="This will release the funds to the seller. Only confirm once you've received your order."
        icon="package"
        danger={false}
        confirmLabel={releasing ? "Releasing…" : "Confirm & Release"}
        onCancel={() => setShowReleaseModal(false)}
        onConfirm={handleConfirmDelivery}
      />

      {/* Seller: submit delivery-proof image */}
      <Modal visible={showDeliverModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-5 w-full">
            <Text className="text-lg font-semibold mb-1">
              Submit Delivery Proof
            </Text>
            <Text className="text-gray-500 text-sm mb-4">
              Upload a photo showing the item was delivered. This can&rsquo;t be
              undone or changed later.
            </Text>

            <TouchableOpacity
              onPress={handlePickProofImage}
              className="border border-dashed border-slate-300 rounded-xl h-40 items-center justify-center overflow-hidden"
            >
              {proofImage ? (
                <Image
                  source={{ uri: proofImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-slate-400 text-sm">
                  Tap to choose a photo
                </Text>
              )}
            </TouchableOpacity>

            {deliverError && (
              <Text className="text-red-500 text-xs mt-2">{deliverError}</Text>
            )}

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
                  proofImage ? "bg-brand" : "bg-slate-300"
                }`}
              >
                <Text className="text-white font-semibold">
                  {delivering ? "Submitting…" : "Submit"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default EscrowDetailsScreen;
