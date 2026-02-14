import { ReactNode } from "react";
import {
  ImageBackground,
  StyleSheet,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const BACKGROUND_IMAGE = require("../../assets/beckground1.png");

type Props = {
  children: ReactNode;
};

const ScreenLayout = ({ children }: Props) => (
  <View style={styles.root}>
    <ImageBackground
      source={BACKGROUND_IMAGE}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    />
    <LinearGradient
      colors={[
        "rgba(11,16,32,0.4)",
        "rgba(26,31,59,0.75)",
        "rgba(59,28,90,0.9)"
      ]}
      style={styles.gradientOverlay}
    />
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  safe: {
    flex: 1
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24
  }
});

export default ScreenLayout;
