import { Stack } from "expo-router";
import { RegisterProvider } from "../auth/register/registercontext";

export default function RegisterLayout() {
  return (
    <RegisterProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </RegisterProvider>
  );
}
