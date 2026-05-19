import React, { useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Bank, BANKS } from "../constant/bank";
import { withdrawStyles as styles } from "../app/styles/withdraw.styles";

interface BankPickerModalProps {
  visible: boolean;
  selectedBank: Bank | null;
  onSelect: (bank: Bank) => void;
  onClose: () => void;
}

/**
 * Full-screen modal that lets the user search and pick their bank.
 * Reads from the static BANKS list — no API call needed.
 *
 * Usage:
 *   <BankPickerModal
 *     visible={bankModalVisible}
 *     selectedBank={selectedBank}
 *     onSelect={(bank) => setSelectedBank(bank)}
 *     onClose={() => setBankModalVisible(false)}
 *   />
 */
const BankPickerModal: React.FC<BankPickerModalProps> = ({
  visible,
  selectedBank,
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = React.useState("");

  const filtered = useMemo(
    () =>
      BANKS.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase().trim()),
      ),
    [search],
  );

  const handleSelect = (bank: Bank) => {
    onSelect(bank);
    onClose();
    setSearch(""); // reset search for next open
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* ── Header ── */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Bank</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#0f1923" />
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchBox}>
          <Feather
            name="search"
            size={16}
            color="#94a3b8"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search banks..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>

        {/* ── Bank list ── */}
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.code}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.bankItem,
                selectedBank?.code === item.code && styles.bankItemSelected,
              ]}
              onPress={() => handleSelect(item)}
            >
              <View style={styles.bankIconCircle}>
                <Text style={styles.bankIconText}>{item.name.charAt(0)}</Text>
              </View>
              <Text style={styles.bankItemName}>{item.name}</Text>
              {selectedBank?.code === item.code && (
                <Feather name="check" size={16} color="#6a3de8" />
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </Modal>
  );
};

export default BankPickerModal;
