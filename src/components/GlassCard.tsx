import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { colors } from "../constants/theme";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
};

const GlassCard = ({ children, style, intensity = 24 }: Props) => (
  <View style={[styles.card, style]}>
    <BlurView intensity={intensity} tint="light" style={styles.blur}>
      <View style={styles.overlay}>{children}</View>
    </BlurView>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  blur: {
    alignSelf: "stretch"
  },
  overlay: {
    backgroundColor: colors.glass,
    padding: 16
  }
});

export default GlassCard;
