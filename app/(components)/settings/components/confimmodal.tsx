import { Feather } from "@expo/vector-icons";
import { Modal, Text, TouchableOpacity, View } from "react-native";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  visible,
  title,
  message,
  icon = "alert-triangle",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/40 items-center justify-center px-8">
        <View className="bg-white rounded-2xl w-full px-6 py-6 items-center">
          <View
            className={`w-14 h-14 rounded-full items-center justify-center mb-4 ${
              danger ? "bg-red-50" : "bg-sky-50"
            }`}
          >
            <Feather
              name={icon as any}
              size={24}
              color={danger ? "#ef4444" : "#0ea5e9"}
            />
          </View>

          <Text className="text-slate-800 text-base font-bold text-center mb-2">
            {title}
          </Text>
          <Text className="text-slate-500 text-sm text-center mb-6 leading-5">
            {message}
          </Text>

          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 border border-slate-200 rounded-md py-3 items-center"
            >
              <Text className="text-slate-600 font-semibold text-sm">
                {cancelLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className={`flex-1 rounded-md py-3 items-center ${
                danger ? "bg-red-500" : "bg-brand"
              }`}
            >
              <Text className="text-white font-semibold text-sm">
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
