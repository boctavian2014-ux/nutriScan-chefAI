import axios from "axios";

const OFF_API = axios.create({
  baseURL: "https://world.openfoodfacts.org/api/v0",
  timeout: 5000,
});

interface ProductData {
  id: string;
  name: string;
  ingredients: string[];
  allergens: string[];
  nutritionFacts: {
    energy: number;
    fat: number;
    carbs: number;
    protein: number;
  };
  barcode: string;
}

export const searchByBarcode = async (barcode: string): Promise<ProductData | null> => {
  try {
    const response = await OFF_API.get(`/product/${barcode}.json`);
    const product = response.data.product;

    if (!product) return null;

    return {
      id: barcode,
      name: product.product_name || "Unknown Product",
      ingredients: parseIngredients(product.ingredients_text),
      allergens: product.allergens_tags || [],
      nutritionFacts: {
        energy: product.nutriments?.["energy-kcal"] || 0,
        fat: product.nutriments?.fat || 0,
        carbs: product.nutriments?.carbohydrates || 0,
        protein: product.nutriments?.proteins || 0,
      },
      barcode,
    };
  } catch (error) {
    console.error("OpenFoodFacts lookup failed:", error);
    return null;
  }
};

export const searchByProductName = async (
  name: string,
  country: string = "RO"
): Promise<ProductData[]> => {
  try {
    const response = await OFF_API.get("/cgi/search.pl", {
      params: {
        search_terms: name,
        search_simple: 1,
        action: "process",
        fields: "code,product_name,ingredients_text,allergens_tags,nutriments",
        json: 1,
        country: country,
      },
    });

    return (response.data.products || [])
      .slice(0, 5)
      .map((p: any) => ({
        id: p.code,
        name: p.product_name || "Unknown",
        ingredients: parseIngredients(p.ingredients_text),
        allergens: p.allergens_tags || [],
        nutritionFacts: {
          energy: p.nutriments?.["energy-kcal"] || 0,
          fat: p.nutriments?.fat || 0,
          carbs: p.nutriments?.carbohydrates || 0,
          protein: p.nutriments?.proteins || 0,
        },
        barcode: p.code,
      }));
  } catch (error) {
    console.error("Product search failed:", error);
    return [];
  }
};

function parseIngredients(ingredientText: string | undefined): string[] {
  if (!ingredientText) return [];
  return ingredientText
    .split(",")
    .map((ing) => ing.trim())
    .filter((ing) => ing.length > 0);
}

// Language-specific ingredient translation mapping
export const ingredientTranslations: Record<string, Record<string, string>> = {
  en: {
    "water": "Water",
    "salt": "Salt",
    "sugar": "Sugar",
    "wheat": "Wheat",
    "milk": "Milk",
    "eggs": "Eggs",
  },
  ro: {
    "water": "Apă",
    "salt": "Sare",
    "sugar": "Zahăr",
    "wheat": "Grâu",
    "milk": "Lapte",
    "eggs": "Ouă",
  },
  bg: {
    "water": "Вода",
    "salt": "Сол",
    "sugar": "Захар",
    "wheat": "Пшеница",
    "milk": "Мляко",
    "eggs": "Яйца",
  },
};

export const translateIngredients = (
  ingredients: string[],
  targetLanguage: "en" | "ro" | "bg"
): string[] => {
  const translations = ingredientTranslations[targetLanguage] || {};
  
  return ingredients.map((ing) => {
    const normalized = ing.toLowerCase().trim();
    return translations[normalized] || ing;
  });
};
