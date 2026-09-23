import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus, X, MapPin, Pencil, Trash2, ChevronDown,
  Factory as FactoryIcon, Layers, TrendingUp,
  Package, ArrowLeft, ChevronRight, Map, Camera, Eye,
  Barcode, FlaskConical,
} from "lucide-react"
import CustomerLayout from "./CustomerLayout"
import { C } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { loginUser, registerUser } from "@/api/auth"
import { getActivityCategories, SPECIFIC_ACTIVITIES } from "@/lib/activityOptions"
import { createCompany, getMyCompany } from "@/api/companies"
import type { UserDto } from "@/types"
import {
  createFactory as apiCreateFactory,
  deleteFactory as apiDeleteFactory,
  getFactories,
  updateFactory as apiUpdateFactory,
  type Factory as ApiFactory,
} from "@/api/factories"
import {
  createProduct as apiCreateProduct,
  deleteProduct as apiDeleteProduct,
  getProducts,
  updateProduct as apiUpdateProduct,
  type Product as ApiProduct,
} from "@/api/products"

const BLUE  = "#2563eb"
const DARK  = "#111827"
const GREEN = "#16a34a"
const RED   = "#dc2626"

// ─── Factory types ─────────────────────────────────────────────────────────────
const VOL_UNITS   = ["kg","tonnes","litres","units","pallets","containers"]

const COUNTRIES = [
  "Malaysia","Indonesia","Singapore","Brunei","Thailand","Philippines",
  "Vietnam","Myanmar","Cambodia","Bangladesh","India","Sri Lanka",
  "United Arab Emirates","Saudi Arabia","Qatar","Kuwait","Bahrain","Oman",
  "Jordan","Egypt","Turkey","Pakistan",
  "United Kingdom","France","Germany","Netherlands","Belgium","Spain","Italy",
  "United States","Canada","Australia","China","Japan","South Korea",
  "Nigeria","South Africa","Kenya","Others",
]
const COUNTRY_CENTERS: Record<string,[string,string]> = {
  "Malaysia":["3.1390","101.6869"],"Indonesia":["-6.2088","106.8456"],
  "Singapore":["1.3521","103.8198"],"Brunei":["4.5353","114.7277"],
  "Thailand":["13.7563","100.5018"],"Philippines":["14.5995","120.9842"],
  "Vietnam":["10.8231","106.6297"],"Myanmar":["16.8661","96.1951"],
  "Bangladesh":["23.6850","90.3563"],"India":["20.5937","78.9629"],
  "Sri Lanka":["7.8731","80.7718"],"United Arab Emirates":["23.4241","53.8478"],
  "Saudi Arabia":["23.8859","45.0792"],"Qatar":["25.2854","51.5310"],
  "Kuwait":["29.3759","47.9774"],"Bahrain":["26.0667","50.5577"],
  "Oman":["21.4735","55.9754"],"Jordan":["30.5852","36.2384"],
  "Egypt":["26.8206","30.8025"],"Turkey":["38.9637","35.2433"],
  "Pakistan":["30.3753","69.3451"],"United Kingdom":["51.5074","-0.1278"],
  "France":["46.2276","2.2137"],"Germany":["51.1657","10.4515"],
  "Netherlands":["52.1326","5.2913"],"Belgium":["50.5039","4.4699"],
  "Spain":["40.4168","-3.7038"],"Italy":["41.9028","12.4964"],
  "United States":["37.0902","-95.7129"],"Canada":["56.1304","-106.3468"],
  "Australia":["-25.2744","133.7751"],"China":["35.8617","104.1954"],
  "Japan":["36.2048","138.2529"],"South Korea":["35.9078","127.7669"],
  "Nigeria":["9.0820","8.6753"],"South Africa":["-30.5595","22.9375"],
  "Kenya":["-0.0236","37.9062"],"Others":["3.1390","101.6869"],
}

interface CertUpload { type:string; fileName:string; fileSize:number; fileData?:string }
const CERT_TYPES = [
  "Halal Certificate","ISO 9001 — Quality Management",
  "ISO 22000 / FSSC 22000 — Food Safety","GMP Certificate",
  "HACCP Certificate","Organic Certification",
  "ISO 14001 — Environmental","BRCGS / SQF","Others",
]
interface Factory {
  id:string; name:string; country:string; city:string; address:string
  lat:string; lng:string; prodLines:string; prodVolume:string; volUnit:string
  activityCategories:string[]; specificActivities:string[]
  certUploads:CertUpload[]; photo?:string
}
const DEFAULT_FORM: Omit<Factory,"id"> = {
  name:"",country:"Malaysia",city:"",address:"",lat:"3.1390",lng:"101.6869",
  prodLines:"0",prodVolume:"0",volUnit:"kg",activityCategories:[],specificActivities:[],certUploads:[],photo:"",
}
function loadFactories(): Factory[] {
  return []
}

// ─── Product types ─────────────────────────────────────────────────────────────
interface IngredientRow { id:string;name:string;certFile?:string;certName?:string }
interface StoredProduct {
  id:string;catalogKey:string;emoji:string;name:string
  code:string;barcode:string;factoryId:string;ingredients:IngredientRow[]
  addedAt:string;photo?:string
}
interface CatalogItem { key:string;cat:string;name:string;emoji:string;ing:string[] }

