import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { colors } from '../constants/theme';

type Ingredient = {
  name?: string;
  emoji?: string;
};

type Props = {
  ingredient?: Ingredient;
};

const IngredientConfirmation = ({ ingredient }: Props) => {
  const snapPoints = useMemo(() => ['40%', '65%'], []);

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.emoji}>{ingredient?.emoji || '🍅'}</Text>
          </View>
          <View>
            <Text style={styles.title}>{ingredient?.name || 'Roșie Cherry'}</Text>
            <Text style={styles.confidence}>Confirmat de Zest.ai • 98%</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>18</Text>
            <Text style={styles.statLabel}>kcal</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statValue}>3.9g</Text>
            <Text style={styles.statLabel}>Carbs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>Pro</Text>
            <Text style={styles.statLabel}>Sănătos</Text>
          </View>
        </View>

        <View style={styles.actionArea}>
          <TouchableOpacity style={styles.mainButton}>
            <Text style={styles.mainButtonText}>Adaugă în Pantry</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Gătește ceva cu asta 👨‍🍳</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  handle: {
    backgroundColor: '#DDD',
    width: 50,
  },
  content: {
    padding: 24,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emoji: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  confidence: { fontSize: 12, color: '#6BCB77', fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 15,
    marginBottom: 30,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#EEE' },
  statValue: { fontWeight: '700', fontSize: 16, color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#888' },
  actionArea: { gap: 12 },
  mainButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainButtonText: { fontWeight: '800', fontSize: 16, color: '#1A1A1A' },
  secondaryButton: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: { fontWeight: '700', fontSize: 16, color: '#1A1A1A' },
});

export default IngredientConfirmation;
