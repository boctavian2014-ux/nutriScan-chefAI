import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";
import { createScanWithImage } from "../../api/scans";
import { colors } from "../../constants/theme";
import ScreenLayout from "../../components/ScreenLayout";
import { getStoredUser } from "../../storage/onboarding";
import type { ScanStackParamList } from "../../navigation/types";
import type { Scan, User } from "../../types/domain";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SCAN_BUTTON_OUTER = 80;
const SCAN_BUTTON_INNER = 56;
const SCAN_BAR_DURATION = 2600;
const SCAN_BAR_RANGE = SCREEN_HEIGHT - 140;

type Props = NativeStackScreenProps<ScanStackParamList, "ScanMain">;

const ScanScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanBarAnim = useRef(new Animated.Value(0)).current;
  const scanButtonScale = useRef(new Animated.Value(1)).current;

  const contentWidth = SCREEN_WIDTH - 40;
  const resultBoxSize = contentWidth;

  useEffect(() => {
    getStoredUser().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setCameraReady(true), 100);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanBarAnim, {
          toValue: 1,
          duration: SCAN_BAR_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(scanBarAnim, {
          toValue: 0,
          duration: SCAN_BAR_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanBarAnim]);

  const mutation = useMutation({
    mutationFn: ({ userId, uri }: { userId: string; uri: string }) =>
      createScanWithImage(userId, uri),
    onSuccess: (data) => {
      setScan(data.data);
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : t("common.error"));
    }
  });

  const onScan = async () => {
    if (!cameraRef.current) return;
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      setImageUri(photo?.uri ?? null);
    } catch {
      setError(t("common.error"));
    }
  };

  const onScanPressIn = () => {
    Animated.spring(scanButtonScale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 80,
      bounciness: 0
    }).start();
  };

  const onScanPressOut = () => {
    Animated.spring(scanButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 80,
      bounciness: 8
    }).start();
  };

  const onPickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const onAnalyze = () => {
    if (!user?.id || !imageUri) return;
    mutation.mutate({ userId: user.id, uri: imageUri });
  };

  const ingredients = (scan?.extractedIngredients ?? []).filter(Boolean);

  if (!permission?.granted) {
    return (
      <ScreenLayout>
        <View style={[styles.inner, styles.center]}>
          <Text style={styles.title}>{t("scan.title")}</Text>
          <Text style={[styles.muted, { marginBottom: 24 }]}>
            {t("common.loading")}
          </Text>
          <TouchableOpacity
            style={[styles.enableCameraButton]}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>{t("scan.enableCamera")}</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View style={styles.fullScanContainer}>
        <View style={styles.cameraWrapper}>
          {cameraReady && Platform.OS !== "web" ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraPlaceholderText}>
                {t("scan.upload")}
              </Text>
            </View>
          )}
          <Animated.View
            style={[
              styles.scanBar,
              {
                transform: [
                  {
                    translateY: scanBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, SCAN_BAR_RANGE]
                    })
                  }
                ]
              }
            ]}
            pointerEvents="none"
          />
        </View>

        <View style={styles.overlayTop} pointerEvents="box-none">
          <Text style={styles.title}>{t("scan.title")}</Text>
          <TouchableOpacity
            style={styles.uploadCta}
            onPress={onPickImage}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadCtaText}>{t("scan.upload")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.overlayBottom} pointerEvents="box-none">
          <View style={styles.scanButtonRow}>
            <TouchableOpacity
              style={styles.scanButtonWrap}
              onPress={onScan}
              onPressIn={onScanPressIn}
              onPressOut={onScanPressOut}
              activeOpacity={1}
            >
              <Animated.View
                style={[
                  styles.scanButton,
                  { transform: [{ scale: scanButtonScale }] }
                ]}
              >
                <View style={styles.scanButtonInner} />
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.scanButtonLabel}>{t("scan.scanButton")}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (!imageUri || mutation.isPending) && styles.analyzeButtonDisabled
            ]}
            onPress={onAnalyze}
            disabled={!imageUri || mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.buttonText}>{t("scan.analyze")}</Text>
            )}
          </TouchableOpacity>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {scan && ingredients.length > 0 ? (
          <View style={styles.resultOverlay} pointerEvents="box-none">
            <View style={[styles.resultSquare, { width: resultBoxSize }]}>
              <Text style={styles.resultTitle}>{t("scan.result")}</Text>
              <Text style={styles.tapHint}>{t("scan.tapIngredient")}</Text>
              <ScrollView
                style={styles.ingredientList}
                contentContainerStyle={styles.ingredientListContent}
                showsVerticalScrollIndicator={false}
              >
                {ingredients.map((ingredient, index) => (
                  <TouchableOpacity
                    key={`${ingredient}-${index}`}
                    style={styles.ingredientChip}
                    onPress={() =>
                      navigation.navigate("IngredientDetail", { ingredient })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.ingredientChipText} numberOfLines={1}>
                      {ingredient}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : null}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  fullScanContainer: {
    flex: 1,
    marginHorizontal: -20,
    marginTop: -12,
    marginBottom: -24,
    position: "relative"
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    color: colors.text
  },
  uploadCta: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.glassStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder
  },
  uploadCtaText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600"
  },
  cameraWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "#000"
  },
  camera: {
    flex: 1
  },
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24
  },
  resultOverlay: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "flex-end"
  },
  scanBar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    opacity: 0.9,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  cameraPlaceholderText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20
  },
  scanButtonRow: {
    alignItems: "center",
    marginBottom: 10
  },
  scanButtonWrap: {
    alignItems: "center",
    justifyContent: "center"
  },
  scanButton: {
    width: SCAN_BUTTON_OUTER,
    height: SCAN_BUTTON_OUTER,
    borderRadius: SCAN_BUTTON_OUTER / 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8
  },
  scanButtonInner: {
    width: SCAN_BUTTON_INNER,
    height: SCAN_BUTTON_INNER,
    borderRadius: SCAN_BUTTON_INNER / 2,
    backgroundColor: "#fff"
  },
  scanButtonLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    letterSpacing: 0.5
  },
  analyzeButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 6
  },
  analyzeButtonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16
  },
  enableCameraButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    alignItems: "center"
  },
  errorText: {
    color: colors.danger,
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14
  },
  resultSquare: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.glassStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    maxHeight: SCREEN_HEIGHT * 0.45
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4
  },
  tapHint: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 12
  },
  ingredientList: {
    maxHeight: 220
  },
  ingredientListContent: {
    paddingBottom: 8
  },
  ingredientChip: {
    backgroundColor: colors.glass,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 8
  },
  ingredientChipText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500"
  },
  muted: {
    color: colors.muted
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent"
  }
});

export default ScanScreen;
