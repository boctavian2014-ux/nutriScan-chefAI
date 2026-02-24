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
let BarCodeScanner: any = null;
try {
  const mod = require("expo-barcode-scanner");
  BarCodeScanner = mod.BarCodeScanner;
} catch (e) {
  console.warn("BarCodeScanner module not available in Expo Go");
}
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";
import { createScanWithImage } from "../../api/scans";
import { colors } from "../../constants/theme";
import ScreenLayout from "../../components/ScreenLayout";
import { getStoredUser } from "../../storage/onboarding";
import type { ScanStackParamList } from "../../navigation/types";
import type { Scan, User } from "../../types/domain";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SCAN_BUTTON_OUTER = 70;
const SCAN_BUTTON_INNER = 50;
const SCAN_BAR_DURATION = 2600;
const SCAN_BAR_RANGE = SCREEN_HEIGHT - 140;

type Props = NativeStackScreenProps<ScanStackParamList, "ScanMain">;

const ScanScreen = ({ navigation }: Props) => {
  const { t, i18n } = useTranslation();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"image" | "barcode">("image");
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const [recognizedProduct, setRecognizedProduct] = useState<any>(null);
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

  const barcodeMutation = useMutation({
    mutationFn: ({ barcode }: { barcode: string }) =>
      fetch(`http://192.168.1.101:4000/api/scans/recognize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode,
          language: i18n.language,
          userId: user?.id,
        }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      setRecognizedProduct(data.product);
      setError(null);
      setBarcodeScanned(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : t("common.error"));
      setBarcodeScanned(false);
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

  const onBarcodeScanned = ({ data }: any) => {
    if (barcodeScanned) return;
    setBarcodeScanned(true);
    barcodeMutation.mutate({ barcode: data });
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
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionTitle}>{t("scan.enableCamera")}</Text>
          <Text style={[styles.permissionDesc, { marginBottom: 24 }]}>
            {t("common.loading")}
          </Text>
          <TouchableOpacity
            style={styles.enableCameraButton}
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
            mode === "barcode" ? (
              BarCodeScanner ? (
                <BarCodeScanner
                  onBarCodeScanned={onBarcodeScanned}
                  style={StyleSheet.absoluteFillObject}
                />
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <Text style={styles.cameraPlaceholderEmoji}>⚠️</Text>
                  <Text style={styles.cameraPlaceholderText}>
                    Barcode scanner not available in Expo Go
                  </Text>
                  <Text style={styles.cameraPlaceholderText}>Use Camera mode or build with EAS</Text>
                </View>
              )
            ) : (
              <CameraView ref={cameraRef} style={styles.camera} facing="back" />
            )
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraPlaceholderEmoji}>📷</Text>
              <Text style={styles.cameraPlaceholderText}>
                {t("common.loading")}
              </Text>
            </View>
          )}
          {mode === "image" && (
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
          )}
        </View>

        {/* Mode Toggle Buttons */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[styles.modeButton, mode === "image" && styles.modeButtonActive]}
            onPress={() => {
              setMode("image");
              setBarcodeScanned(false);
              setRecognizedProduct(null);
            }}
          >
            <Text style={styles.modeButtonIcon}>📸</Text>
            <Text style={styles.modeButtonText}>Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, mode === "barcode" && styles.modeButtonActive]}
            onPress={() => {
              setMode("barcode");
              setBarcodeScanned(false);
            }}
          >
            <Text style={styles.modeButtonIcon}>📊</Text>
            <Text style={styles.modeButtonText}>Barcode</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.headerOverlay} pointerEvents="box-none">
          <View>
            <Text style={styles.headerTitle}>{t("scan.title")}</Text>
            <Text style={styles.headerSubtitle}>ZEST AI Smart Scanning</Text>
          </View>
          {(imageUri || recognizedProduct) && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>✓ {t("common.ready")}</Text>
            </View>
          )}
        </View>

        {/* Bottom Controls */}
        <View style={styles.controlsOverlay} pointerEvents="box-none">
          {/* Floating Action Button - Main Capture (Image Mode Only) */}
          {mode === "image" && (
            <View style={styles.fabContainer}>
              <TouchableOpacity
                style={styles.fabMain}
                onPress={onScan}
                onPressIn={onScanPressIn}
                onPressOut={onScanPressOut}
                activeOpacity={1}
              >
                <Animated.View
                  style={[
                    styles.fabInner,
                    { transform: [{ scale: scanButtonScale }] }
                  ]}
                >
                  <Text style={styles.fabIcon}>📸</Text>
                </Animated.View>
              </TouchableOpacity>

              {/* Quick Gallery Button */}
              <TouchableOpacity style={styles.fabAlt} onPress={onPickImage}>
                <Text style={styles.fabAltIcon}>🖼️</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Barcode Scanning Status */}
          {mode === "barcode" && barcodeScanned && (
            <View style={styles.barcodeStatus}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.barcodeStatusText}>Scanning barcode...</Text>
            </View>
          )}

          {/* Analyze Panel (Image Mode) */}
          {mode === "image" && imageUri && (
            <View style={styles.analyzePanel}>
              <Text style={styles.panelLabel}>{t("scan.analyze")}</Text>
              <TouchableOpacity
                style={[
                  styles.analyzeButtonPremium,
                  mutation.isPending && styles.analyzeButtonPremiumDisabled
                ]}
                onPress={onAnalyze}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.analyzeButtonIcon}>✨</Text>
                    <Text style={styles.analyzeButtonText}>{t("scan.analyze")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Error State */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Results Overlay - Image Mode */}
        {mode === "image" && scan && ingredients.length > 0 && (
          <View style={styles.resultOverlay} pointerEvents="box-none">
            <View style={[styles.resultSquare, { width: resultBoxSize }]}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>
                  ✨ {ingredients.length} {t("scan.ingredients")}
                </Text>
                <TouchableOpacity
                  style={styles.resultCloseBtn}
                  onPress={() => {
                    setScan(null);
                    setImageUri(null);
                  }}
                >
                  <Text style={styles.resultCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
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
                    <Text style={styles.ingredientChipEmoji}>🏷️</Text>
                    <Text style={styles.ingredientChipText} numberOfLines={1}>
                      {ingredient}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Results Overlay - Barcode Mode */}
        {mode === "barcode" && recognizedProduct && (
          <View style={styles.resultOverlay} pointerEvents="box-none">
            <View style={[styles.resultSquare, { width: resultBoxSize }]}>
              <View style={styles.resultHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle}>{recognizedProduct.name}</Text>
                  <Text style={styles.productBrand}>Product Details</Text>
                </View>
                <TouchableOpacity
                  style={styles.resultCloseBtn}
                  onPress={() => {
                    setRecognizedProduct(null);
                    setBarcodeScanned(false);
                  }}
                >
                  <Text style={styles.resultCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.ingredientList}
                contentContainerStyle={styles.ingredientListContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Ingredients Section */}
                <Text style={styles.sectionTitle}>🥘 {t("chef.ingredients")}</Text>
                {recognizedProduct.ingredients?.map((ingredient: string, index: number) => (
                  <TouchableOpacity
                    key={`${ingredient}-${index}`}
                    style={styles.ingredientChip}
                    onPress={() =>
                      navigation.navigate("IngredientDetail", { ingredient })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.ingredientChipEmoji}>✓</Text>
                    <Text style={styles.ingredientChipText} numberOfLines={2}>
                      {ingredient}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Nutrition Facts */}
                {recognizedProduct.nutrition && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                      📊 Nutrition Facts
                    </Text>
                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionLabel}>Energy</Text>
                        <Text style={styles.nutritionValue}>
                          {recognizedProduct.nutrition.energy} kcal
                        </Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionLabel}>Fat</Text>
                        <Text style={styles.nutritionValue}>
                          {recognizedProduct.nutrition.fat} g
                        </Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionLabel}>Carbs</Text>
                        <Text style={styles.nutritionValue}>
                          {recognizedProduct.nutrition.carbs} g
                        </Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionLabel}>Protein</Text>
                        <Text style={styles.nutritionValue}>
                          {recognizedProduct.nutrition.protein} g
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Allergens/Warnings */}
                {recognizedProduct.allergens?.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                      ⚠️ Allergens
                    </Text>
                    {recognizedProduct.allergens.map((allergen: string, index: number) => (
                      <View key={`${allergen}-${index}`} style={styles.allergenBadge}>
                        <Text style={styles.allergenText}>{allergen}</Text>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        )}
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
  permissionEmoji: {
    fontSize: 64,
    marginBottom: 20
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8
  },
  permissionDesc: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: 20
  },
  enableCameraButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  buttonText: {
    color: colors.textDark,
    fontWeight: "700",
    fontSize: 16
  },
  cameraWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "#000"
  },
  camera: {
    flex: 1
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  cameraPlaceholderEmoji: {
    fontSize: 56,
    marginBottom: 12
  },
  cameraPlaceholderText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center"
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
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)"
  },
  statusBadge: {
    backgroundColor: "rgba(107, 203, 119, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)"
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  controlsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 20
  },
  fabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 16,
    marginBottom: 16
  },
  fabMain: {
    width: SCAN_BUTTON_OUTER,
    height: SCAN_BUTTON_OUTER,
    justifyContent: "center",
    alignItems: "center"
  },
  fabInner: {
    width: SCAN_BUTTON_OUTER,
    height: SCAN_BUTTON_OUTER,
    borderRadius: SCAN_BUTTON_OUTER / 2,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12
  },
  fabIcon: {
    fontSize: 32
  },
  fabAlt: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)"
  },
  fabAltIcon: {
    fontSize: 24
  },
  analyzePanel: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 8
  },
  panelLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center"
  },
  analyzeButtonPremium: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  },
  analyzeButtonPremiumDisabled: {
    opacity: 0.6
  },
  analyzeButtonIcon: {
    fontSize: 18
  },
  analyzeButtonText: {
    color: colors.textDark,
    fontWeight: "700",
    fontSize: 15
  },
  errorBanner: {
    backgroundColor: "rgba(248, 113, 113, 0.2)",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.4)"
  },
  errorIcon: {
    fontSize: 18
  },
  errorBannerText: {
    color: "rgba(248, 113, 113, 0.9)",
    fontSize: 13,
    fontWeight: "600",
    flex: 1
  },
  resultOverlay: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "flex-end"
  },
  resultSquare: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    maxHeight: SCREEN_HEIGHT * 0.45
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(26,26,26,0.1)"
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
  },
  resultCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    justifyContent: "center",
    alignItems: "center"
  },
  resultCloseBtnText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "700"
  },
  ingredientList: {
    maxHeight: 220
  },
  ingredientListContent: {
    paddingBottom: 8
  },
  ingredientChip: {
    backgroundColor: "rgba(255,255,255,0.8)",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 217, 61, 0.2)",
    marginBottom: 8,
    gap: 8
  },
  ingredientChipEmoji: {
    fontSize: 16
  },
  ingredientChipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flex: 1
  },
  modeToggleContainer: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 12,
    zIndex: 10
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)"
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  modeButtonIcon: {
    fontSize: 16
  },
  modeButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  barcodeStatus: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32
  },
  barcodeStatusText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12
  },
  productBrand: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16
  },
  nutritionItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255,255,255,0.4)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  nutritionLabel: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 4
  },
  nutritionValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  allergenBadge: {
    backgroundColor: "rgba(248, 113, 113, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger
  },
  allergenText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600"
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
