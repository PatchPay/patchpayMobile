import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import { useState } from "react";

import SelectPill from "./SelectPill";

import { FoundUser, SearchType } from "@/types/rfq.types";

import { apiFetch } from "@/api/rfqapi";

export default function RecipientModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (u: FoundUser) => void;
}) {
  const searchOptions: SearchType[] = ["email", "name", "phone"];
  const [searchType, setSearchType] = useState<SearchType>("email");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoundUser | null>(null);
  const [error, setError] = useState("");

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await apiFetch(
        `/users/search?query=${encodeURIComponent(query)}&searchType=${searchType}`,
      );
      setResult(data.data);
      console.log("this the user", data.data);
    } catch (e: any) {
      setError(e.message ?? "User not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#f2f4f8",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#0f1923" }}>
              Find Recipient
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Search type */}
          <SelectPill
            options={searchOptions}
            value={searchType}
            onChange={(v) => setSearchType(v as SearchType)}
            activeColor="#2541c4"
          />

          {/* Input */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: 12,
              marginTop: 14,
              alignItems: "center",
              gap: 10,
            }}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={`Search by ${searchType}…`}
              placeholderTextColor="#cbd5e1"
              style={{ flex: 1, color: "#0f1923", fontSize: 14, padding: 0 }}
              onSubmitEditing={search}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={search}
              style={{
                backgroundColor: "#2541c4",
                borderRadius: 10,
                padding: 8,
              }}
            >
              <Feather name="search" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* States */}
          {loading && (
            <ActivityIndicator color="#2541c4" style={{ marginTop: 20 }} />
          )}
          {error ? (
            <Text
              style={{
                color: "#e05c97",
                textAlign: "center",
                marginTop: 16,
                fontSize: 13,
              }}
            >
              {error}
            </Text>
          ) : null}

          {result && (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 16,
                marginTop: 16,
                shadowColor: "#000",
                shadowOpacity: 0.04,
                elevation: 2,
              }}
            >
              <Text
                style={{ fontWeight: "700", color: "#0f1923", fontSize: 15 }}
              >
                {result.firstName} {result.lastName}
              </Text>
              <Text style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>
                {result.email} · {result.country}
              </Text>
              <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                {result.currency} · ID: {result.uniqueId}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  onSelect(result);
                  onClose();
                }}
                style={{
                  marginTop: 14,
                  backgroundColor: "#2541c4",
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}
                >
                  Select Recipient
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
