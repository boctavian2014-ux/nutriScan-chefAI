import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');
const CARD_SPACING = 20;

type Recipe = {
  id: string;
  title: string;
  time: string;
  image: string;
  category?: string;
};

const RECIPES: Recipe[] = [
  { id: '1', title: 'Pasta Primavera', time: '20 min', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e', category: 'Prânz' },
  { id: '2', title: 'Zest Salmon', time: '15 min', image: 'https://images.unsplash.com/photo-1541542684-1b63f0f5bbdf', category: 'Cină' },
  { id: '3', title: 'Avocado Toast Deluxe', time: '10 min', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141', category: 'Mic dejun' },
  { id: '4', title: 'Chocolate Lava Cake', time: '35 min', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87', category: 'Desert' },
  { id: '5', title: 'Quick Ramen', time: '12 min', image: 'https://images.unsplash.com/photo-1543353071-087092ec393a', category: 'Cină' },
  { id: '6', title: 'Green Smoothie Bowl', time: '8 min', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd', category: 'Mic dejun' },
];

const CATEGORIES = ['Toate', 'Mic dejun', 'Prânz', 'Cină', 'Desert'];

const Particle = ({ anim }: { anim: Animated.ValueXY }) => {
  const opacity = anim.y.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] });
  const left = anim.x;
  const top = anim.y;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.accent,
        transform: [{ translateX: left }, { translateY: top }],
        opacity,
      }}
    />
  );
};

export const FavoritesScreen: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(RECIPES);
  const [selectedCategory, setSelectedCategory] = useState<string>('Toate');
  const [burstState, setBurstState] = useState<Record<string, boolean>>({});

  // For cheap masonry effect: compute variable heights
  const cardHeights = useRef<Record<string, number>>({});
  useEffect(() => {
    recipes.forEach((r, i) => {
      const base = 180 + ((parseInt(r.id, 10) * 37) % 90);
      cardHeights.current[r.id] = base;
    });
  }, []);

  const filtered = recipes.filter(r => selectedCategory === 'Toate' || r.category === selectedCategory);

  const triggerUnlike = (id: string, onDone: () => void) => {
    setBurstState(s => ({ ...s, [id]: true }));
    setTimeout(() => {
      setRecipes(prev => prev.filter(p => p.id !== id));
      setBurstState(s => ({ ...s, [id]: false }));
      onDone();
    }, 650);
  };

  const renderItem = ({ item, index }: { item: Recipe; index: number }) => {
    const height = cardHeights.current[item.id] ?? 200;
    return (
      <View style={[styles.recipeCard, { height }]}>
        <ImageBackground source={{ uri: item.image }} style={styles.cardImage} imageStyle={{ borderRadius: 18 }}>
          <BlurView intensity={60} tint="dark" style={styles.timeBadge}>
            <Text style={styles.timeText}>⏱️ {item.time}</Text>
          </BlurView>

          <View style={styles.cardFooter} pointerEvents="box-none">
            <BlurView intensity={80} tint="light" style={styles.footerBlur}>
              <Text style={styles.recipeTitle} numberOfLines={1}>{item.title}</Text>
              <HeartButton id={item.id} onUnlike={() => triggerUnlike(item.id, () => {})} />
            </BlurView>
          </View>

          {burstState[item.id] && <HeartBurst />}
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>The Recipe Vault</Text>

      <TouchableOpacity style={styles.aiBanner} activeOpacity={0.9}>
        <Text style={styles.aiBannerText}>🍳 Chef AI: Ai toate ingredientele pentru 3 rețete din favorite!</Text>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={{ paddingRight: 16 }}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, selectedCategory === cat && styles.chipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
      />
    </View>
  );
};

const HeartButton: React.FC<{ id: string; onUnlike: () => void }> = ({ id, onUnlike }) => {
  const [liked, setLiked] = useState(true);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (liked) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.85, duration: 90, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      ]).start(() => {
        setLiked(false);
        onUnlike();
      });
    } else {
      setLiked(true);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={handlePress} style={styles.heartButton}>
        <Text style={{ fontSize: 18 }}>{liked ? '💛' : '🤍'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HeartBurst: React.FC = () => {
  const particles = useRef<Animated.ValueXY[]>([]).current;
  const containerAnim = useRef(new Animated.Value(0)).current;

  if (particles.length === 0) {
    for (let i = 0; i < 10; i++) particles.push(new Animated.ValueXY({ x: 0, y: 0 }));
  }

  useEffect(() => {
    const anims = particles.map((p, i) => {
      const angle = (i / particles.length) * Math.PI * 2;
      const radius = 20 + Math.random() * 30;
      const toX = Math.cos(angle) * radius;
      const toY = Math.sin(angle) * radius * -1;
      return Animated.timing(p, {
        toValue: { x: toX, y: toY },
        duration: 420 + Math.random() * 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      });
    });

    Animated.parallel([
      Animated.timing(containerAnim, { toValue: 1, duration: 1, useNativeDriver: true }),
      Animated.stagger(12, anims),
    ]).start();
  }, []);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
      {particles.map((p, i) => (
        <Particle key={i} anim={p} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 16, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', marginBottom: 12 },

  aiBanner: { backgroundColor: '#FFFBE8', padding: 12, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#FFE58A' },
  aiBannerText: { color: '#6B4E00', fontWeight: '700' },

  chipsRow: { marginBottom: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#FFF', borderRadius: 999, marginRight: 8, borderWidth: 1, borderColor: '#F0F0F0' },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: 'transparent' },
  chipText: { color: '#666' },
  chipTextActive: { color: '#1A1A1A', fontWeight: '800' },

  row: { justifyContent: 'space-between', marginBottom: CARD_SPACING / 2 },
  recipeCard: { width: (width - 16 * 2 - CARD_SPACING) / 2, marginBottom: CARD_SPACING },
  cardImage: { flex: 1, justifyContent: 'space-between', padding: 12, borderRadius: 18, overflow: 'hidden' },

  timeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', overflow: 'hidden' },
  timeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  cardFooter: { borderRadius: 14, overflow: 'hidden' },
  footerBlur: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.6)' },
  recipeTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  heartButton: { marginLeft: 8 },
});

export default FavoritesScreen;
