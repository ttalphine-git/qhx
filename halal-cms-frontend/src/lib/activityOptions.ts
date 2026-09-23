import {
  Factory,
  FlaskConical,
  Ham,
  Package,
  Scissors,
  ShoppingBasket,
  Sparkles,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react"

export type ActivityIconKey = "factory" | "scissors" | "meat" | "basket" | "sparkles" | "flask" | "truck" | "utensils" | "package"
export type ActivityCategorySetting = { key: string; label: string; icon: ActivityIconKey }
export type ActivityCategoryOption = ActivityCategorySetting & { Icon: LucideIcon }

export const ACTIVITY_CATEGORIES_STORAGE_KEY = "hcs_activity_categories"

export const ACTIVITY_ICON_OPTIONS: { key: ActivityIconKey; label: string; Icon: LucideIcon }[] = [
  { key: "factory", label: "Manufacturing", Icon: Factory },
  { key: "scissors", label: "Slaughter", Icon: Scissors },
  { key: "meat", label: "Meat Processing", Icon: Ham },
  { key: "basket", label: "Food", Icon: ShoppingBasket },
  { key: "sparkles", label: "Cosmetics", Icon: Sparkles },
  { key: "flask", label: "Pharma", Icon: FlaskConical },
  { key: "truck", label: "Logistics", Icon: Truck },
  { key: "utensils", label: "Restaurant", Icon: UtensilsCrossed },
  { key: "package", label: "Other", Icon: Package },
]

const ICON_BY_KEY = Object.fromEntries(ACTIVITY_ICON_OPTIONS.map(i => [i.key, i.Icon])) as Record<ActivityIconKey, LucideIcon>

export const DEFAULT_ACTIVITY_CATEGORY_SETTINGS: ActivityCategorySetting[] = [
  { key: "mfg", label: "Manufacturing", icon: "factory" },
  { key: "slaughter", label: "Slaughterhouse", icon: "scissors" },
  { key: "meat-processing", label: "Meat Processing", icon: "meat" },
]

export function loadActivityCategorySettings(): ActivityCategorySetting[] {
  try {
    const raw = JSON.parse(localStorage.getItem(ACTIVITY_CATEGORIES_STORAGE_KEY) || "[]")
    if (Array.isArray(raw) && raw.length > 0) {
      return raw
        .filter((c): c is ActivityCategorySetting => !!c?.key && !!c?.label)
        .map(c => ({ key: c.key, label: c.label, icon: ICON_BY_KEY[c.icon as ActivityIconKey] ? c.icon : "package" }))
    }
  } catch {}
  return DEFAULT_ACTIVITY_CATEGORY_SETTINGS
}

export function saveActivityCategorySettings(categories: ActivityCategorySetting[]) {
  localStorage.setItem(ACTIVITY_CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
}

export function getActivityCategories(): ActivityCategoryOption[] {
  return loadActivityCategorySettings().map(c => ({ ...c, Icon: ICON_BY_KEY[c.icon] ?? Package }))
}

export const ACTIVITY_CATEGORIES = getActivityCategories()

export const SPECIFIC_ACTIVITIES = [
  { key: "dairy", label: "Dairy", emoji: "🥛" },
  { key: "eggs", label: "Eggs & Egg Processing", emoji: "🥚" },
  { key: "meat", label: "Meat & Poultry", emoji: "🥩" },
  { key: "seafood", label: "Seafood Processing", emoji: "🐟" },
  { key: "baking", label: "Baking Ingredients", emoji: "🍞" },
  { key: "confectionery", label: "Confectionery & Chocolate", emoji: "🍫" },
  { key: "readymeals", label: "Ready-to-Eat Meals", emoji: "🍱" },
  { key: "vegetarian", label: "Vegetarian Products", emoji: "🥗" },
  { key: "vegan", label: "Vegan Products", emoji: "🌱" },
  { key: "beverages", label: "Beverages or Juices", emoji: "🥤" },
  { key: "oils", label: "Oils & Fats", emoji: "🫒" },
  { key: "spices", label: "Spices and Sauces", emoji: "🌶️" },
  { key: "flavoring", label: "Flavoring & Additives", emoji: "🍬" },
  { key: "supplements", label: "Supplements", emoji: "💊" },
  { key: "nutraceuticals", label: "Nutraceuticals", emoji: "🌿" },
  { key: "chemicals", label: "(Synthetic) Chemicals", emoji: "🧪" },
  { key: "meddevices", label: "Medical Devices", emoji: "🩺" },
  { key: "cosmeticprod", label: "Cosmetic Products", emoji: "💄" },
  { key: "skincare", label: "Skincare & Bodycare", emoji: "🧼" },
  { key: "haircare", label: "Hair Care", emoji: "💇" },
  { key: "fragrance", label: "Perfume & Fragrance", emoji: "🌸" },
  { key: "animalfeed", label: "Animal Feed", emoji: "🐾" },
  { key: "packaging", label: "Packaging & Materials", emoji: "📦" },
  { key: "privatelabel", label: "Trading / Private Label", emoji: "🏷️" },
  { key: "slaughter", label: "Slaughterhouse", emoji: "🔪" },
  { key: "warehousing", label: "Warehousing & Storage", emoji: "🏢" },
  { key: "coldchain", label: "Cold Chain Logistics", emoji: "🧊" },
  { key: "importexport", label: "Import / Export", emoji: "🚢" },
  { key: "restaurant", label: "Restaurant & Café", emoji: "☕" },
  { key: "bakery", label: "Bakery & Patisserie", emoji: "🥐" },
  { key: "catering", label: "Catering", emoji: "🍽️" },
  { key: "hotel", label: "Hotel & Hospitality", emoji: "🏨" },
  { key: "canteen", label: "Canteen / Institutional", emoji: "🏫" },
  { key: "cleaning", label: "Cleaning Detergents", emoji: "🧴" },
  { key: "cleaningservice", label: "Cleaning Services", emoji: "🧹" },
  { key: "sanitization", label: "Sanitization Products", emoji: "🫧" },
]
