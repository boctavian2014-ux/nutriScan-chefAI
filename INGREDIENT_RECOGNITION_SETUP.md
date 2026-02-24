# 🥗 Ingredient Recognition Implementation Guide

## What OpenFoodFacts Covers

✅ **1M+ products** in Romanian and Bulgarian supermarkets (Lidl, Kaufland, Carrefour, etc.)
✅ **Ingredients** - Full list in multiple languages
✅ **Allergens** - Flagged automatically
✅ **Nutrition facts** - Energy, fat, carbs, protein
✅ **Barcodes** - UPC/EAN lookups
✅ **Free & Open Source** - No API key needed

---

## Implementation Steps

### Phase 1: Mobile Barcode Scanner (2 hours)

```bash
# 1. Install barcode scanner
cd c:\Users\octav\nutrilens\mobile
npx expo install expo-barcode-scanner

# 2. Update ScanScreen.tsx to add barcode mode
```

**Add to ScanScreen.tsx:**
```tsx
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useMutation } from '@tanstack/react-query';

const [barcodeScanned, setBarcodeScanned] = useState(false);
const [mode, setMode] = useState<'barcode' | 'image'>('barcode');

const barcodeMutation = useMutation({
  mutationFn: (barcode: string) =>
    fetch(`http://192.168.1.101:4000/api/scans/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barcode,
        language: i18n.language,
        userId: user?.id,
      }),
    }).then(r => r.json()),
  onSuccess: (data) => {
    // Display product with ingredients
    setResult(data.product);
  },
});

const handleBarCodeScanned = ({ data }: { data: string }) => {
  setBarcodeScanned(true);
  barcodeMutation.mutate(data);
};
```

---

### Phase 2: Backend Recognize Endpoint (2 hours)

Create `/server/src/routes/scans.ts` (or update existing):

```typescript
import express from 'express';
import { searchByBarcode, translateIngredients } from '../integrations/openFoodFacts';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.post('/recognize', asyncHandler(async (req, res) => {
  const { barcode, language, userId } = req.body;

  // 1. Lookup product in OpenFoodFacts
  const product = await searchByBarcode(barcode);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // 2. Translate ingredients to user's language
  const translatedIngredients = translateIngredients(
    product.ingredients,
    language as 'en' | 'ro' | 'bg'
  );

  // 3. Check health profile for allergens
  let healthWarnings: string[] = [];
  if (userId) {
    // Fetch user's allergies and check against product allergens
    const userProfile = await prisma.healthProfile.findFirst({
      where: { userId },
    });
    
    if (userProfile?.allergies) {
      const allergies = userProfile.allergies.split(',').map(a => a.toLowerCase());
      product.allergens.forEach(allergen => {
        if (allergies.includes(allergen.toLowerCase())) {
          healthWarnings.push(`⚠️ Contains ${allergen} (allergen in your profile)`);
        }
      });
    }
  }

  // 4. Save scan to database
  await prisma.scan.create({
    data: {
      userId,
      productBarcode: barcode,
      productName: product.name,
      ingredients: translatedIngredients.join(', '),
      allergens: product.allergens.join(', '),
      imagePath: null,
    },
  });

  res.json({
    success: true,
    product: {
      ...product,
      ingredients: translatedIngredients,
    },
    healthWarnings,
  });
}));

export default router;
```

---

### Phase 3: Mobile UI Display (1 hour)

Update `IngredientDetailScreen.tsx` to show:
- ✅ Product name
- ✅ Ingredients (localized)
- ✅ Allergen warnings
- ✅ Nutrition facts
- ✅ Add to pantry button

---

## Testing Workflow

1. **Test Product**: Use a Romanian/Bulgarian product barcode
   - Example: "5948497163506" (a Romanian snack)

2. **Scan with mobile app**:
   - Tap Scan tab
   - Point camera at barcode
   - App should display product + ingredients in RO/BG

3. **Verify translation**:
   - Switch language in profile
   - Scan same product again
   - Ingredients should show in new language

---

## Supermarket Coverage

| Store | Country | Coverage | Notes |
|-------|---------|----------|-------|
| Lidl | RO, BG | 95%+ | Most products in OpenFoodFacts |
| Kaufland | RO, BG | 90%+ | Good coverage |
| Carrefour | RO, BG | 85%+ | Many private label items missing |
| Billa | BG | 80%+ | Growing coverage |

**If product not found**: User can manually add ingredients (manual entry fallback)

---

## Advanced Features (Phase 2)

- [ ] Image recognition for products without visible barcode
- [ ] QR code scanning
- [ ] Batch product import (multiple items at once)  
- [ ] Supermarket price comparison
- [ ] Recipe suggestions based on scanned pantry
- [ ] Health coach tips (low sodium, high protein, etc.)

---

## Dependencies to Install

```bash
# Server
cd server
npm install axios  # For OpenFoodFacts API calls

# Mobile
cd mobile
npx expo install expo-barcode-scanner
```

---

## Current Status

- ✅ `openFoodFacts.ts` integration created
- ⏳ Barcode scanner UI (needs implementation)
- ⏳ `/api/scans/recognize` endpoint (needs implementation)
- ⏳ Mobile integration (needs implementation)

**ETA to MVP: 5-6 hours of development**