const CATALOG: CatalogItem[] = [
  {key:"chicken-processed",cat:"Meat & Seafood",name:"Processed Chicken",emoji:"🍗",ing:["Chicken (Halal slaughtered)","Salt","Seasoning","Preservatives (E202)"]},
  {key:"beef-processed",cat:"Meat & Seafood",name:"Processed Beef",emoji:"🥩",ing:["Beef (Halal slaughtered)","Salt","Spices","Citric Acid (E330)"]},
  {key:"fish-fillet",cat:"Meat & Seafood",name:"Fish Fillet",emoji:"🐟",ing:["Fish","Salt","Sodium Tripolyphosphate","Water"]},
  {key:"shrimp-processed",cat:"Meat & Seafood",name:"Processed Shrimp",emoji:"🦐",ing:["Shrimp","Salt","Sodium Metabisulphite (E223)","Water"]},
  {key:"canned-tuna",cat:"Meat & Seafood",name:"Canned Tuna",emoji:"🐠",ing:["Tuna","Vegetable Oil","Salt","Water"]},
  {key:"frozen-chicken",cat:"Meat & Seafood",name:"Frozen Chicken",emoji:"🐔",ing:["Whole Chicken (Halal slaughtered)","Water","Salt"]},
  {key:"wheat-flour",cat:"Grains & Cereals",name:"Wheat Flour",emoji:"🌾",ing:["Wheat","Niacin (B3)","Iron","Thiamine (B1)","Riboflavin (B2)","Folic Acid"]},
  {key:"white-rice",cat:"Grains & Cereals",name:"White Rice",emoji:"🍚",ing:["Rice"]},
  {key:"instant-noodles",cat:"Grains & Cereals",name:"Instant Noodles",emoji:"🍜",ing:["Wheat Flour","Palm Oil","Salt","Tapioca Starch","Seasoning Powder"]},
  {key:"pasta",cat:"Grains & Cereals",name:"Pasta",emoji:"🍝",ing:["Durum Wheat Semolina","Water","Egg (optional)"]},
  {key:"bread-loaf",cat:"Grains & Cereals",name:"Bread",emoji:"🍞",ing:["Wheat Flour","Water","Yeast","Salt","Sugar","Vegetable Oil","Improver (E471)"]},
  {key:"breakfast-cereal",cat:"Grains & Cereals",name:"Breakfast Cereal",emoji:"🥣",ing:["Whole Grain Wheat","Sugar","Salt","Malt Extract","Vitamins (B1,B2,B3,B6,D)","Iron"]},
  {key:"fresh-milk",cat:"Dairy & Eggs",name:"Fresh Milk",emoji:"🥛",ing:["Pasteurised Whole Milk","Vitamin A","Vitamin D3"]},
  {key:"uht-milk",cat:"Dairy & Eggs",name:"UHT Milk",emoji:"🧃",ing:["Skimmed Milk Powder","Water","Sugar","Vegetable Oil","Minerals","Vitamins"]},
  {key:"yogurt",cat:"Dairy & Eggs",name:"Yogurt",emoji:"🍦",ing:["Whole Milk","Sugar","Live Cultures (S. thermophilus)","Pectin (E440)"]},
  {key:"processed-cheese",cat:"Dairy & Eggs",name:"Processed Cheese",emoji:"🧀",ing:["Cheddar Cheese","Water","Emulsifying Salts (E331)","Salt","Colour (Annatto E160b)"]},
  {key:"ice-cream",cat:"Dairy & Eggs",name:"Ice Cream",emoji:"🍨",ing:["Whole Milk","Sugar","Cream","Skim Milk Powder","Glucose Syrup","Emulsifier (E471)","Vanilla Flavour"]},
  {key:"butter",cat:"Dairy & Eggs",name:"Butter",emoji:"🧈",ing:["Cream (from Cow Milk)","Salt"]},
  {key:"mineral-water",cat:"Beverages",name:"Mineral Water",emoji:"💧",ing:["Natural Mineral Water"]},
  {key:"fruit-juice",cat:"Beverages",name:"Fruit Juice",emoji:"🧃",ing:["Fruit Juice (100%)","Citric Acid (E330)","Ascorbic Acid (Vitamin C)"]},
  {key:"carbonated-drink",cat:"Beverages",name:"Carbonated Drink",emoji:"🥤",ing:["Carbonated Water","Sugar","Citric Acid (E330)","Natural Flavouring","Colour (E150d)"]},
  {key:"green-tea",cat:"Beverages",name:"Green Tea",emoji:"🍵",ing:["Green Tea Leaves","Water"]},
  {key:"instant-coffee",cat:"Beverages",name:"Instant Coffee",emoji:"☕",ing:["Coffee Extract","Sugar","Hydrogenated Vegetable Fat","Skimmed Milk Powder","Emulsifier (E471)"]},
  {key:"soy-milk",cat:"Beverages",name:"Soy Milk",emoji:"🥛",ing:["Filtered Water","Soy Beans","Sugar","Calcium Carbonate","Sea Salt","Natural Flavour"]},
  {key:"energy-drink",cat:"Beverages",name:"Energy Drink",emoji:"⚡",ing:["Water","Sugar","Citric Acid","Taurine","Caffeine","Niacin (B3)","Pantothenic Acid (B5)"]},
  {key:"chocolate-bar",cat:"Confectionery & Snacks",name:"Chocolate Bar",emoji:"🍫",ing:["Sugar","Cocoa Butter","Cocoa Mass","Milk Powder","Emulsifier (Lecithin E322)","Vanilla Flavour"]},
  {key:"candy-hard",cat:"Confectionery & Snacks",name:"Hard Candy",emoji:"🍬",ing:["Sugar","Glucose Syrup","Citric Acid (E330)","Natural Flavouring","Colour (E102)"]},
  {key:"cookies",cat:"Confectionery & Snacks",name:"Cookies & Biscuits",emoji:"🍪",ing:["Wheat Flour","Sugar","Vegetable Fat","Eggs","Salt","Baking Soda","Vanilla Flavour"]},
  {key:"potato-chips",cat:"Confectionery & Snacks",name:"Potato Chips",emoji:"🥨",ing:["Potatoes","Vegetable Oil","Salt","Flavouring"]},
  {key:"cake",cat:"Confectionery & Snacks",name:"Cake",emoji:"🎂",ing:["Wheat Flour","Sugar","Eggs","Vegetable Oil","Milk","Baking Powder","Salt","Vanilla Extract"]},
  {key:"wafer",cat:"Confectionery & Snacks",name:"Wafer Biscuit",emoji:"🍘",ing:["Wheat Flour","Vegetable Fat","Sugar","Cocoa Powder","Salt","Emulsifier (E322)"]},
  {key:"chili-sauce",cat:"Condiments & Sauces",name:"Chili Sauce",emoji:"🌶️",ing:["Chili","Sugar","Vinegar","Salt","Modified Starch (E1442)","Garlic"]},
  {key:"soy-sauce",cat:"Condiments & Sauces",name:"Soy Sauce",emoji:"🫙",ing:["Water","Soy Beans","Wheat","Salt","Sugar","Caramel Colour (E150d)"]},
  {key:"tomato-ketchup",cat:"Condiments & Sauces",name:"Tomato Ketchup",emoji:"🍅",ing:["Tomatoes (Paste)","Sugar","Vinegar","Salt","Spices","Onion Powder"]},
  {key:"cooking-oil",cat:"Condiments & Sauces",name:"Cooking Oil",emoji:"🫒",ing:["Refined Palm Oil","Antioxidant (E307)","Antioxidant (E321)"]},
  {key:"margarine",cat:"Condiments & Sauces",name:"Margarine",emoji:"🧈",ing:["Vegetable Oil","Water","Salt","Emulsifier (E471)","Colour (Beta-Carotene E160a)","Vitamins A, D"]},
  {key:"spice-blend",cat:"Condiments & Sauces",name:"Spice Blend",emoji:"🌿",ing:["Salt","Spices","Monosodium Glutamate (E621)","Sugar","Starch"]},
  {key:"tofu",cat:"Plant-Based",name:"Tofu",emoji:"🫘",ing:["Soy Beans","Water","Coagulant (Calcium Sulphate E516)"]},
  {key:"tempeh",cat:"Plant-Based",name:"Tempeh",emoji:"🫘",ing:["Soy Beans","Tempeh Starter (Rhizopus oligosporus)"]},
  {key:"vegetable-snack",cat:"Plant-Based",name:"Vegetable Snack",emoji:"🥗",ing:["Mixed Vegetables","Sunflower Oil","Salt","Spices"]},
  {key:"vegan-protein",cat:"Plant-Based",name:"Vegan Protein Powder",emoji:"🌱",ing:["Pea Protein Isolate","Brown Rice Protein","Natural Flavour","Stevia"]},
  {key:"almond-milk",cat:"Plant-Based",name:"Almond Milk",emoji:"🥜",ing:["Water","Almonds","Calcium Carbonate","Sea Salt","Natural Flavour","Vitamins (E, B2, B12, D)"]},
  {key:"shampoo",cat:"Cosmetics & Personal Care",name:"Shampoo",emoji:"💇",ing:["Water","Sodium Laureth Sulphate (SLES)","Cocamidopropyl Betaine","Glycerin","Fragrance","Citric Acid","Preservative"]},
  {key:"body-lotion",cat:"Cosmetics & Personal Care",name:"Body Lotion",emoji:"🧴",ing:["Water","Glycerin","Petrolatum","Stearic Acid","Triethanolamine","Fragrance","Preservative (Phenoxyethanol)"]},
  {key:"face-cream",cat:"Cosmetics & Personal Care",name:"Face Cream",emoji:"🫙",ing:["Water","Shea Butter","Niacinamide","Glycerin","Cetearyl Alcohol","Fragrance","Phenoxyethanol"]},
  {key:"lipstick",cat:"Cosmetics & Personal Care",name:"Lipstick",emoji:"💄",ing:["Castor Oil","Plant Wax","Carnauba Wax","Synthetic Wax","Pigments","Vitamin E","Fragrance"]},
  {key:"perfume",cat:"Cosmetics & Personal Care",name:"Perfume",emoji:"🌸",ing:["Ethanol","Fragrance Compounds","Water","Benzyl Alcohol","Linalool"]},
  {key:"toothpaste",cat:"Cosmetics & Personal Care",name:"Toothpaste",emoji:"🦷",ing:["Water","Hydrated Silica","Glycerin","Sorbitol","Sodium Lauryl Sulphate","Sodium Fluoride","Flavour","Preservative"]},
  {key:"vitamin-c",cat:"Health & Pharma",name:"Vitamin C Supplement",emoji:"💊",ing:["Ascorbic Acid","Microcrystalline Cellulose","Magnesium Stearate (vegetable)","Hydroxypropyl Methylcellulose"]},
  {key:"fish-oil",cat:"Health & Pharma",name:"Fish Oil Capsule",emoji:"🐟",ing:["Refined Fish Oil","Gelatin (Halal Certified)","Glycerin","Water","Vitamin E (Antioxidant)"]},
  {key:"probiotic",cat:"Health & Pharma",name:"Probiotic Supplement",emoji:"🌿",ing:["Lactobacillus acidophilus","Bifidobacterium lactis","Inulin (Prebiotic)","Maltodextrin","Magnesium Stearate (vegetable)"]},
  {key:"multivitamin",cat:"Health & Pharma",name:"Multivitamin Tablet",emoji:"💊",ing:["Vitamins (A,C,D,E,K,B-complex)","Minerals (Iron,Zinc,Calcium)","Microcrystalline Cellulose","Stearic Acid"]},
  {key:"herbal-extract",cat:"Health & Pharma",name:"Herbal Extract",emoji:"🌿",ing:["Plant Extract (specify)","Ethanol (food-grade)","Water","Glycerin"]},
  {key:"dishwash-liquid",cat:"Cleaning & Hygiene",name:"Dishwashing Liquid",emoji:"🫧",ing:["Water","Sodium Laureth Sulphate","Lauramine Oxide","Glycerin","Citric Acid","Fragrance","Preservative (MIT/CMIT)"]},
  {key:"floor-cleaner",cat:"Cleaning & Hygiene",name:"Floor Cleaner",emoji:"🧹",ing:["Water","Surfactant","Pine Oil","Fragrance","Preservative","Colour"]},
  {key:"hand-sanitizer",cat:"Cleaning & Hygiene",name:"Hand Sanitizer",emoji:"🙌",ing:["Ethanol 70%","Water","Glycerin","Hydrogen Peroxide","Carbomer","Triethanolamine","Fragrance"]},
  {key:"laundry-detergent",cat:"Cleaning & Hygiene",name:"Laundry Detergent",emoji:"🧺",ing:["Sodium Carbonate","Zeolites","Sodium Percarbonate","Surfactants","Enzymes","Fragrance","Optical Brightener"]},
  {key:"hand-soap",cat:"Cleaning & Hygiene",name:"Hand Soap (Liquid)",emoji:"🧼",ing:["Water","Sodium Laureth Sulphate","Cocamidopropyl Betaine","Glycerin","Sodium Chloride","Fragrance","Preservative"]},
  // Meat & Seafood extras
  {key:"lamb-mutton",cat:"Meat & Seafood",name:"Lamb / Mutton",emoji:"🐑",ing:["Lamb (Halal slaughtered)","Salt","Rosemary Extract"]},
  {key:"duck-processed",cat:"Meat & Seafood",name:"Processed Duck",emoji:"🦆",ing:["Duck (Halal slaughtered)","Salt","Spices","Preservative (E202)"]},
  {key:"crab-processed",cat:"Meat & Seafood",name:"Processed Crab",emoji:"🦀",ing:["Crab","Salt","Water","Sodium Tripolyphosphate"]},
  {key:"squid-processed",cat:"Meat & Seafood",name:"Processed Squid",emoji:"🦑",ing:["Squid","Salt","Water","Sodium Metabisulphite (E223)"]},
  {key:"salmon-fillet",cat:"Meat & Seafood",name:"Salmon Fillet",emoji:"🐡",ing:["Salmon","Salt","Water"]},
  {key:"sardines-canned",cat:"Meat & Seafood",name:"Canned Sardines",emoji:"🐟",ing:["Sardines","Tomato Sauce","Salt","Water"]},
  {key:"meatballs",cat:"Meat & Seafood",name:"Beef Meatballs",emoji:"🫙",ing:["Beef (Halal)","Tapioca Starch","Salt","Spices","Garlic","Onion"]},
  {key:"chicken-nuggets",cat:"Meat & Seafood",name:"Chicken Nuggets",emoji:"🍗",ing:["Chicken (Halal)","Wheat Flour","Water","Salt","Spices","Vegetable Oil"]},
  // Grains & Cereals extras
  {key:"oats",cat:"Grains & Cereals",name:"Rolled Oats",emoji:"🥣",ing:["Whole Grain Oats"]},
  {key:"brown-rice",cat:"Grains & Cereals",name:"Brown Rice",emoji:"🍚",ing:["Whole Grain Brown Rice"]},
  {key:"corn-flour",cat:"Grains & Cereals",name:"Corn Flour",emoji:"🌽",ing:["Maize (Corn)"]},
  {key:"crackers",cat:"Grains & Cereals",name:"Cream Crackers",emoji:"🫙",ing:["Wheat Flour","Vegetable Shortening","Salt","Sodium Bicarbonate","Yeast"]},
  {key:"roti-canai",cat:"Grains & Cereals",name:"Frozen Roti / Flatbread",emoji:"🫓",ing:["Wheat Flour","Water","Vegetable Fat","Salt","Sugar","Yeast"]},
  {key:"vermicelli",cat:"Grains & Cereals",name:"Rice Vermicelli",emoji:"🍜",ing:["Rice Flour","Water","Tapioca Starch"]},
  // Dairy & Eggs extras
  {key:"condensed-milk",cat:"Dairy & Eggs",name:"Condensed Milk",emoji:"🥛",ing:["Whole Milk","Sugar"]},
  {key:"whipping-cream",cat:"Dairy & Eggs",name:"Whipping Cream",emoji:"🍦",ing:["Cream","Carrageenan (E407)","Cellulose Gum"]},
  {key:"custard-powder",cat:"Dairy & Eggs",name:"Custard Powder",emoji:"🫙",ing:["Corn Starch","Salt","Colour (Tartrazine E102)","Flavour (Vanilla)"]},
  {key:"powdered-milk",cat:"Dairy & Eggs",name:"Full Cream Milk Powder",emoji:"🥛",ing:["Whole Milk Powder","Vitamin A","Vitamin D3"]},
  // Beverages extras
  {key:"coconut-water",cat:"Beverages",name:"Coconut Water",emoji:"🥥",ing:["Coconut Water","Vitamin C (E300)"]},
  {key:"milk-tea",cat:"Beverages",name:"Milk Tea (RTD)",emoji:"🧋",ing:["Water","Milk Powder","Black Tea Extract","Sugar","Creamer","Emulsifier (E471)"]},
  {key:"malt-drink",cat:"Beverages",name:"Malt Drink",emoji:"🍺",ing:["Water","Malted Barley","Sugar","Caramel Colour","Salt","Carbon Dioxide"]},
  {key:"rose-syrup",cat:"Beverages",name:"Rose Syrup",emoji:"🌹",ing:["Sugar","Water","Rose Flavour","Citric Acid (E330)","Colour (Allura Red E129)"]},
  {key:"isotonic-drink",cat:"Beverages",name:"Isotonic Sports Drink",emoji:"💧",ing:["Water","Sugar","Citric Acid","Sodium Chloride","Potassium Chloride","Magnesium Sulphate","Colour","Flavour"]},
  // Condiments extras
  {key:"oyster-sauce",cat:"Condiments & Sauces",name:"Oyster Sauce",emoji:"🫙",ing:["Water","Sugar","Oyster Extract","Modified Starch (E1422)","Salt","Caramel Colour (E150d)"]},
  {key:"fish-sauce",cat:"Condiments & Sauces",name:"Fish Sauce",emoji:"🐟",ing:["Fish Extract","Salt","Sugar"]},
  {key:"mayonnaise",cat:"Condiments & Sauces",name:"Mayonnaise",emoji:"🫙",ing:["Vegetable Oil","Water","Egg Yolk","Vinegar","Sugar","Salt","Mustard","Citric Acid"]},
  {key:"sambal",cat:"Condiments & Sauces",name:"Sambal Paste",emoji:"🌶️",ing:["Chili","Shallots","Garlic","Dried Shrimp","Salt","Sugar","Vegetable Oil"]},
  {key:"curry-paste",cat:"Condiments & Sauces",name:"Curry Paste",emoji:"🍛",ing:["Chili","Lemongrass","Galangal","Turmeric","Shrimp Paste (Halal)","Salt","Vegetable Oil"]},
  // Plant-Based extras
  {key:"soy-nuggets",cat:"Plant-Based",name:"Soy Nuggets",emoji:"🫘",ing:["Textured Soy Protein","Wheat Flour","Water","Salt","Spices"]},
  {key:"edamame",cat:"Plant-Based",name:"Edamame Snack",emoji:"🫛",ing:["Green Soybeans","Salt","Water"]},
  {key:"oat-milk",cat:"Plant-Based",name:"Oat Milk",emoji:"🥛",ing:["Water","Oats","Rapeseed Oil","Salt","Calcium Carbonate","Vitamins"]},
  {key:"jackfruit-product",cat:"Plant-Based",name:"Jackfruit Product",emoji:"🍈",ing:["Young Jackfruit","Salt","Spices","Water"]},
  // Cosmetics extras
  {key:"sunscreen",cat:"Cosmetics & Personal Care",name:"Sunscreen SPF50",emoji:"☀️",ing:["Zinc Oxide","Titanium Dioxide","Water","Glycerin","Cetearyl Alcohol","Fragrance","Phenoxyethanol"]},
  {key:"body-wash",cat:"Cosmetics & Personal Care",name:"Body Wash",emoji:"🚿",ing:["Water","Sodium Laureth Sulphate","Cocamidopropyl Betaine","Glycol Distearate","Fragrance","Citric Acid","Preservative"]},
  {key:"eye-shadow",cat:"Cosmetics & Personal Care",name:"Eye Shadow Palette",emoji:"💅",ing:["Talc","Mica","Kaolin","Magnesium Stearate","Dimethicone","Pigments","Vitamin E"]},
  {key:"foundation",cat:"Cosmetics & Personal Care",name:"Foundation / BB Cream",emoji:"🧴",ing:["Water","Cyclopentasiloxane","Titanium Dioxide","Iron Oxides","Glycerin","Fragrance","Preservative"]},
  // Health & Pharma extras
  {key:"collagen",cat:"Health & Pharma",name:"Collagen Supplement",emoji:"💊",ing:["Halal Bovine Collagen Peptides","Vitamin C","Water","Citric Acid","Natural Flavour"]},
  {key:"protein-powder",cat:"Health & Pharma",name:"Protein Powder (Whey)",emoji:"💪",ing:["Whey Protein Concentrate","Cocoa Powder","Soy Lecithin","Natural Flavour","Stevia"]},
  {key:"iron-supplement",cat:"Health & Pharma",name:"Iron Supplement",emoji:"💊",ing:["Ferrous Fumarate","Microcrystalline Cellulose","Magnesium Stearate (vegetable)","HPMC"]},
  // Cleaning extras
  {key:"toilet-cleaner",cat:"Cleaning & Hygiene",name:"Toilet Bowl Cleaner",emoji:"🚽",ing:["Water","Hydrochloric Acid","Surfactant","Fragrance","Colour","Thickener"]},
  {key:"fabric-softener",cat:"Cleaning & Hygiene",name:"Fabric Softener",emoji:"🧺",ing:["Water","Dialkyl Dimethyl Ammonium Chloride","Fragrance","Citric Acid","Colour","Preservative"]},
  {key:"kitchen-cleaner",cat:"Cleaning & Hygiene",name:"Kitchen Cleaner Spray",emoji:"🧽",ing:["Water","Sodium Hydroxide","Surfactant","Fragrance","EDTA","Colour"]},
]
const PRODUCT_CATEGORIES = Array.from(new Set(CATALOG.map(c=>c.cat)))
function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36) }
function loadProducts(): StoredProduct[] {
  return []
}

function isNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 404
  )
}

function isForbiddenError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 403
  )
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  try { return value ? { ...fallback, ...JSON.parse(value) } : fallback } catch { return fallback }
}

function toLocalFactory(factory: ApiFactory): Factory {
  const extra = parseJson(factory.notes, {
    lat: "3.1390",
    lng: "101.6869",
    prodLines: "0",
    prodVolume: "0",
    volUnit: "kg",
    activityCategories: [] as string[],
    specificActivities: [] as string[],
    certUploads: [] as CertUpload[],
    photo: "",
  })
  return {
    id: factory.id,
    name: factory.name,
    country: factory.country || "Malaysia",
    city: factory.city || "",
    address: factory.address || "",
    lat: extra.lat,
    lng: extra.lng,
    prodLines: extra.prodLines,
    prodVolume: extra.prodVolume,
    volUnit: extra.volUnit,
    activityCategories: extra.activityCategories,
    specificActivities: extra.specificActivities,
    certUploads: extra.certUploads,
    photo: extra.photo,
  }
}

function toFactoryNotes(factory: Omit<Factory, "id">) {
  return JSON.stringify({
    lat: factory.lat,
    lng: factory.lng,
    prodLines: factory.prodLines,
    prodVolume: factory.prodVolume,
    volUnit: factory.volUnit,
    activityCategories: factory.activityCategories,
    specificActivities: factory.specificActivities,
    certUploads: factory.certUploads,
    photo: factory.photo,
  })
}

function toProductCategory(value: string | undefined) {
  const raw = (value || "").toLowerCase()
  if (raw.includes("beverage")) return "BEVERAGE"
  if (raw.includes("cosmetic")) return "COSMETICS"
  if (raw.includes("pharma")) return "PHARMACEUTICAL"
  if (raw.includes("supplement") || raw.includes("health")) return "SUPPLEMENT"
  if (raw.includes("meat") || raw.includes("poultry")) return "MEAT_POULTRY"
  if (raw.includes("seafood")) return "SEAFOOD"
  if (raw.includes("bakery") || raw.includes("grain")) return "BAKERY"
  if (raw.includes("dairy")) return "DAIRY"
  if (raw.includes("snack") || raw.includes("confectionery")) return "SNACK"
  if (raw.includes("food") || raw.includes("condiment") || raw.includes("plant")) return "FOOD"
  return "OTHER"
}

function toLocalProduct(product: ApiProduct): StoredProduct {
  const extra = parseJson(product.description, {
    catalogKey: "custom",
    emoji: "📦",
    barcode: "",
    photo: "",
    ingredients: product.ingredients.map((name, index) => ({ id: `${product.id}-${index}`, name })) as IngredientRow[],
  })
  return {
    id: product.id,
    catalogKey: extra.catalogKey,
    emoji: extra.emoji,
    name: product.name,
    code: product.sku || "",
    barcode: extra.barcode,
    factoryId: product.factoryId || "",
    ingredients: extra.ingredients,
    addedAt: product.createdAt,
    photo: extra.photo,
  }
}

function toProductDescription(product: Omit<StoredProduct, "id" | "addedAt">) {
  return JSON.stringify({
    catalogKey: product.catalogKey,
    emoji: product.emoji,
    barcode: product.barcode,
    photo: product.photo,
    ingredients: product.ingredients,
  })
}

