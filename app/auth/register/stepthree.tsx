import { ScrollView } from "react-native";
import { useRegister } from "./registercontext";
import { PrimaryButton } from "./componentsdata";

export default function StepThree() {
  const { formData } = useRegister();

  const isPersonal = formData.type === "personal";

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-20">
      {isPersonal ? (
        <PrimaryButton
          label="Finish Personal Registration"
          onPress={() => {}}
        />
      ) : (
        <PrimaryButton
          label="Continue to Organisation Details"
          onPress={() => {}}
        />
      )}
    </ScrollView>
  );
}
