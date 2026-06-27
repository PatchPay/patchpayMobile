import { Bank, BANKS } from "@/constant/bank";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Search icon as SVG-in-JSX (no extra dep needed)
function SearchIcon() {
  return (
    <View style={icon.wrap}>
      {/* Circle */}
      <View style={icon.circle} />
      {/* Handle */}
      <View style={icon.handle} />
    </View>
  );
}

const icon = StyleSheet.create({
  wrap: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  circle: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#94a3b8",
    position: "absolute",
    top: 0,
    left: 0,
  },
  handle: {
    width: 2,
    height: 6,
    backgroundColor: "#94a3b8",
    borderRadius: 1,
    position: "absolute",
    bottom: 0,
    right: 1,
    transform: [{ rotate: "-45deg" }],
  },
});

type Props = {
  selected: Bank | null;
  onSelect: (bank: Bank) => void;
};

export default function BankPicker({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? BANKS.filter((b) => b.name.toLowerCase().includes(q)) : BANKS;
  }, [query]);

  function handleClose() {
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.picker}>
        <Text style={selected ? styles.pickerText : styles.placeholder}>
          {selected ? selected.name : "Select bank"}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" onRequestClose={handleClose}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Select bank</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="Search bank name…"
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              clearButtonMode="while-editing" // iOS only; harmless on Android
            />
          </View>

          {/* Bank list */}
          <FlatList
            data={filtered}
            keyExtractor={(b) => b.code}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>
                No banks match &rdquo;{query}&rdquo;
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bankRow}
                onPress={() => {
                  onSelect(item);
                  handleClose();
                }}
              >
                <Text style={styles.bankName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  pickerText: { fontSize: 14, color: "#0f172a" },
  placeholder: { fontSize: 14, color: "#94a3b8" },
  chevron: { fontSize: 18, color: "#94a3b8" },

  modal: { flex: 1, paddingTop: 60, backgroundColor: "lightblue" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: "#94a3b8" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    padding: 0, // remove default Android padding
  },

  bankRow: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  bankName: { fontSize: 15, color: "#0f172a" },

  empty: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    color: "#94a3b8",
  },
});
