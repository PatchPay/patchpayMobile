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
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View
          className="bg-white rounded-3xl w-full px-6 pt-7 pb-6 items-center"
          style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 10,
            },
            shadowOpacity: 0.2,
            shadowRadius: 25,
            elevation: 15,
          }}
        >
          {/* Icon */}
          <View
            className={`w-16 h-16 rounded-full items-center justify-center mb-5 ${
              danger ? "bg-red-50" : "bg-sky-50"
            }`}
          >
            <View
              className={`w-11 h-11 rounded-full items-center justify-center ${
                danger ? "bg-red-100" : "bg-sky-100"
              }`}
            >
              <Feather
                name={icon as any}
                size={23}
                color={danger ? "#ef4444" : "#0ea5e9"}
              />
            </View>
          </View>

          {/* Title */}
          <Text className="text-slate-900 text-lg font-bold text-center mb-2">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-slate-500 text-sm text-center leading-6 px-2 mb-7">
            {message}
          </Text>

          {/* Buttons */}
          <View className="flex-row gap-3 w-full">
            {/* Cancel */}
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.8}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3.5 items-center"
            >
              <Text className="text-slate-700 font-semibold text-sm">
                {cancelLabel}
              </Text>
            </TouchableOpacity>

            {/* Confirm */}
            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.8}
              className={`flex-1 rounded-xl py-3.5 items-center ${
                danger ? "bg-red-500" : "bg-brand"
              }`}
              style={{
                shadowColor: danger ? "#ef4444" : "#0ea5e9",
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 4,
              }}
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
