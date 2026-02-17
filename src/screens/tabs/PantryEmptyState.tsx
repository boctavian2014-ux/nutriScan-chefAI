import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import GlassCard from '../../components/GlassCard';
import { colors } from '../../constants/theme';

type Props = {
  onStartScan?: () => void;
};

const PantryEmptyState: React.FC<Props> = ({ onStartScan }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.03, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale]);

  return (
    <View style={styles.container}>
      <View style={styles.illustrationContainer}>
        <Animated.View style={[styles.lemonBody, { transform: [{ scale }, { rotate: '-15deg' }] }]} />
        <View style={styles.leaf} />
        <View style={styles.thoughtCloud}>
          <Text style={styles.cloudEmoji}>🍕</Text>
        </View>
      </View>

      <Text style={styles.title}>Cămara e goală</Text>
      <Text style={styles.description}>
        Zest are nevoie de câteva ingrediente ca să poată crea rețete pentru tine.
      </Text>

      <GlassCard style={styles.guideCard}>
        <Text style={styles.guideText}>💡 Sfat: Începe cu ce ai în frigider (ouă, lapte, legume).</Text>
      </GlassCard>

      <TouchableOpacity style={styles.ctaButton} onPress={onStartScan} activeOpacity={0.85}>
        <Text style={styles.ctaText}>Scanează Primul Ingredient</Text>
        <Text style={{ fontSize: 18, marginLeft: 8 }}>📸</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: colors.background || '#F8F9FA'
  },
  illustrationContainer: { marginBottom: 40, alignItems: 'center', width: 160, height: 160 },
  lemonBody: {
    width: 120,
    height: 150,
    backgroundColor: colors.primary,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 10
  },
  eyeLeft: { position: 'absolute', top: 70, left: 40, width: 8, height: 2, backgroundColor: '#1A1A1A' },
  eyeRight: { position: 'absolute', top: 70, right: 40, width: 8, height: 2, backgroundColor: '#1A1A1A' },
  smile: { position: 'absolute', bottom: 40, width: 20, height: 10, borderBottomWidth: 2, borderColor: '#1A1A1A', borderRadius: 10 },
  leaf: {
    position: 'absolute',
    top: -10,
    right: 20,
    width: 30,
    height: 40,
    backgroundColor: colors.secondary,
    borderRadius: 20,
    transform: [{ rotate: '45deg' }]
  },
  thoughtCloud: {
    position: 'absolute',
    top: -30,
    right: -20,
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 20,
    elevation: 5
  },
  cloudEmoji: { fontSize: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text || '#1A1A1A', marginBottom: 12 },
  description: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  guideCard: { padding: 15, marginBottom: 40, width: '100%' },
  guideText: { fontSize: 14, color: '#444', textAlign: 'center' },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: 'center'
  },
  ctaText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});

export default PantryEmptyState;