// ─── Factory Card ─────────────────────────────────────────────────────────────
function FactoryCard({f,selected,onSelect,onEdit,onDelete,onMap,onApply,onLogoChange,prodCount}:{
  f:Factory;selected:boolean;onSelect:(id:string)=>void
  onEdit:(f:Factory)=>void;onDelete:(id:string)=>void;onMap:(f:Factory)=>void
  onApply:(id:string)=>void;onLogoChange:(id:string,base64:string)=>void
  prodCount:number
}){
  const [hov,setHov]=useState(false)
  const [logoHov,setLogoHov]=useState(false)
  const logoInputRef=useRef<HTMLInputElement>(null)
  const handleLogoFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];if(!file)return
    const reader=new FileReader()
    reader.onload=ev=>onLogoChange(f.id,ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value=""
  }
  return(
    <div onClick={()=>onSelect(f.id)}
      onMouseOver={()=>setHov(true)} onMouseOut={()=>setHov(false)}
      style={{background:"#fff",border:`2px solid ${selected?BLUE:hov?"#bfdbfe":"#e2e8f0"}`,borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"border-color 0.15s,box-shadow 0.15s,transform 0.15s",boxShadow:selected?"0 4px 20px rgba(37,99,235,0.14)":hov?"0 8px 28px rgba(37,99,235,0.08)":C.cardShadow,transform:selected||hov?"translateY(-1px)":"none",position:"relative"}}>

      {/* Selected indicator */}
      {selected&&<div style={{position:"absolute",top:10,left:10,width:8,height:8,borderRadius:"50%",background:BLUE,boxShadow:"0 0 0 3px rgba(37,99,235,0.2)"}}/>}

      {/* Hover action buttons */}
      <div style={{position:"absolute",top:10,right:10,display:"flex",gap:5,opacity:hov||selected?1:0,transition:"opacity 0.15s",zIndex:10}}>
        <button onClick={e=>{e.stopPropagation();onMap(f)}} title="View map"
          style={{width:28,height:28,borderRadius:7,background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}}>
          <Map size={12} color="#64748b"/>
        </button>
        <button onClick={e=>{e.stopPropagation();onEdit(f)}} title="Edit"
          style={{width:28,height:28,borderRadius:7,background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}}>
          <Pencil size={12} color={BLUE}/>
        </button>
        <button onClick={e=>{e.stopPropagation();onDelete(f.id)}} title="Delete"
          style={{width:28,height:28,borderRadius:7,background:"#fff",border:"1px solid #fecaca",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}}>
          <Trash2 size={12} color={RED}/>
        </button>
      </div>

      <div style={{padding:"16px 18px"}}>
        {/* Factory identity */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div
            style={{width:60,height:60,borderRadius:14,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden",border:`1.5px solid ${logoHov?"#93c5fd":"#e2e8f0"}`,cursor:"pointer",position:"relative",transition:"border-color 0.15s"}}
            onMouseEnter={()=>setLogoHov(true)} onMouseLeave={()=>setLogoHov(false)}
            onClick={e=>{e.stopPropagation();logoInputRef.current?.click()}}
            title="Click to change logo"
          >
            {f.photo
              ? <img src={f.photo} alt={f.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              : <FactoryIcon size={26} color={BLUE} strokeWidth={1.5}/>
            }
            {logoHov&&(
              <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:13}}>
                <Camera size={16} color="#fff"/>
              </div>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogoFile}/>
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:"0.9rem",fontWeight:700,color:DARK,lineHeight:1.2,paddingRight:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{f.name||"Unnamed Factory"}</div>
            <div style={{fontSize:"0.75rem",color:"#64748b",marginTop:2,display:"flex",alignItems:"center",gap:4}}>
              <MapPin size={10} color="#94a3b8"/>
              {[f.city,f.country].filter(Boolean).join(", ")||"Location not set"}
            </div>
          </div>
        </div>

        {/* Production stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div style={{padding:"10px 12px",borderRadius:9,background:"#f8fafc",border:"1px solid #f1f5f9"}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
              <Layers size={11} color={BLUE}/>
              <span style={{fontSize:"0.6rem",fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as const,letterSpacing:"0.07em"}}>Prod. Lines</span>
            </div>
            <div style={{fontSize:"1.1rem",fontWeight:800,color:DARK}}>{f.prodLines||"0"}</div>
          </div>
          <div style={{padding:"10px 12px",borderRadius:9,background:"#f8fafc",border:"1px solid #f1f5f9"}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
              <TrendingUp size={11} color={GREEN}/>
              <span style={{fontSize:"0.6rem",fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as const,letterSpacing:"0.07em"}}>Volume</span>
            </div>
            <div style={{fontSize:"1.1rem",fontWeight:800,color:DARK}}>{f.prodVolume||"0"} <span style={{fontSize:"0.65rem",color:"#94a3b8",fontWeight:400}}>{f.volUnit}</span></div>
          </div>
        </div>

        {/* Product count chip */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <Package size={11} color={selected?BLUE:"#94a3b8"}/>
            <span style={{fontSize:"0.72rem",color:selected?BLUE:"#94a3b8",fontWeight:selected?600:400}}>{prodCount} product{prodCount!==1?"s":""}</span>
          </div>
          <button type="button" onClick={e=>{e.stopPropagation();onApply(f.id)}}
            style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:7,background:BLUE,color:"#fff",border:"none",cursor:"pointer",fontSize:"0.72rem",fontWeight:700,fontFamily:"inherit"}}>
            Apply for Certification <ArrowLeft size={11} style={{transform:"rotate(180deg)"}}/>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CustomerFactoriesPage(){
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const token = useAuthStore(state => state.token)
  const setAuth = useAuthStore(state => state.setAuth)
  const [companyId, setCompanyId] = useState("")
  const [dataError, setDataError] = useState("")
  // Factory state
  const [factories,         setFactories]         = useState<Factory[]>(loadFactories)
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>(()=>loadFactories()[0]?.id??"")
  const [showFacModal,      setShowFacModal]      = useState(false)
  const [editId,            setEditId]            = useState<string|null>(null)
  const [form,              setForm]              = useState<Omit<Factory,"id">>(DEFAULT_FORM)
  const [activityCategories, setActivityCategories] = useState(getActivityCategories)
  const [geoLoading,        setGeoLoading]        = useState(false)
  const [deleteConfirm,     setDeleteConfirm]     = useState<string|null>(null)
  const countryRef                                = useRef<HTMLDivElement>(null)
  const [showCountryDrop,   setShowCountryDrop]   = useState(false)
  const [countryQuery,      setCountryQuery]      = useState("Malaysia")
  const [mapPopup,          setMapPopup]          = useState<Factory|null>(null)

  const [localApps, setLocalApps] = useState<{id:string;status:string;savedAt:string;factoryId?:string;companyName?:string;products?:{name:string}[];selectedMarkets?:string[]}[]>([])
  const refreshApps = () => {
    setLocalApps([])
  }
  const [detailTab, setDetailTab] = useState<"products"|"applications">("products")
  const createMissingCompany = (account: UserDto | null) => {
    if (!account) throw new Error("No authenticated user")
    return createCompany({
      registrationNumber: `PENDING-${String(account.id).slice(0, 8)}`,
      name: account.organization || account.name || account.email || "Registered Company",
      businessType: "OTHER",
      address: "Pending company profile completion",
      city: "",
      state: "",
      postcode: "",
      country: "Malaysia",
      phone: account.phone || "",
      email: account.email,
      contactName: account.name,
      contactDesignation: "",
      activityCategory: "OTHER",
      specificActivities: JSON.stringify([]),
      description: "",
    })
  }

  const migrateDemoCustomer = async (): Promise<UserDto> => {
    const credentials = { email: "company@example.com", password: "company123" }
    let auth
    try {
      auth = await loginUser(credentials)
    } catch {
      auth = await registerUser({
        ...credentials,
        fullName: "Al-Barakah Foods",
        companyName: "Al-Barakah Food Co.",
        role: "CUSTOMER",
      })
    }
    const account: UserDto = {
      id: auth.userId,
      email: auth.email,
      name: auth.fullName,
      role: auth.role,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      organization: "Al-Barakah Food Co.",
    }
    setAuth(auth.accessToken, account)
    return account
  }

  useEffect(()=>{
    let alive = true
    ;(async()=>{
      try {
        setDataError("")
        const loadRegistrationRecords = async (account: UserDto | null) => {
          let company
          try {
            company = await getMyCompany()
          } catch (error) {
            if (!isNotFoundError(error)) throw error
            company = await createMissingCompany(account)
          }
          const [factoryPage, productPage] = await Promise.all([
            getFactories(company.id, 0, 200),
            getProducts(company.id, 0, 500),
          ])
          return { company, factoryPage, productPage }
        }

        const account = token === "demo-customer-token" ? await migrateDemoCustomer() : user
        let records
        try {
          records = await loadRegistrationRecords(account)
        } catch (error) {
          const canRefreshDemoSession =
            isForbiddenError(error) &&
            (token === "demo-customer-token" || account?.email === "company@example.com")
          if (!canRefreshDemoSession) throw error
          const refreshedAccount = await migrateDemoCustomer()
          records = await loadRegistrationRecords(refreshedAccount)
        }

        if (!alive) return
        setCompanyId(records.company.id)
        const nextFactories = records.factoryPage.content.map(toLocalFactory)
        setFactories(nextFactories)
        setSelectedFactoryId(nextFactories[0]?.id ?? "")
        setProducts(records.productPage.content.map(toLocalProduct))
        setDataError("")
      } catch (error) {
        if (!alive) return
        setDataError(
          isForbiddenError(error)
            ? "Your session is not authorized to load company registration records. Please sign in again."
            : "Unable to load company registration records from the database."
        )
      }
    })()
    return () => { alive = false }
  },[])
  useEffect(()=>{if(!selectedFactoryId&&factories.length>0)setSelectedFactoryId(factories[0].id)},[factories,selectedFactoryId])
  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(countryRef.current&&!countryRef.current.contains(e.target as Node))setShowCountryDrop(false)}
    document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h)
  },[])

  const setField=<K extends keyof Omit<Factory,"id">>(k:K,v:Omit<Factory,"id">[K])=>setForm(p=>({...p,[k]:v}))
  const toggleActivityCategory=(key:string)=>setForm(p=>({...p,activityCategories:p.activityCategories.includes(key)?p.activityCategories.filter(c=>c!==key):[...p.activityCategories,key]}))
  const toggleSpecificActivity=(key:string)=>setForm(p=>({...p,specificActivities:p.specificActivities.includes(key)?p.specificActivities.filter(a=>a!==key):[...p.specificActivities,key]}))
  const selectCountry=(c:string)=>{const [la,lo]=COUNTRY_CENTERS[c]||["3.1390","101.6869"];setForm(p=>({...p,country:c,lat:la,lng:lo}));setCountryQuery(c);setShowCountryDrop(false)}
  const openAdd=()=>{setActivityCategories(getActivityCategories());setEditId(null);setForm(DEFAULT_FORM);setCountryQuery("Malaysia");setShowFacModal(true)}
  const openEdit=(f:Factory)=>{setActivityCategories(getActivityCategories());setEditId(f.id);const{id:_,...rest}=f;setForm(rest);setCountryQuery(f.country);setShowFacModal(true)}
  const closeFacModal=()=>{setShowFacModal(false);setEditId(null)}
  const applyForFactory=(id:string)=>navigate(`/customer/apply?factoryId=${encodeURIComponent(id)}`)
  const updateFactoryLogo=async(id:string,base64:string)=>{
    const existing = factories.find(f=>f.id===id)
    if (!existing || !companyId) return
    const next = { ...existing, photo: base64 }
    setFactories(p=>p.map(f=>f.id===id?next:f))
    await apiUpdateFactory(companyId, id, {
      name: next.name,
      factoryType: "PRODUCTION",
      address: next.address,
      city: next.city,
      country: next.country,
      notes: toFactoryNotes(next),
    })
  }
  const canSaveFactory=form.name.trim().length>0&&form.activityCategories.length>0
  const saveFactory=async()=>{
    if(!canSaveFactory||!companyId)return
    const payload = {
      name: form.name,
      factoryType: "PRODUCTION",
      address: form.address || form.name,
      city: form.city,
      country: form.country,
      notes: toFactoryNotes(form),
    }
    try {
      if(editId){
        const saved = await apiUpdateFactory(companyId, editId, payload)
        setFactories(p=>p.map(f=>f.id===editId?toLocalFactory(saved):f))
      } else {
        const saved = await apiCreateFactory(companyId, payload)
        const local = toLocalFactory(saved)
        setFactories(p=>[...p,local])
        setSelectedFactoryId(local.id)
      }
      setDataError("")
      closeFacModal()
    } catch {
      setDataError("Factory could not be saved to the database.")
    }
  }
  const deleteFactory=async(id:string)=>{
    if(!companyId)return
    try {
      await apiDeleteFactory(companyId, id)
      setFactories(p=>{
        const next=p.filter(f=>f.id!==id)
        if(selectedFactoryId===id)setSelectedFactoryId(next[0]?.id??"")
        return next
      })
      setDeleteConfirm(null)
      setDataError("")
    } catch {
      setDataError("Factory could not be deleted from the database.")
    }
  }
  const addCert=(type:string,file:File)=>{
    const reader=new FileReader()
    reader.onload=ev=>setForm(p=>({...p,certUploads:[...p.certUploads.filter(c=>c.type!==type),{type,fileName:file.name,fileSize:file.size,fileData:ev.target?.result as string}]}))
    reader.readAsDataURL(file)
  }
  const removeCert=(type:string)=>setForm(p=>({...p,certUploads:p.certUploads.filter(c=>c.type!==type)}))
  const locate=()=>{
    if(!navigator.geolocation)return;setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos=>{setField("lat",pos.coords.latitude.toFixed(6));setField("lng",pos.coords.longitude.toFixed(6));setGeoLoading(false)},
      ()=>setGeoLoading(false)
    )
  }
  const modalMapSrc=`https://www.openstreetmap.org/export/embed.html?bbox=${(parseFloat(form.lng||"101.6869")-0.08).toFixed(4)},${(parseFloat(form.lat||"3.1390")-0.06).toFixed(4)},${(parseFloat(form.lng||"101.6869")+0.08).toFixed(4)},${(parseFloat(form.lat||"3.1390")+0.06).toFixed(4)}&layer=mapnik&marker=${form.lat||"3.1390"},${form.lng||"101.6869"}`
  const filteredCountries=COUNTRIES.filter(c=>c.toLowerCase().includes(countryQuery.toLowerCase()))
  const inp:React.CSSProperties={width:"100%",height:38,padding:"0 11px",border:"1px solid #e2e8f0",borderRadius:7,fontSize:"0.8125rem",color:DARK,outline:"none",boxSizing:"border-box",fontFamily:"inherit",background:"#fff"}
  const lbl:React.CSSProperties={display:"block",fontSize:"0.72rem",fontWeight:600,color:DARK,marginBottom:5}
  const iFocus=(e:React.FocusEvent<HTMLInputElement|HTMLSelectElement>)=>(e.target.style.borderColor=BLUE)
  const iBlur=(e:React.FocusEvent<HTMLInputElement|HTMLSelectElement>)=>(e.target.style.borderColor="#e2e8f0")
  // Product state
  const [products,        setProducts]        = useState<StoredProduct[]>(loadProducts)
  const [showProdModal,   setShowProdModal]   = useState(false)
  const [prodFactoryId,   setProdFactoryId]   = useState("")
  const [modalStep,       setModalStep]       = useState<1|2>(1)
  const [catalogSearch,   setCatalogSearch]   = useState("")
  const [catalogCat,      setCatalogCat]      = useState("All")
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogItem|null>(null)
  const [isCustom,        setIsCustom]        = useState(false)
  const [formName,        setFormName]        = useState("")
  const [formCode,        setFormCode]        = useState("")
  const [formBarcode,     setFormBarcode]     = useState("")
  const [formPhoto,       setFormPhoto]       = useState("")
  const [formIngredients, setFormIngredients] = useState<IngredientRow[]>([])

  const visibleProducts = selectedFactoryId
    ? products.filter(p=>p.factoryId===selectedFactoryId)
    : products

  const catalogFiltered=CATALOG.filter(item=>{
    const matchCat=catalogCat==="All"||item.cat===catalogCat
    const matchSearch=item.name.toLowerCase().includes(catalogSearch.toLowerCase())||item.cat.toLowerCase().includes(catalogSearch.toLowerCase())
    return matchCat&&matchSearch
  })

  const openProdModal=(fid?:string)=>{
    const fid2=fid||selectedFactoryId||""
    setProdFactoryId(fid2);setModalStep(1);setCatalogSearch("");setCatalogCat("All")
    setSelectedCatalog(null);setIsCustom(false);setFormName("");setFormCode("");setFormBarcode("");setFormPhoto("")
    setFormIngredients([])
    setShowProdModal(true)
  }
  const closeProdModal=()=>setShowProdModal(false)
  const goToStep2=(item:CatalogItem|null,custom:boolean)=>{
    setIsCustom(custom)
    if(item&&!custom){setFormName(item.name);setFormIngredients(item.ing.map(n=>({id:uid(),name:n})))}
    else{setFormName("");setFormIngredients([])}
    setFormCode("");setModalStep(2)
  }
  const addIngredient=()=>setFormIngredients(p=>[...p,{id:uid(),name:""}])
  const removeIngredient=(id:string)=>setFormIngredients(p=>p.filter(i=>i.id!==id))
  const updateIngName=(id:string,name:string)=>setFormIngredients(p=>p.map(i=>i.id===id?{...i,name}:i))
  const updateIngCert=(id:string,certFile:string,certName:string)=>setFormIngredients(p=>p.map(i=>i.id===id?{...i,certFile,certName}:i))
  const removeIngCert=(id:string)=>setFormIngredients(p=>p.map(i=>i.id===id?{...i,certFile:undefined,certName:undefined}:i))
  const saveProduct=()=>{
    if(!formName.trim())return
    const catalog=isCustom?null:selectedCatalog
    setProducts(p=>[{id:uid(),catalogKey:catalog?.key??"custom-"+uid(),emoji:catalog?.emoji??"📦",name:formName.trim(),code:formCode.trim(),barcode:formBarcode.trim(),factoryId:prodFactoryId,ingredients:formIngredients.filter(i=>i.name.trim()),addedAt:new Date().toISOString(),photo:formPhoto||undefined},...p])
    closeProdModal()
  }
  const deleteProduct=(id:string)=>setProducts(p=>p.filter(p2=>p2.id!==id))
  const updateProductPhoto=(id:string,photo:string)=>setProducts(p=>p.map(p2=>p2.id===id?{...p2,photo}:p2))
  const [viewProduct,setViewProduct]=useState<StoredProduct|null>(null)

  // Edit product state
  const [editProduct,     setEditProduct]     = useState<StoredProduct|null>(null)
  const [editName,        setEditName]        = useState("")
  const [editCode,        setEditCode]        = useState("")
  const [editBarcode,     setEditBarcode]     = useState("")
  const [editIngredients, setEditIngredients] = useState<IngredientRow[]>([])

  const openEditProduct=(p:StoredProduct)=>{
    setEditProduct(p);setEditName(p.name);setEditCode(p.code);setEditBarcode(p.barcode||"")
    setEditIngredients(p.ingredients.map(i=>({...i})))
  }
  const closeEditProduct=()=>setEditProduct(null)
  const saveEditProduct=()=>{
    if(!editName.trim()||!editProduct)return
    setProducts(prev=>prev.map(p=>p.id===editProduct.id?{...p,name:editName.trim(),code:editCode.trim(),barcode:editBarcode.trim(),ingredients:editIngredients.filter(i=>i.name.trim())}:p))
    closeEditProduct()
  }
  const addEditIng=()=>setEditIngredients(p=>[...p,{id:uid(),name:""}])
  const removeEditIng=(id:string)=>setEditIngredients(p=>p.filter(i=>i.id!==id))
  const updateEditIngName=(id:string,name:string)=>setEditIngredients(p=>p.map(i=>i.id===id?{...i,name}:i))
  const updateEditIngCert=(id:string,certFile:string,certName:string)=>setEditIngredients(p=>p.map(i=>i.id===id?{...i,certFile,certName}:i))
  const removeEditIngCert=(id:string)=>setEditIngredients(p=>p.map(i=>i.id===id?{...i,certFile:undefined,certName:undefined}:i))

  void saveProduct
  void deleteProduct
  void updateProductPhoto
  void saveEditProduct

  const saveProductToDb=async()=>{
    if(!formName.trim()||!companyId)return
    const catalog=isCustom?null:selectedCatalog
    const local={catalogKey:catalog?.key??"custom-"+uid(),emoji:catalog?.emoji??"PKG",name:formName.trim(),code:formCode.trim(),barcode:formBarcode.trim(),factoryId:prodFactoryId,ingredients:formIngredients.filter(i=>i.name.trim()),photo:formPhoto||undefined}
    try{
      const saved=await apiCreateProduct(companyId,{name:local.name,sku:local.code,category:toProductCategory(catalog?.cat),factoryId:local.factoryId||undefined,ingredients:local.ingredients.map(i=>i.name),description:toProductDescription(local)})
      setProducts(p=>[toLocalProduct(saved),...p])
      setDataError("")
      closeProdModal()
    }catch{setDataError("Product could not be saved to the database.")}
  }
  const deleteProductFromDb=async(id:string)=>{
    if(!companyId)return
    try{
      await apiDeleteProduct(companyId,id)
      setProducts(p=>p.filter(p2=>p2.id!==id))
      setDataError("")
    }catch{setDataError("Product could not be deleted from the database.")}
  }
  const updateProductPhotoInDb=async(id:string,photo:string)=>{
    if(!companyId)return
    const existing=products.find(p=>p.id===id)
    if(!existing)return
    const next={...existing,photo}
    setProducts(p=>p.map(p2=>p2.id===id?next:p2))
    try{
      const saved=await apiUpdateProduct(companyId,id,{name:next.name,sku:next.code,category:toProductCategory(CATALOG.find(c=>c.key===next.catalogKey)?.cat),factoryId:next.factoryId||undefined,ingredients:next.ingredients.map(i=>i.name),description:toProductDescription(next)})
      setProducts(p=>p.map(p2=>p2.id===id?toLocalProduct(saved):p2))
      setDataError("")
    }catch{setDataError("Product photo could not be saved to the database.")}
  }
  const saveEditProductToDb=async()=>{
    if(!editName.trim()||!editProduct||!companyId)return
    const next={...editProduct,name:editName.trim(),code:editCode.trim(),barcode:editBarcode.trim(),ingredients:editIngredients.filter(i=>i.name.trim())}
    try{
      const saved=await apiUpdateProduct(companyId,editProduct.id,{name:next.name,sku:next.code,category:toProductCategory(CATALOG.find(c=>c.key===next.catalogKey)?.cat),factoryId:next.factoryId||undefined,ingredients:next.ingredients.map(i=>i.name),description:toProductDescription(next)})
      setProducts(prev=>prev.map(p=>p.id===editProduct.id?toLocalProduct(saved):p))
      setDataError("")
      closeEditProduct()
    }catch{setDataError("Product could not be updated in the database.")}
  }

  return(
    <CustomerLayout>
      <div style={{fontFamily:"'Inter',system-ui,sans-serif"}}>

        {/* ── Page header ── */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22}}>
          <div>
            <h1 style={{fontSize:"1.2rem",fontWeight:700,color:DARK,margin:"0 0 4px"}}>Production Facilities</h1>
            <p style={{margin:0,fontSize:"0.83rem",color:"#64748b"}}>Manage your factories and products for halal certification.</p>
          </div>
          <button onClick={openAdd}
            style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:7,background:"#0f2170",color:"#fff",border:"none",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,fontFamily:"inherit",flexShrink:0}}>
            <Plus size={11}/> Add Factory
          </button>
        </div>
        {dataError && (
          <div style={{margin:"0 0 16px",padding:"10px 12px",borderRadius:8,background:"#fef2f2",border:"1px solid #fecaca",color:RED,fontSize:"0.8rem",fontWeight:600}}>
            {dataError}
          </div>
        )}

        {/* ── Factory grid ── */}
        <div style={{marginBottom:28}}>
          {factories.length===0?(
            <div style={{textAlign:"center",padding:"60px 20px",background:"#fff",border:"1px dashed #e2e8f0",borderRadius:14,boxShadow:C.cardShadow}}>
              <FactoryIcon size={40} color="#cbd5e1" style={{marginBottom:14}}/>
              <p style={{margin:"0 0 6px",fontWeight:600,fontSize:"0.95rem",color:DARK}}>No facilities registered yet</p>
              <p style={{margin:"0 0 18px",fontSize:"0.83rem",color:"#94a3b8"}}>Add your production factories to include in halal certification applications.</p>
              <button onClick={openAdd} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:8,background:BLUE,color:"#fff",border:"none",cursor:"pointer",fontSize:"0.83rem",fontWeight:600,fontFamily:"inherit"}}>
                <Plus size={14}/> Add First Factory
              </button>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>
              {factories.map(f=>(
                <FactoryCard key={f.id} f={f}
                  selected={selectedFactoryId===f.id}
                  onSelect={setSelectedFactoryId}
                  onEdit={openEdit}
                  onDelete={id=>setDeleteConfirm(id)}
                  onMap={setMapPopup}
                  onApply={applyForFactory}
                  onLogoChange={updateFactoryLogo}
                  prodCount={products.filter(p=>p.factoryId===f.id).length}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Products section ── */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,overflow:"hidden",boxShadow:C.cardShadow}}>

          {/* Header with tabs */}
          <div style={{borderBottom:"1px solid #e2e8f0"}}>
            {/* Factory name row */}
            {selectedFactoryId&&factories.find(f=>f.id===selectedFactoryId)&&(
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px 0"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <FactoryIcon size={13} color={BLUE}/>
                  <span style={{fontSize:"0.83rem",fontWeight:600,color:BLUE}}>{factories.find(f=>f.id===selectedFactoryId)!.name}</span>
                </div>
                {detailTab==="products"?(
                  <button onClick={()=>openProdModal()}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:7,background:"#0f2170",color:"#fff",border:"none",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,fontFamily:"inherit",flexShrink:0}}>
                    <Plus size={11}/> Add Product
                  </button>
                ):(
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={refreshApps}
                      style={{padding:"5px 11px",borderRadius:7,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:"0.72rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      ↻ Refresh
                    </button>
                    <button onClick={()=>applyForFactory(selectedFactoryId)}
                      style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:7,background:BLUE,color:"#fff",border:"none",cursor:"pointer",fontSize:"0.72rem",fontWeight:700,fontFamily:"inherit"}}>
                      <Plus size={11}/> New Application
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Tab bar */}
            <div style={{display:"flex",gap:0,padding:"0 20px"}}>
              {([
                {key:"products",     label:"Products",     count:visibleProducts.length},
                {key:"applications", label:"Applications", count:selectedFactoryId?localApps.filter(a=>a.factoryId===selectedFactoryId).length:0},
              ] as const).map(tab=>{
                const active=detailTab===tab.key
                return(
                  <button key={tab.key} onClick={()=>setDetailTab(tab.key)}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"10px 14px",border:"none",background:"transparent",cursor:"pointer",fontFamily:"inherit",fontSize:"0.82rem",fontWeight:active?700:500,color:active?BLUE:"#64748b",borderBottom:active?`2.5px solid ${BLUE}`:"2.5px solid transparent",marginBottom:-1,transition:"color 0.15s"}}>
                    {tab.label}
                    {tab.count>0&&<span style={{fontSize:"0.65rem",padding:"1px 7px",borderRadius:10,background:active?"#eff6ff":"#f1f5f9",color:active?BLUE:"#94a3b8",fontWeight:700}}>{tab.count}</span>}
                  </button>
                )
              })}
            </div>
          </div>
          {/* Tab content */}
          {detailTab==="applications" ? (
            (() => {
              const facApps = selectedFactoryId ? localApps.filter(a=>a.factoryId===selectedFactoryId) : []
              const STATUS_COLOR: Record<string,{bg:string;color:string;dot:string}> = {
                SUBMITTED:   {bg:"#eff6ff",color:"#2563eb",dot:"#60a5fa"},
                DRAFT:       {bg:"#f1f5f9",color:"#64748b",dot:"#94a3b8"},
                UNDER_REVIEW:{bg:"#fef9c3",color:"#854d0e",dot:"#eab308"},
                CERTIFIED:   {bg:"#f0fdf4",color:"#15803d",dot:"#22c55e"},
              }
              return facApps.length===0 ? (
                <div style={{textAlign:"center",padding:"52px 20px"}}>
                  <ChevronRight size={36} color="#cbd5e1" style={{marginBottom:12}}/>
                  <p style={{margin:"0 0 6px",fontWeight:600,fontSize:"0.9rem",color:DARK}}>No applications yet</p>
                  <p style={{margin:"0 0 16px",fontSize:"0.8rem",color:"#94a3b8"}}>Submit a halal certification application for this factory</p>
                  <button onClick={()=>selectedFactoryId&&applyForFactory(selectedFactoryId)}
                    style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:8,background:BLUE,color:"#fff",border:"none",cursor:"pointer",fontSize:"0.82rem",fontWeight:600,fontFamily:"inherit"}}>
                    <Plus size={14}/> Apply Now
                  </button>
                </div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))",gap:18,padding:"20px 24px"}}>
                  {facApps.map(a=>{
                    const sc=STATUS_COLOR[a.status]??{bg:"#f1f5f9",color:"#475569",dot:"#94a3b8"}
                    const prods:any[]=a.products||[]
                    const markets:string[]=a.selectedMarkets||[]
                    const remarks=(a as any).remarks||""
                    const currCert=(a as any).currCert||""
                    const trainingQ=(a as any).trainingQ||""
                    void currCert
                    void trainingQ
                    return(
                      <div key={a.id} style={{border:"1px solid #e2e8f0",borderRadius:14,background:"#fff",boxShadow:"0 2px 8px rgba(0,0,0,0.07)",display:"flex",flexDirection:"column",overflow:"hidden"}}>

                        {/* Card header */}
                        <div style={{padding:"16px 18px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafbfc"}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontFamily:"monospace",fontSize:"0.8rem",fontWeight:700,color:"#334155",background:"#e2e8f0",padding:"3px 10px",borderRadius:6}}>
                              {a.id.replace("local_","#L")}
                            </span>
                            <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:"0.73rem",padding:"4px 11px",borderRadius:20,fontWeight:600,background:sc.bg,color:sc.color}}>
                              <span style={{width:6,height:6,borderRadius:"50%",background:sc.dot,flexShrink:0}}/>
                              {a.status}
                            </span>
                          </div>
                          <button onClick={()=>{
                            const updated=localApps.filter(x=>x.id!==a.id)
                            setLocalApps(updated)
                          }} style={{width:26,height:26,borderRadius:7,border:"none",background:"#fee2e2",color:RED,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
                        </div>

                        {/* Body */}
                        <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:14,flex:1}}>

                          {/* Products */}
                          <div>
                            <div style={{fontSize:"0.62rem",fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as const,letterSpacing:"0.07em",marginBottom:6}}>Products ({prods.length})</div>
                            {prods.length>0?(
                              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                                {prods.map((p:any)=>(
                                  <div key={p.id||p.name} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:"#f8fafc",border:"1px solid #f1f5f9"}}>
                                    <span style={{fontSize:"1rem"}}>{p.emoji||"📦"}</span>
                                    <span style={{fontSize:"0.8rem",fontWeight:600,color:DARK}}>{p.name}</span>
                                    {p.code&&<span style={{marginLeft:"auto",fontSize:"0.68rem",color:"#94a3b8",fontFamily:"monospace"}}>{p.code}</span>}
                                  </div>
                                ))}
                              </div>
                            ):<span style={{fontSize:"0.78rem",color:"#94a3b8"}}>No products selected</span>}
                          </div>

                          {/* Target Markets */}
                          {markets.length>0&&(
                            <div>
                              <div style={{fontSize:"0.62rem",fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as const,letterSpacing:"0.07em",marginBottom:6}}>Target Markets</div>
                              <div style={{display:"flex",flexWrap:"wrap" as const,gap:5}}>
                                {markets.map(m=>(
                                  <span key={m} style={{fontSize:"0.72rem",fontWeight:600,padding:"3px 10px",borderRadius:12,background:"#f1f5f9",color:"#334155",border:"1px solid #e2e8f0"}}>{m}</span>
                                ))}
                              </div>
                            </div>
                          )}


                          {/* Remarks */}
                          {remarks&&(
                            <div>
                              <div style={{fontSize:"0.62rem",fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as const,letterSpacing:"0.07em",marginBottom:4}}>Remarks</div>
                              <p style={{margin:0,fontSize:"0.78rem",color:"#475569",lineHeight:1.5,background:"#f8fafc",padding:"8px 10px",borderRadius:8,border:"1px solid #f1f5f9"}}>{remarks}</p>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div style={{padding:"10px 18px",borderTop:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafbfc"}}>
                          <span style={{fontSize:"0.7rem",color:"#94a3b8"}}>
                            Submitted {new Date(a.savedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                          </span>
                          <span style={{fontSize:"0.68rem",fontWeight:600,color:"#94a3b8",background:"#f1f5f9",padding:"2px 8px",borderRadius:8}}>Pending sync</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()
          ) : (
          /* Products list */
          !selectedFactoryId?(
            <div style={{textAlign:"center",padding:"52px 20px"}}>
              <FactoryIcon size={36} color="#cbd5e1" style={{marginBottom:12}}/>
              <p style={{margin:"0 0 6px",fontWeight:600,fontSize:"0.9rem",color:DARK}}>No factory selected</p>
              <p style={{margin:0,fontSize:"0.8rem",color:"#94a3b8"}}>Add a factory above to manage its products</p>
            </div>
          ):visibleProducts.length===0?(
            <div style={{textAlign:"center",padding:"52px 20px"}}>
              <Package size={36} color="#cbd5e1" style={{marginBottom:12}}/>
              <p style={{margin:"0 0 6px",fontWeight:600,fontSize:"0.9rem",color:DARK}}>No products yet</p>
              <p style={{margin:"0 0 16px",fontSize:"0.8rem",color:"#94a3b8"}}>
                {`Add products manufactured at ${factories.find(f=>f.id===selectedFactoryId)?.name}`}
              </p>
              <button onClick={()=>openProdModal()}
                style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:8,background:DARK,color:"#fff",border:"none",cursor:"pointer",fontSize:"0.82rem",fontWeight:600,fontFamily:"inherit"}}>
                <Plus size={14}/> Add First Product
              </button>
            </div>
          ):(
            <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'Inter',system-ui,sans-serif"}}>
              <colgroup>
                <col style={{width:"28%"}}/><col style={{width:"17%"}}/><col style={{width:"13%"}}/>
                <col style={{width:"22%"}}/><col style={{width:"10%"}}/><col/>
              </colgroup>
              <thead>
                <tr style={{borderBottom:`2px solid ${C.border}`,background:"#fafbfc"}}>
                  {["Product & Details","Barcode / SKU","Ingredients","Certificates Uploaded","Added",""].map(h=>(
                    <th key={h} style={{padding:"11px 16px",textAlign:"left",fontSize:"0.7rem",fontWeight:700,color:"#94a3b8",letterSpacing:"0.06em",textTransform:"uppercase" as const,whiteSpace:"nowrap" as const,fontFamily:"'Inter',system-ui,sans-serif"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map(p=>{
                  const ingTotal=p.ingredients.length
                  const certifiedCount=p.ingredients.filter(i=>i.certFile).length
                  const halalPct=ingTotal>0?Math.round(certifiedCount/ingTotal*100):0
                  const catalogItem=CATALOG.find(c=>c.key===p.catalogKey)
                  return(
                    <tr key={p.id} style={{borderBottom:`1px solid ${C.border}`,transition:"background 0.1s"}}
                      onMouseOver={e=>(e.currentTarget.style.background="#f8fafc")}
                      onMouseOut={e=>(e.currentTarget.style.background="transparent")}>

                      {/* Product & Details */}
                      <td style={{padding:"13px 16px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <label title="Change photo" style={{width:44,height:44,borderRadius:10,background:"#f1f5f9",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem",flexShrink:0,overflow:"hidden",cursor:"pointer",position:"relative"}}
                            onMouseEnter={e=>{const ov=e.currentTarget.querySelector(".img-overlay") as HTMLElement;if(ov)ov.style.opacity="1"}}
                            onMouseLeave={e=>{const ov=e.currentTarget.querySelector(".img-overlay") as HTMLElement;if(ov)ov.style.opacity="0"}}>
                            {p.photo?<img src={p.photo} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:p.emoji}
                            <div className="img-overlay" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.15s",borderRadius:10}}>
                              <Camera size={13} color="#fff"/>
                            </div>
                            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                              const file=e.target.files?.[0];if(!file)return
                              const reader=new FileReader();reader.onload=ev=>updateProductPhotoInDb(p.id,ev.target?.result as string);reader.readAsDataURL(file);e.target.value=""
                            }}/>
                          </label>
                          <div style={{minWidth:0}}>
                            <div style={{fontSize:"0.875rem",fontWeight:700,color:C.textDark,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{p.name}</div>
                            <span style={{display:"inline-block",marginTop:3,fontSize:"0.68rem",padding:"1px 7px",borderRadius:99,fontWeight:600,background:catalogItem?"#eff6ff":"#f1f5f9",color:catalogItem?C.primary:C.muted}}>
                              {catalogItem?catalogItem.cat:"Custom"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Barcode / SKU */}
                      <td style={{padding:"13px 16px"}}>
                        <div style={{display:"flex",flexDirection:"column" as const,gap:5}}>
                          {p.barcode
                            ? <div style={{display:"flex",alignItems:"center",gap:5}}>
                                <Barcode size={12} color={C.muted} strokeWidth={1.5}/>
                                <span style={{fontSize:"0.76rem",fontFamily:"monospace",fontWeight:600,color:C.textDark,letterSpacing:"0.03em"}}>{p.barcode}</span>
                              </div>
                            : <span style={{fontSize:"0.73rem",color:"#cbd5e1"}}>No barcode</span>
                          }
                          {p.code
                            ? <span style={{display:"inline-block",fontSize:"0.7rem",fontFamily:"monospace",fontWeight:700,color:C.primary,background:"#eff6ff",padding:"1px 7px",borderRadius:5,alignSelf:"flex-start" as const}}>SKU: {p.code}</span>
                            : <span style={{fontSize:"0.7rem",color:"#cbd5e1"}}>No SKU</span>
                          }
                        </div>
                      </td>

                      {/* Ingredients count */}
                      <td style={{padding:"13px 16px"}}>
                        {ingTotal>0
                          ? <div style={{display:"flex",alignItems:"center",gap:5}}>
                              <FlaskConical size={13} color={C.muted} strokeWidth={1.5}/>
                              <span style={{fontSize:"0.78rem",fontWeight:600,color:C.text}}>{ingTotal}</span>
                              <span style={{fontSize:"0.72rem",color:C.muted}}>items</span>
                            </div>
                          : <span style={{fontSize:"0.75rem",color:"#cbd5e1"}}>—</span>
                        }
                      </td>

                      {/* Certificates Uploaded */}
                      <td style={{padding:"13px 16px"}}>
                        {ingTotal===0
                          ? <span style={{fontSize:"0.75rem",color:"#cbd5e1"}}>—</span>
                          : <div>
                              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                                <span style={{fontSize:"0.8rem",fontWeight:700,color:certifiedCount===ingTotal?GREEN:certifiedCount>0?C.primary:"#94a3b8"}}>
                                  {halalPct}%
                                </span>
                                <span style={{fontSize:"0.7rem",color:C.muted}}>{certifiedCount}/{ingTotal} certified</span>
                              </div>
                              <div style={{height:6,borderRadius:99,background:"#f1f5f9",overflow:"hidden"}}>
                                <div style={{height:"100%",width:`${halalPct}%`,background:certifiedCount===ingTotal?GREEN:C.primary,borderRadius:99,transition:"width 0.4s ease"}}/>
                              </div>
                            </div>
                        }
                      </td>

                      {/* Added */}
                      <td style={{padding:"13px 16px",color:C.muted,fontSize:"0.77rem",whiteSpace:"nowrap" as const}}>
                        {new Date(p.addedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
                      </td>

                      {/* Actions */}
                      <td style={{padding:"13px 16px",textAlign:"right" as const}}>
                        <div style={{display:"inline-flex",gap:5}}>
                          <button onClick={()=>setViewProduct(p)}
                            style={{width:28,height:28,borderRadius:7,background:"transparent",border:`1px solid ${C.border}`,cursor:"pointer",color:C.muted,transition:"all 0.1s",display:"flex",alignItems:"center",justifyContent:"center"}}
                            onMouseOver={e=>{e.currentTarget.style.background="#eff6ff";e.currentTarget.style.borderColor="#bfdbfe";e.currentTarget.style.color=BLUE}}
                            onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted}}>
                            <Eye size={12}/>
                          </button>
                          <button onClick={()=>openEditProduct(p)}
                            style={{width:28,height:28,borderRadius:7,background:"transparent",border:`1px solid ${C.border}`,cursor:"pointer",color:C.muted,transition:"all 0.1s",display:"flex",alignItems:"center",justifyContent:"center"}}
                            onMouseOver={e=>{e.currentTarget.style.background="#f0fdf4";e.currentTarget.style.borderColor="#bbf7d0";e.currentTarget.style.color=GREEN}}
                            onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted}}>
                            <Pencil size={12}/>
                          </button>
                          <button onClick={()=>deleteProductFromDb(p.id)}
                            style={{width:28,height:28,borderRadius:7,background:"transparent",border:`1px solid ${C.border}`,cursor:"pointer",color:C.muted,transition:"all 0.1s",display:"flex",alignItems:"center",justifyContent:"center"}}
                            onMouseOver={e=>{e.currentTarget.style.background="#fee2e2";e.currentTarget.style.borderColor="#fecaca";e.currentTarget.style.color=RED}}
                            onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted}}>
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
          )}
        </div>

        {/* ── Product view modal ── */}
        {viewProduct&&(()=>{
          const vp=viewProduct
          const factory=factories.find(f=>f.id===vp.factoryId)
          const catalogItem=CATALOG.find(c=>c.key===vp.catalogKey)
          const total=vp.ingredients.length
          return(
            <div style={{position:"fixed",inset:0,background:"rgba(15,33,112,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
              onClick={e=>{if(e.target===e.currentTarget)setViewProduct(null)}}>
              <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:520,maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.22)"}}>
                {/* Header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:52,height:52,borderRadius:12,background:"#f1f5f9",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem",overflow:"hidden",flexShrink:0}}>
                      {vp.photo?<img src={vp.photo} alt={vp.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:vp.emoji}
                    </div>
                    <div>
                      <div style={{fontSize:"1rem",fontWeight:700,color:DARK}}>{vp.name}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}>
                        {vp.code&&<span style={{fontSize:"0.72rem",fontFamily:"monospace",fontWeight:600,color:C.primary,background:"#eff6ff",padding:"1px 7px",borderRadius:5}}>{vp.code}</span>}
                        {vp.barcode&&<span style={{fontSize:"0.7rem",fontFamily:"monospace",color:C.muted,display:"flex",alignItems:"center",gap:3}}><Barcode size={11}/>{vp.barcode}</span>}
                        {catalogItem&&<span style={{fontSize:"0.7rem",padding:"1px 7px",borderRadius:99,background:"#f1f5f9",color:C.muted}}>{catalogItem.cat}</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>setViewProduct(null)} style={{width:30,height:30,borderRadius:8,background:"#f1f5f9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}><X size={14} color="#64748b"/></button>
                </div>
                {/* Body */}
                <div style={{flex:1,overflowY:"auto",padding:"20px 22px",display:"flex",flexDirection:"column",gap:16}}>
                  {/* Factory */}
                  {factory&&(
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"#f8fafc",borderRadius:9,border:`1px solid ${C.border}`}}>
                      <div style={{width:32,height:32,borderRadius:8,background:"#fff",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                        {factory.photo?<img src={factory.photo} alt={factory.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<FactoryIcon size={15} color={BLUE}/>}
                      </div>
                      <div>
                        <div style={{fontSize:"0.8rem",fontWeight:600,color:DARK}}>{factory.name}</div>
                        <div style={{fontSize:"0.7rem",color:C.muted,display:"flex",alignItems:"center",gap:3}}><MapPin size={9} color="#94a3b8"/>{[factory.city,factory.country].filter(Boolean).join(", ")}</div>
                      </div>
                    </div>
                  )}
                  {/* Ingredients + cert status */}
                  {total>0&&(
                    <div>
                      <div style={{fontSize:"0.72rem",fontWeight:700,color:C.muted,textTransform:"uppercase" as const,letterSpacing:"0.08em",marginBottom:10}}>
                        Ingredients ({total}) — {vp.ingredients.filter(i=>i.certFile).length}/{total} certified halal
                      </div>
                      <div style={{display:"flex",flexDirection:"column" as const,gap:6}}>
                        {vp.ingredients.map(ing=>(
                          <div key={ing.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 13px",borderRadius:8,border:`1.5px solid ${ing.certFile?"#bbf7d0":C.border}`,background:ing.certFile?"#f0fdf4":"#f8fafc"}}>
                            <span style={{fontSize:"0.82rem",color:DARK,fontWeight:500}}>{ing.name}</span>
                            {ing.certFile
                              ? <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  <span style={{fontSize:"0.7rem",fontWeight:700,color:GREEN}}>Halal</span>
                                  <span style={{fontSize:"0.67rem",color:"#15803d",opacity:0.7,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>({ing.certName})</span>
                                </div>
                              : <span style={{fontSize:"0.7rem",color:"#94a3b8",flexShrink:0}}>No cert</span>
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Footer */}
                <div style={{padding:"12px 22px",borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:"0.72rem",color:C.muted}}>Added {new Date(vp.addedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</span>
                  <button onClick={()=>setViewProduct(null)} style={{padding:"7px 18px",borderRadius:8,background:"#f1f5f9",border:"none",cursor:"pointer",fontSize:"0.82rem",fontWeight:600,color:DARK,fontFamily:"inherit"}}>Close</button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── Map popup ── */}
        {mapPopup&&(
          <div style={{position:"fixed",inset:0,background:"rgba(15,33,112,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
            onClick={e=>{if(e.target===e.currentTarget)setMapPopup(null)}}>
            <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:560,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #e2e8f0"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:34,height:34,borderRadius:9,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center"}}><Map size={16} color={BLUE}/></div>
                  <div>
                    <div style={{fontSize:"0.9rem",fontWeight:700,color:DARK}}>{mapPopup.name}</div>
                    <div style={{fontSize:"0.72rem",color:"#64748b",display:"flex",alignItems:"center",gap:3}}><MapPin size={10} color="#94a3b8"/>{[mapPopup.city,mapPopup.country].filter(Boolean).join(", ")}</div>
                  </div>
                </div>
                <button onClick={()=>setMapPopup(null)} style={{width:30,height:30,borderRadius:8,background:"#f1f5f9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}><X size={14} color="#64748b"/></button>
              </div>
              <iframe src={`https://www.openstreetmap.org/export/embed.html?bbox=${(parseFloat(mapPopup.lng||"101.6869")-0.12).toFixed(4)},${(parseFloat(mapPopup.lat||"3.1390")-0.09).toFixed(4)},${(parseFloat(mapPopup.lng||"101.6869")+0.12).toFixed(4)},${(parseFloat(mapPopup.lat||"3.1390")+0.09).toFixed(4)}&layer=mapnik&marker=${mapPopup.lat||"3.1390"},${mapPopup.lng||"101.6869"}`}
                style={{width:"100%",height:320,display:"block",border:"none"}} title={`Map — ${mapPopup.name}`}/>
              <div style={{padding:"10px 20px",background:"#f8fafc",borderTop:"1px solid #f1f5f9",fontSize:"0.72rem",color:"#94a3b8",display:"flex",gap:20}}>
                <span>Lat: {mapPopup.lat}</span><span>Lng: {mapPopup.lng}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete factory confirm ── */}
        {deleteConfirm&&(
          <div style={{position:"fixed",inset:0,background:"rgba(15,33,112,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:"#fff",borderRadius:14,padding:"28px 32px",width:"100%",maxWidth:380,textAlign:"center"}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:"#fef2f2",border:"1px solid #fecaca",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Trash2 size={20} color={RED}/></div>
              <p style={{fontSize:"1rem",fontWeight:700,color:DARK,margin:"0 0 8px"}}>Remove Factory?</p>
              <p style={{fontSize:"0.83rem",color:"#64748b",margin:"0 0 22px",lineHeight:1.6}}>This factory will be removed from your profile and will no longer appear in applications.</p>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setDeleteConfirm(null)} style={{flex:1,padding:"9px",borderRadius:8,background:"#f1f5f9",border:"none",cursor:"pointer",fontSize:"0.83rem",fontWeight:600,color:DARK,fontFamily:"inherit"}}>Cancel</button>
                <button onClick={()=>deleteFactory(deleteConfirm)} style={{flex:1,padding:"9px",borderRadius:8,background:RED,border:"none",cursor:"pointer",fontSize:"0.83rem",fontWeight:700,color:"#fff",fontFamily:"inherit"}}>Remove</button>
              </div>
            </div>
          </div>
        )}


        {/* ── Edit Product modal ── */}
        {editProduct&&(
          <div style={{position:"fixed",inset:0,background:"rgba(15,33,112,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
            onClick={e=>{if(e.target===e.currentTarget)closeEditProduct()}}>
            <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:640,maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.22)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:10,background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",overflow:"hidden",flexShrink:0,border:`1px solid ${C.border}`}}>
                    {editProduct.photo?<img src={editProduct.photo} alt={editProduct.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:editProduct.emoji}
                  </div>
                  <div>
                    <div style={{fontSize:"0.95rem",fontWeight:700,color:DARK}}>Edit Product</div>
                    <div style={{fontSize:"0.7rem",color:"#94a3b8"}}>Update details and ingredients</div>
                  </div>
                </div>
                <button onClick={closeEditProduct} style={{width:30,height:30,borderRadius:8,background:"#f1f5f9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}><X size={15} color="#64748b"/></button>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"22px 24px",display:"flex",flexDirection:"column",gap:12}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div>
                    <label style={{display:"block",fontSize:"0.72rem",fontWeight:600,color:DARK,marginBottom:5}}>Product Name *</label>
                    <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Product name"
                      style={{width:"100%",height:38,padding:"0 11px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:"0.83rem",color:DARK,outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"}}
                      onFocus={e=>(e.target.style.borderColor=BLUE)} onBlur={e=>(e.target.style.borderColor="#e2e8f0")}/>
                  </div>
                  <div>
                    <label style={{display:"block",fontSize:"0.72rem",fontWeight:600,color:DARK,marginBottom:5}}>SKU / Code</label>
                    <input value={editCode} onChange={e=>setEditCode(e.target.value)} placeholder="e.g. SKU-001"
                      style={{width:"100%",height:38,padding:"0 11px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:"0.83rem",color:DARK,outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"}}
                      onFocus={e=>(e.target.style.borderColor=BLUE)} onBlur={e=>(e.target.style.borderColor="#e2e8f0")}/>
                  </div>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"0.72rem",fontWeight:600,color:DARK,marginBottom:5}}>Barcode</label>
                  <div style={{position:"relative"}}>
                    <Barcode size={15} color="#94a3b8" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
                    <input value={editBarcode} onChange={e=>setEditBarcode(e.target.value)} placeholder="e.g. 9556123456789"
                      style={{width:"100%",height:38,padding:"0 11px 0 34px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:"0.83rem",color:DARK,outline:"none",boxSizing:"border-box" as const,fontFamily:"monospace"}}
                      onFocus={e=>(e.target.style.borderColor=BLUE)} onBlur={e=>(e.target.style.borderColor="#e2e8f0")}/>
                  </div>
                </div>
                <div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
                    <label style={{fontSize:"0.72rem",fontWeight:600,color:DARK}}>Ingredients</label>
                    <span style={{fontSize:"0.7rem",color:C.muted}}>Upload a halal cert per ingredient to mark it halal</span>
                  </div>
                  {editIngredients.length===0&&<div style={{fontSize:"0.78rem",color:"#94a3b8",marginBottom:8}}>No ingredients added yet.</div>}
                  {editIngredients.map(ing=>(
                    <div key={ing.id} style={{marginBottom:8,borderRadius:9,border:`1.5px solid ${ing.certFile?"#bbf7d0":C.border}`,background:ing.certFile?"#f0fdf4":"#fff",padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <input type="text" value={ing.name} onChange={e=>updateEditIngName(ing.id,e.target.value)} placeholder="Ingredient name"
                          style={{flex:1,height:32,padding:"0 9px",borderRadius:6,border:`1.5px solid ${ing.certFile?"#bbf7d0":"#e2e8f0"}`,fontSize:"0.8rem",outline:"none",fontFamily:"inherit",background:"transparent"}}
                          onFocus={e=>(e.target.style.borderColor=BLUE)} onBlur={e=>(e.target.style.borderColor=ing.certFile?"#bbf7d0":"#e2e8f0")}/>
                        {ing.certFile
                          ? <div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:99,background:"#dcfce7",border:"1px solid #bbf7d0"}}>
                              <span style={{fontSize:"0.7rem",fontWeight:700,color:GREEN}}>✓ Halal</span>
                              <button onClick={()=>removeEditIngCert(ing.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",color:"#16a34a",marginLeft:2,opacity:0.6}} title="Remove"><X size={10}/></button>
                            </div>
                          : <label style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:99,background:"#f1f5f9",border:"1px solid #e2e8f0",cursor:"pointer",whiteSpace:"nowrap" as const}}>
                              <span style={{fontSize:"0.7rem",fontWeight:600,color:C.muted}}>Upload Cert</span>
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>{
                                const file=e.target.files?.[0];if(!file)return
                                const reader=new FileReader()
                                reader.onload=ev=>updateEditIngCert(ing.id,ev.target?.result as string,file.name)
                                reader.readAsDataURL(file);e.target.value=""
                              }}/>
                            </label>
                        }
                        <button onClick={()=>removeEditIng(ing.id)} style={{background:"none",border:"none",borderRadius:6,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#cbd5e1",flexShrink:0}} onMouseOver={e=>(e.currentTarget.style.color=RED)} onMouseOut={e=>(e.currentTarget.style.color="#cbd5e1")}><X size={12}/></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={addEditIng} style={{background:"none",border:"none",color:BLUE,fontSize:"0.8rem",fontWeight:600,cursor:"pointer",padding:"4px 0",display:"flex",alignItems:"center",gap:4,fontFamily:"inherit"}}>
                    <Plus size={14}/> Add Ingredient
                  </button>
                </div>
              </div>
              <div style={{padding:"16px 24px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"flex-end",gap:10,flexShrink:0}}>
                <button onClick={closeEditProduct} style={{padding:"9px 18px",borderRadius:8,border:`1.5px solid ${C.border}`,background:"#fff",color:DARK,fontSize:"0.83rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                <button onClick={saveEditProductToDb} disabled={!editName.trim()}
                  style={{padding:"9px 22px",borderRadius:8,background:editName.trim()?BLUE:"#e2e8f0",border:"none",cursor:editName.trim()?"pointer":"not-allowed",fontSize:"0.83rem",fontWeight:700,color:"#fff",fontFamily:"inherit"}}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add Factory modal ── */}
        {showFacModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(15,33,112,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
            onClick={e=>{if(e.target===e.currentTarget)closeFacModal()}}>
            <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:920,maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:9,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}><FactoryIcon size={18} color={BLUE}/></div>
                  <div>
                    <div style={{fontSize:"0.95rem",fontWeight:700,color:DARK}}>{editId?"Edit Factory":"Add Factory"}</div>
                    <div style={{fontSize:"0.7rem",color:"#94a3b8"}}>Production facility details</div>
                  </div>
                </div>
                <button onClick={closeFacModal} style={{width:30,height:30,borderRadius:8,background:"#f1f5f9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}><X size={15} color="#64748b"/></button>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
                {/* Factory photo */}
                <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,padding:"14px 16px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0"}}>
                  <div style={{width:64,height:64,borderRadius:12,background:"#fff",border:"1.5px dashed #cbd5e1",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                    {form.photo
                      ? <img src={form.photo} alt="Factory" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      : <FactoryIcon size={26} color="#cbd5e1" strokeWidth={1.5}/>
                    }
                  </div>
                  <div>
                    <div style={{fontSize:"0.8rem",fontWeight:600,color:DARK,marginBottom:4}}>Factory Photo</div>
                    <div style={{fontSize:"0.72rem",color:"#64748b",marginBottom:8}}>Upload a photo or logo for this factory</div>
                    <div style={{display:"flex",gap:8}}>
                      <label style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:"0.75rem",fontWeight:600,color:BLUE}}>
                        <Camera size={12}/> Upload Photo
                        <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                          const file=e.target.files?.[0];if(!file)return
                          const reader=new FileReader();reader.onload=ev=>setField("photo",ev.target?.result as string);reader.readAsDataURL(file);e.target.value=""
                        }}/>
                      </label>
                      {form.photo&&<button type="button" onClick={()=>setField("photo","")} style={{padding:"5px 10px",borderRadius:6,background:"transparent",border:"1px solid #fecaca",cursor:"pointer",fontSize:"0.75rem",color:RED}}>Remove</button>}
                    </div>
                  </div>
                </div>
                <div style={{marginBottom:18}}>
                  <label style={lbl}>Factory / Plant Name <span style={{color:RED}}>*</span></label>
                  <input value={form.name} onChange={e=>setField("name",e.target.value)} style={inp} onFocus={iFocus} onBlur={iBlur} placeholder="e.g. Main Production Plant"/>
                </div>
                <div style={{marginBottom:18}}>
                  <label style={lbl}>Activity Category <span style={{color:RED}}>*</span></label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:8}}>
                    {activityCategories.map(cat=>{
                      const selected=form.activityCategories.includes(cat.key)
                      return(
                        <button key={cat.key} type="button" onClick={()=>toggleActivityCategory(cat.key)}
                          style={{padding:"14px 10px 12px",borderRadius:10,border:selected?`2px solid ${BLUE}`:"1.5px solid #e2e8f0",background:selected?"#eff6ff":"#fafafa",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:7,fontFamily:"inherit",transition:"all 0.15s",textAlign:"center" as const,minHeight:72}}
                          onMouseOver={e=>{if(!selected)e.currentTarget.style.background="#f4f6f8"}}
                          onMouseOut={e=>{if(!selected)e.currentTarget.style.background="#fafafa"}}
                        >
                          <cat.Icon size={22} color={selected?BLUE:"#94a3b8"} strokeWidth={1.5}/>
                          <div style={{fontSize:"0.72rem",fontWeight:selected?700:500,color:selected?BLUE:"#374151",lineHeight:1.3}}>{cat.label}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{marginBottom:18}}>
                  <label style={lbl}>Specific Activities</label>
                  <p style={{margin:"0 0 10px",fontSize:"0.75rem",color:"#6b7280"}}>Select all activities that apply to this factory</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                    {SPECIFIC_ACTIVITIES.map(activity=>{
                      const selected=form.specificActivities.includes(activity.key)
                      return(
                        <button key={activity.key} type="button" onClick={()=>toggleSpecificActivity(activity.key)}
                          style={{padding:"6px 13px",borderRadius:999,cursor:"pointer",fontFamily:"inherit",border:selected?`1.5px solid ${BLUE}`:"1px solid #e2e8f0",background:selected?"#eff6ff":"#fff",fontSize:"0.78rem",fontWeight:selected?600:400,color:selected?BLUE:"#374151",display:"flex",alignItems:"center",gap:5,transition:"all 0.1s"}}
                          onMouseOver={e=>{if(!selected)e.currentTarget.style.background="#f8fafc"}}
                          onMouseOut={e=>{if(!selected)e.currentTarget.style.background="#fff"}}
                        >
                          <span style={{fontSize:"0.85rem"}}>{activity.emoji}</span>{activity.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                  <div>
                    <label style={lbl}>Country</label>
                    <div ref={countryRef} style={{position:"relative"}}>
                      <input type="text" value={countryQuery}
                        onChange={e=>{setCountryQuery(e.target.value);setShowCountryDrop(true)}}
                        onFocus={e=>{setShowCountryDrop(true);e.target.style.borderColor=BLUE}}
                        onBlur={e=>(e.target.style.borderColor="#e2e8f0")}
                        style={{...inp,paddingRight:28}}/>
                      <ChevronDown size={13} color="#94a3b8" style={{position:"absolute",right:9,top:"50%",transform:`translateY(-50%) rotate(${showCountryDrop?"180":"0"}deg)`,transition:"transform 0.15s",pointerEvents:"none"}}/>
                      {showCountryDrop&&filteredCountries.length>0&&(
                        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.10)",zIndex:300,maxHeight:180,overflowY:"auto"}}>
                          {filteredCountries.map(c=>(
                            <button key={c} type="button" onMouseDown={()=>selectCountry(c)}
                              style={{display:"block",width:"100%",textAlign:"left",padding:"7px 13px",background:c===form.country?"#eff6ff":"transparent",border:"none",cursor:"pointer",fontSize:"0.8125rem",color:c===form.country?BLUE:DARK,fontWeight:c===form.country?600:400,fontFamily:"inherit"}}
                              onMouseOver={e=>{if(c!==form.country)e.currentTarget.style.background="#f8fafc"}}
                              onMouseOut={e=>{if(c!==form.country)e.currentTarget.style.background="transparent"}}
                            >{c}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>City</label>
                    <input value={form.city} onChange={e=>setField("city",e.target.value)} style={inp} onFocus={iFocus} onBlur={iBlur} placeholder="e.g. Kuala Lumpur"/>
                  </div>
                </div>
                <div style={{marginBottom:14}}>
                  <label style={lbl}>Full Address</label>
                  <input value={form.address} onChange={e=>setField("address",e.target.value)} style={inp} onFocus={iFocus} onBlur={iBlur} placeholder="Street, postcode, state…"/>
                </div>
                <div style={{marginBottom:18}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <MapPin size={12} color={BLUE}/><span style={{fontSize:"0.72rem",fontWeight:600,color:DARK}}>Pin Location</span>
                      <span style={{fontSize:"0.65rem",color:"#94a3b8"}}>— {form.lat}, {form.lng}</span>
                    </div>
                    <button type="button" onClick={locate}
                      style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:6,background:"#eff6ff",border:"1px solid #bfdbfe",color:BLUE,fontSize:"0.7rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      <MapPin size={10}/>{geoLoading?"Locating…":"My Location"}
                    </button>
                  </div>
                  <iframe src={modalMapSrc} style={{width:"100%",height:200,border:"1px solid #e2e8f0",borderRadius:8,display:"block"}} title="Factory location"/>
                </div>
                <div style={{background:"#f8fafc",border:"1px solid #f1f5f9",borderRadius:10,padding:"16px 18px",marginBottom:8}}>
                  <p style={{margin:"0 0 14px",fontSize:"0.72rem",fontWeight:700,color:BLUE,letterSpacing:"0.08em",textTransform:"uppercase" as const}}>PRODUCTION DETAILS</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div>
                      <label style={lbl}>Production Lines</label>
                      <input type="number" min="0" value={form.prodLines} onChange={e=>setField("prodLines",e.target.value)} style={{...inp,background:"#fff"}} onFocus={iFocus} onBlur={iBlur} placeholder="0"/>
                    </div>
                    <div>
                      <label style={lbl}>Annual Volume</label>
                      <div style={{display:"flex",gap:6}}>
                        <input type="number" min="0" value={form.prodVolume} onChange={e=>setField("prodVolume",e.target.value)} style={{...inp,background:"#fff",flex:1}} onFocus={iFocus} onBlur={iBlur} placeholder="0"/>
                        <select value={form.volUnit} onChange={e=>setField("volUnit",e.target.value)} style={{...inp,width:80,cursor:"pointer",background:"#fff",flexShrink:0}} onFocus={iFocus} onBlur={iBlur}>
                          {VOL_UNITS.map(u=><option key={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#f8fafc",border:"1px solid #f1f5f9",borderRadius:10,padding:"16px 18px"}}>
                  <p style={{margin:"0 0 14px",fontSize:"0.72rem",fontWeight:700,color:BLUE,letterSpacing:"0.08em",textTransform:"uppercase" as const}}>CERTIFICATES &amp; DOCUMENTS</p>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {CERT_TYPES.map(type=>{
                      const uploaded=form.certUploads.find(c=>c.type===type)
                      const fmtSize=(b:number)=>b<1048576?`${(b/1024).toFixed(1)} KB`:`${(b/1048576).toFixed(1)} MB`
                      return(
                        <div key={type} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",border:`1px solid ${uploaded?"#bfdbfe":"#e2e8f0"}`,borderRadius:8,background:uploaded?"#eff6ff":"#fff"}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:"0.78rem",fontWeight:600,color:uploaded?BLUE:DARK}}>{type}</div>
                            {uploaded&&<div style={{fontSize:"0.67rem",color:"#64748b",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{uploaded.fileName} · {fmtSize(uploaded.fileSize)}</div>}
                          </div>
                          {uploaded
                            ?<button type="button" onClick={()=>removeCert(type)} style={{width:24,height:24,borderRadius:"50%",background:"#fff",border:"1px solid #bfdbfe",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0}}><X size={11} color={RED}/></button>
                            :<label style={{padding:"4px 11px",borderRadius:6,background:"#fff",color:BLUE,fontSize:"0.7rem",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" as const,flexShrink:0,border:"1px solid #e2e8f0"}}>Upload<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>{const f=e.target.files?.[0];if(f)addCert(type,f);e.target.value=""}} style={{display:"none"}}/></label>
                          }
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div style={{padding:"14px 24px",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"flex-end",gap:10,flexShrink:0}}>
                <button onClick={closeFacModal} style={{padding:"9px 20px",borderRadius:8,background:"#f1f5f9",border:"none",cursor:"pointer",fontSize:"0.83rem",fontWeight:600,color:DARK,fontFamily:"inherit"}}>Cancel</button>
                <button onClick={saveFactory} disabled={!canSaveFactory} style={{padding:"9px 22px",borderRadius:8,background:canSaveFactory?BLUE:"#cbd5e1",border:"none",cursor:canSaveFactory?"pointer":"not-allowed",fontSize:"0.83rem",fontWeight:700,color:"#fff",fontFamily:"inherit"}}>
                  {editId?"Save Changes":"Add Factory"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add Product modal ── */}
        {showProdModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(15,33,112,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
            onClick={e=>{if(e.target===e.currentTarget)closeProdModal()}}>
            <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:1060,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{padding:"20px 24px",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:"1.05rem",fontWeight:700,color:DARK}}>{modalStep===1?"Add Product":"Configure Product"}</div>
                  <div style={{fontSize:"0.75rem",color:"#64748b",marginTop:2,display:"flex",alignItems:"center",gap:8}}>
                    {modalStep===1?"Step 1 of 2 — Choose from catalog":"Step 2 of 2 — Set details"}
                    {prodFactoryId&&factories.find(f=>f.id===prodFactoryId)&&(
                      <span style={{padding:"1px 8px",borderRadius:10,background:"#eff6ff",color:BLUE,fontWeight:600}}>{factories.find(f=>f.id===prodFactoryId)!.name}</span>
                    )}
                  </div>
                </div>
                <button onClick={closeProdModal} style={{background:"#f1f5f9",border:"none",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={16} color="#64748b"/></button>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
                {modalStep===1&&(
                  <>
                    <input type="text" placeholder="Search products..." value={catalogSearch} onChange={e=>setCatalogSearch(e.target.value)}
                      style={{width:"100%",padding:"9px 14px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:"0.85rem",outline:"none",marginBottom:14,boxSizing:"border-box" as const}}/>
                    <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:16,paddingBottom:4}}>
                      {["All",...PRODUCT_CATEGORIES].map(cat=>(
                        <button key={cat} onClick={()=>setCatalogCat(cat)}
                          style={{padding:"6px 14px",borderRadius:20,fontSize:"0.75rem",fontWeight:600,cursor:"pointer",border:"none",whiteSpace:"nowrap",background:catalogCat===cat?BLUE:"#f1f5f9",color:catalogCat===cat?"#fff":"#64748b"}}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
                      {catalogFiltered.map(item=>{
                        const isSel=selectedCatalog?.key===item.key
                        return(
                          <div key={item.key} onClick={()=>setSelectedCatalog(isSel?null:item)}
                            style={{cursor:"pointer",border:`1.5px solid ${isSel?BLUE:"#e2e8f0"}`,borderRadius:10,padding:"14px 10px",textAlign:"center" as const,background:isSel?"#eff6ff":"#fafafa",display:"flex",flexDirection:"column",alignItems:"center",gap:7,transition:"all 0.12s"}}>
                            <span style={{fontSize:"2rem"}}>{item.emoji}</span>
                            <span style={{fontSize:"0.72rem",fontWeight:600,color:isSel?BLUE:DARK,lineHeight:1.3}}>{item.name}</span>
                            <span style={{fontSize:"0.62rem",color:"#94a3b8"}}>{item.cat}</span>
                          </div>
                        )
                      })}
                    </div>
                    {catalogFiltered.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:"40px 0",fontSize:"0.85rem"}}>No products match your search</div>}
                  </>
                )}
                {modalStep===2&&(
                  <>
                    <button onClick={()=>setModalStep(1)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:BLUE,fontSize:"0.8rem",fontWeight:600,marginBottom:16,padding:0}}>
                      <ArrowLeft size={14}/> Back to catalog
                    </button>
                    {!isCustom&&selectedCatalog&&(
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"12px 16px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0"}}>
                        <span style={{fontSize:"2rem"}}>{selectedCatalog.emoji}</span>
                        <div><div style={{fontSize:"0.95rem",fontWeight:700,color:DARK}}>{selectedCatalog.name}</div><div style={{fontSize:"0.72rem",color:"#64748b"}}>{selectedCatalog.cat}</div></div>
                      </div>
                    )}
                    {isCustom&&(
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"12px 16px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0"}}>
                        <span style={{fontSize:"2rem"}}>📦</span>
                        <div><div style={{fontSize:"0.95rem",fontWeight:700,color:DARK}}>Custom Product</div><div style={{fontSize:"0.72rem",color:"#64748b"}}>Define your own product</div></div>
                      </div>
                    )}
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {/* Photo upload */}
                      <div>
                        <label style={{display:"block",fontSize:"0.78rem",fontWeight:600,color:DARK,marginBottom:8}}>Product Photo <span style={{fontWeight:400,color:"#94a3b8"}}>(optional)</span></label>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <div style={{width:56,height:56,borderRadius:12,background:"#f8fafc",border:"1.5px dashed #cbd5e1",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                            {formPhoto
                              ? <img src={formPhoto} alt="product" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                              : <span style={{fontSize:"1.8rem"}}>{selectedCatalog?.emoji??"📦"}</span>
                            }
                          </div>
                          <div style={{display:"flex",gap:8}}>
                            <label style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:7,background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:"0.75rem",fontWeight:600,color:BLUE}}>
                              <Camera size={12}/> Upload Photo
                              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                                const file=e.target.files?.[0];if(!file)return
                                const reader=new FileReader();reader.onload=ev=>setFormPhoto(ev.target?.result as string);reader.readAsDataURL(file);e.target.value=""
                              }}/>
                            </label>
                            {formPhoto&&<button type="button" onClick={()=>setFormPhoto("")} style={{padding:"6px 10px",borderRadius:7,background:"transparent",border:"1px solid #fecaca",cursor:"pointer",fontSize:"0.75rem",color:RED}}>Remove</button>}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label style={{display:"block",fontSize:"0.78rem",fontWeight:600,color:DARK,marginBottom:5}}>Product Name <span style={{color:RED}}>*</span></label>
                        <input type="text" value={formName} onChange={e=>setFormName(e.target.value)} placeholder="e.g. Halal Chicken Nuggets"
                          style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:"0.85rem",outline:"none",boxSizing:"border-box" as const}}/>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                        <div>
                          <label style={{display:"block",fontSize:"0.78rem",fontWeight:600,color:DARK,marginBottom:5}}>Product Code / SKU</label>
                          <input type="text" value={formCode} onChange={e=>setFormCode(e.target.value)} placeholder="e.g. SKU-001"
                            style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:"0.85rem",outline:"none",boxSizing:"border-box" as const}}/>
                        </div>
                        <div>
                          <label style={{display:"block",fontSize:"0.78rem",fontWeight:600,color:DARK,marginBottom:5}}>Barcode</label>
                          <input type="text" value={formBarcode} onChange={e=>setFormBarcode(e.target.value)} placeholder="e.g. 9556123456789"
                            style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:"0.85rem",outline:"none",boxSizing:"border-box" as const,fontFamily:"monospace"}}/>
                        </div>
                      </div>
                      {!prodFactoryId&&(
                        <div>
                          <label style={{display:"block",fontSize:"0.78rem",fontWeight:600,color:DARK,marginBottom:5}}>Factory</label>
                          <select value={prodFactoryId} onChange={e=>setProdFactoryId(e.target.value)}
                            style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:"0.85rem",outline:"none",boxSizing:"border-box" as const,background:"#fff",color:prodFactoryId?DARK:"#94a3b8"}}>
                            <option value="">— Select a factory —</option>
                            {factories.map(f=><option key={f.id} value={f.id}>{f.name} ({f.city}, {f.country})</option>)}
                          </select>
                        </div>
                      )}
                      {/* Ingredients + per-ingredient cert */}
                      <div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                          <label style={{fontSize:"0.78rem",fontWeight:600,color:DARK}}>Ingredients</label>
                          <span style={{fontSize:"0.7rem",color:C.muted}}>Upload cert per ingredient to mark halal</span>
                        </div>
                        {formIngredients.length===0&&<div style={{fontSize:"0.78rem",color:"#94a3b8",marginBottom:8}}>No ingredients added yet.</div>}
                        {formIngredients.map(ing=>(
                          <div key={ing.id} style={{marginBottom:8,borderRadius:9,border:`1.5px solid ${ing.certFile?"#bbf7d0":C.border}`,background:ing.certFile?"#f0fdf4":"#fff",padding:"10px 12px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <input type="text" value={ing.name} onChange={e=>updateIngName(ing.id,e.target.value)} placeholder="Ingredient name"
                                style={{flex:1,height:32,padding:"0 9px",borderRadius:6,border:`1.5px solid ${ing.certFile?"#bbf7d0":"#e2e8f0"}`,fontSize:"0.8rem",outline:"none",background:"transparent"}}/>
                              {ing.certFile
                                ? <div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:99,background:"#dcfce7",border:"1px solid #bbf7d0"}}>
                                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    <span style={{fontSize:"0.7rem",fontWeight:700,color:GREEN}}>Halal</span>
                                    <button onClick={()=>removeIngCert(ing.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",color:"#16a34a",marginLeft:2,opacity:0.6}} title="Remove certificate"><X size={10}/></button>
                                  </div>
                                : <label style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:99,background:"#f1f5f9",border:"1px solid #e2e8f0",cursor:"pointer",whiteSpace:"nowrap" as const}}>
                                    <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="#94a3b8" strokeWidth="1.5"/><line x1="10" y1="7" x2="10" y2="13" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/><line x1="7" y1="10" x2="13" y2="10" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                    <span style={{fontSize:"0.7rem",fontWeight:600,color:C.muted}}>Upload Cert</span>
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>{
                                      const file=e.target.files?.[0];if(!file)return
                                      const reader=new FileReader()
                                      reader.onload=ev=>updateIngCert(ing.id,ev.target?.result as string,file.name)
                                      reader.readAsDataURL(file);e.target.value=""
                                    }}/>
                                  </label>
                              }
                              <button onClick={()=>removeIngredient(ing.id)} style={{background:"none",border:"none",borderRadius:6,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#cbd5e1",flexShrink:0}} onMouseOver={e=>(e.currentTarget.style.color=RED)} onMouseOut={e=>(e.currentTarget.style.color="#cbd5e1")}><X size={12}/></button>
                            </div>
                            {ing.certFile&&(
                              <div style={{marginTop:5,fontSize:"0.68rem",color:"#15803d",display:"flex",alignItems:"center",gap:4}}>
                                <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="#15803d" strokeWidth="1.5"/><polyline points="7,10 9,12 13,8" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                {ing.certName}
                              </div>
                            )}
                          </div>
                        ))}
                        <button onClick={addIngredient} style={{background:"none",border:"none",color:BLUE,fontSize:"0.8rem",fontWeight:600,cursor:"pointer",padding:"4px 0",display:"flex",alignItems:"center",gap:4}}>
                          <Plus size={14}/> Add Ingredient
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div style={{padding:"16px 24px",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"flex-end",gap:10}}>
                {modalStep===1&&(
                  <>
                    <button onClick={()=>{setIsCustom(true);setSelectedCatalog(null);goToStep2(null,true)}}
                      style={{padding:"9px 18px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",color:DARK,fontSize:"0.85rem",fontWeight:600,cursor:"pointer"}}>Custom Product</button>
                    <button disabled={!selectedCatalog} onClick={()=>selectedCatalog&&goToStep2(selectedCatalog,false)}
                      style={{padding:"9px 18px",borderRadius:8,border:"none",background:selectedCatalog?BLUE:"#e2e8f0",color:selectedCatalog?"#fff":"#94a3b8",fontSize:"0.85rem",fontWeight:600,cursor:selectedCatalog?"pointer":"not-allowed",display:"flex",alignItems:"center",gap:6}}>
                      Next <ChevronRight size={15}/>
                    </button>
                  </>
                )}
                {modalStep===2&&(
                  <>
                    <button onClick={closeProdModal} style={{padding:"9px 18px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",color:DARK,fontSize:"0.85rem",fontWeight:600,cursor:"pointer"}}>Cancel</button>
                    <button disabled={!formName.trim()} onClick={saveProductToDb}
                      style={{padding:"9px 18px",borderRadius:8,border:"none",background:formName.trim()?GREEN:"#e2e8f0",color:formName.trim()?"#fff":"#94a3b8",fontSize:"0.85rem",fontWeight:600,cursor:formName.trim()?"pointer":"not-allowed"}}>
                      Save Product
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </CustomerLayout>
  )
}
