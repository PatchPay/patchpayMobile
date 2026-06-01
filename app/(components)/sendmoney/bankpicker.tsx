import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { Bank, BANKS } from "@/constant/bank"; // your existing Bank list

type Props = {
  selected: Bank | null;
  onSelect: (bank: Bank) => void;
};

export default function BankPicker({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.picker}>
        <Text style={selected ? styles.pickerText : styles.placeholder}>
          {selected ? selected.name : "Select bank"}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Select bank</Text>
          <FlatList
            data={BANKS}
            keyExtractor={(b) => b.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bankRow}
                onPress={() => {
                  onSelect(item);
                  setOpen(false);
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
  modal: { flex: 1, padding: 20, paddingTop: 60 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  bankRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  bankName: { fontSize: 15 },
});
