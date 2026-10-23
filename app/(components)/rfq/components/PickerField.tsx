import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export type PickerOption = {
  label: string;
  value: string;
};

type PickerFieldProps = {
  label: string;
  placeholder: string;
  value: string | null;
  options: PickerOption[];
  disabled?: boolean;
  disabledHint?: string;
  onSelect: (option: PickerOption) => void;
  accentColor?: string;
};

export default function PickerField({
  label,
  placeholder,
  value,
  options,
  disabled,
  disabledHint,
  onSelect,
  accentColor = "#f5a623",
}: PickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  return (
    <>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: "#e2e8f0",
          borderRadius: 10,
          padding: 12,
          backgroundColor: disabled ? "#f8fafc" : "#fff",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#94a3b8", fontSize: 10, marginBottom: 2 }}>
            {label}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              color: value ? "#0f1923" : "#cbd5e1",
            }}
          >
            {value ?? (disabled ? (disabledHint ?? placeholder) : placeholder)}
          </Text>
        </View>
        <Feather name="chevron-down" size={16} color="#94a3b8" />
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#f1f5f9",
              gap: 12,
            }}
          >
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Feather name="x" size={22} color="#0f1923" />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f1923" }}>
              {label}
            </Text>
          </View>

          <View style={{ padding: 16 }}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${label.toLowerCase()}`}
              autoFocus
              style={{
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
              }}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item, i) => `${item.value}-${i}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <Text
                style={{ textAlign: "center", color: "#94a3b8", marginTop: 24 }}
              >
                No results
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  setSearch("");
                  setOpen(false);
                }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f8fafc",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, color: "#0f1923" }}>
                  {item.label}
                </Text>
                {item.label === value && (
                  <Feather name="check" size={16} color={accentColor} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}
