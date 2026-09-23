import { useState, useEffect } from "react"
import { Trash2, Plus, X, ChevronRight, ArrowLeft } from "lucide-react"
import CustomerLayout from "./CustomerLayout"

// ─── Design tokens ───────────────────────────────────────────────────────────
const BLUE  = "#2563eb"
const DARK  = "#111827"
// const NAV   = "#0f2170"
const GREEN = "#16a34a"
// const RED   = "#dc2626"

// ─── Types ───────────────────────────────────────────────────────────────────
interface StoredProduct {
  id: string
  catalogKey: string
  emoji: string
  name: string
  code: string
  factoryId: string
  ingredients: IngredientRow[]
  addedAt: string
}

interface IngredientRow {
  id: string
  name: string
  status: "halal" | "to-verify" | "mushbooh" | "haram"
}

interface CatalogItem {
  key: string
  cat: string
  name: string
  emoji: string
  ing: string[]
}

interface AppFactory {
  id: string
  name: string
  country: string
  city: string
  lat: string
  lng: string
}

// ─── Catalog ─────────────────────────────────────────────────────────────────
const CATALOG: CatalogItem[] = [
  { key:"chicken-processed", cat:"Meat & Seafood",  name:"Processed Chicken",       emoji:"🍗", ing:["Chicken (Halal slaughtered)","Salt","Seasoning","Preservatives (E202)"] },
  { key:"beef-processed",    cat:"Meat & Seafood",  name:"Processed Beef",          emoji:"🥩", ing:["Beef (Halal slaughtered)","Salt","Spices","Citric Acid (E330)"] },
  { key:"fish-fillet",       cat:"Meat & Seafood",  name:"Fish Fillet",             emoji:"🐟", ing:["Fish","Salt","Sodium Tripolyphosphate","Water"] },
  { key:"shrimp-processed",  cat:"Meat & Seafood",  name:"Processed Shrimp",        emoji:"🦐", ing:["Shrimp","Salt","Sodium Metabisulphite (E223)","Water"] },
  { key:"canned-tuna",       cat:"Meat & Seafood",  name:"Canned Tuna",             emoji:"🐠", ing:["Tuna","Vegetable Oil","Salt","Water"] },
  { key:"frozen-chicken",    cat:"Meat & Seafood",  name:"Frozen Chicken (Whole)",  emoji:"🐔", ing:["Whole Chicken (Halal slaughtered)","Water","Salt"] },
  { key:"wheat-flour",       cat:"Grains & Cereals",name:"Wheat Flour",             emoji:"🌾", ing:["Wheat","Niacin (B3)","Iron","Thiamine (B1)","Riboflavin (B2)","Folic Acid"] },
  { key:"white-rice",        cat:"Grains & Cereals",name:"White Rice",              emoji:"🍚", ing:["Rice"] },
  { key:"instant-noodles",   cat:"Grains & Cereals",name:"Instant Noodles",         emoji:"🍜", ing:["Wheat Flour","Palm Oil","Salt","Tapioca Starch","Seasoning Powder"] },
  { key:"pasta",             cat:"Grains & Cereals",name:"Pasta",                   emoji:"🍝", ing:["Durum Wheat Semolina","Water","Egg (optional)"] },
  { key:"bread-loaf",        cat:"Grains & Cereals",name:"Bread",                   emoji:"🍞", ing:["Wheat Flour","Water","Yeast","Salt","Sugar","Vegetable Oil","Improver (E471)"] },
  { key:"breakfast-cereal",  cat:"Grains & Cereals",name:"Breakfast Cereal",        emoji:"🥣", ing:["Whole Grain Wheat","Sugar","Salt","Malt Extract","Vitamins (B1,B2,B3,B6,D)","Iron"] },
  { key:"fresh-milk",        cat:"Dairy & Eggs",    name:"Fresh Milk",              emoji:"🥛", ing:["Pasteurised Whole Milk","Vitamin A","Vitamin D3"] },
  { key:"uht-milk",          cat:"Dairy & Eggs",    name:"UHT Milk",                emoji:"🧃", ing:["Skimmed Milk Powder","Water","Sugar","Vegetable Oil","Minerals","Vitamins"] },
  { key:"yogurt",            cat:"Dairy & Eggs",    name:"Yogurt",                  emoji:"🍦", ing:["Whole Milk","Sugar","Live Cultures (S. thermophilus)","Pectin (E440)"] },
  { key:"processed-cheese",  cat:"Dairy & Eggs",    name:"Processed Cheese",        emoji:"🧀", ing:["Cheddar Cheese","Water","Emulsifying Salts (E331)","Salt","Colour (Annatto E160b)"] },
  { key:"ice-cream",         cat:"Dairy & Eggs",    name:"Ice Cream",               emoji:"🍨", ing:["Whole Milk","Sugar","Cream","Skim Milk Powder","Glucose Syrup","Emulsifier (E471)","Vanilla Flavour"] },
  { key:"butter",            cat:"Dairy & Eggs",    name:"Butter",                  emoji:"🧈", ing:["Cream (from Cow Milk)","Salt"] },
  { key:"mineral-water",     cat:"Beverages",       name:"Mineral Water",           emoji:"💧", ing:["Natural Mineral Water"] },
  { key:"fruit-juice",       cat:"Beverages",       name:"Fruit Juice",             emoji:"🧃", ing:["Fruit Juice (100%)","Citric Acid (E330)","Ascorbic Acid (Vitamin C)"] },
  { key:"carbonated-drink",  cat:"Beverages",       name:"Carbonated Drink",        emoji:"🥤", ing:["Carbonated Water","Sugar","Citric Acid (E330)","Natural Flavouring","Colour (E150d)"] },
  { key:"green-tea",         cat:"Beverages",       name:"Green Tea",               emoji:"🍵", ing:["Green Tea Leaves","Water"] },
  { key:"instant-coffee",    cat:"Beverages",       name:"Instant Coffee",          emoji:"☕", ing:["Coffee Extract","Sugar","Hydrogenated Vegetable Fat","Skimmed Milk Powder","Emulsifier (E471)"] },
  { key:"soy-milk",          cat:"Beverages",       name:"Soy Milk",                emoji:"🥛", ing:["Filtered Water","Soy Beans","Sugar","Calcium Carbonate","Sea Salt","Natural Flavour"] },
  { key:"energy-drink",      cat:"Beverages",       name:"Energy Drink",            emoji:"⚡", ing:["Water","Sugar","Citric Acid","Taurine","Caffeine","Niacin (B3)","Pantothenic Acid (B5)"] },
  { key:"chocolate-bar",     cat:"Confectionery & Snacks",name:"Chocolate Bar",     emoji:"🍫", ing:["Sugar","Cocoa Butter","Cocoa Mass","Milk Powder","Emulsifier (Lecithin E322)","Vanilla Flavour"] },
  { key:"candy-hard",        cat:"Confectionery & Snacks",name:"Hard Candy",        emoji:"🍬", ing:["Sugar","Glucose Syrup","Citric Acid (E330)","Natural Flavouring","Colour (E102)"] },
  { key:"cookies",           cat:"Confectionery & Snacks",name:"Cookies & Biscuits",emoji:"🍪", ing:["Wheat Flour","Sugar","Vegetable Fat","Eggs","Salt","Baking Soda","Vanilla Flavour"] },
  { key:"potato-chips",      cat:"Confectionery & Snacks",name:"Potato Chips",      emoji:"🥨", ing:["Potatoes","Vegetable Oil","Salt","Flavouring"] },
  { key:"cake",              cat:"Confectionery & Snacks",name:"Cake",              emoji:"🎂", ing:["Wheat Flour","Sugar","Eggs","Vegetable Oil","Milk","Baking Powder","Salt","Vanilla Extract"] },
  { key:"wafer",             cat:"Confectionery & Snacks",name:"Wafer Biscuit",     emoji:"🍘", ing:["Wheat Flour","Vegetable Fat","Sugar","Cocoa Powder","Salt","Emulsifier (E322)"] },
  { key:"chili-sauce",       cat:"Condiments & Sauces",name:"Chili Sauce",          emoji:"🌶️", ing:["Chili","Sugar","Vinegar","Salt","Modified Starch (E1442)","Garlic"] },
  { key:"soy-sauce",         cat:"Condiments & Sauces",name:"Soy Sauce",            emoji:"🫙", ing:["Water","Soy Beans","Wheat","Salt","Sugar","Caramel Colour (E150d)"] },
  { key:"tomato-ketchup",    cat:"Condiments & Sauces",name:"Tomato Ketchup",       emoji:"🍅", ing:["Tomatoes (Paste)","Sugar","Vinegar","Salt","Spices","Onion Powder"] },
  { key:"cooking-oil",       cat:"Condiments & Sauces",name:"Cooking Oil",          emoji:"🫒", ing:["Refined Palm Oil","Antioxidant (E307)","Antioxidant (E321)"] },
  { key:"margarine",         cat:"Condiments & Sauces",name:"Margarine",            emoji:"🧈", ing:["Vegetable Oil","Water","Salt","Emulsifier (E471)","Colour (Beta-Carotene E160a)","Vitamins A, D"] },
  { key:"spice-blend",       cat:"Condiments & Sauces",name:"Spice Blend / Seasoning",emoji:"🌿", ing:["Salt","Spices","Monosodium Glutamate (E621)","Sugar","Starch"] },
  { key:"tofu",              cat:"Plant-Based",     name:"Tofu",                    emoji:"🫘", ing:["Soy Beans","Water","Coagulant (Calcium Sulphate E516)"] },
  { key:"tempeh",            cat:"Plant-Based",     name:"Tempeh",                  emoji:"🫘", ing:["Soy Beans","Tempeh Starter (Rhizopus oligosporus)"] },
  { key:"vegetable-snack",   cat:"Plant-Based",     name:"Vegetable Snack",         emoji:"🥗", ing:["Mixed Vegetables","Sunflower Oil","Salt","Spices"] },
  { key:"vegan-protein",     cat:"Plant-Based",     name:"Vegan Protein Powder",    emoji:"🌱", ing:["Pea Protein Isolate","Brown Rice Protein","Natural Flavour","Stevia"] },
  { key:"almond-milk",       cat:"Plant-Based",     name:"Almond Milk",             emoji:"🥜", ing:["Water","Almonds","Calcium Carbonate","Sea Salt","Natural Flavour","Vitamins (E, B2, B12, D)"] },
  { key:"shampoo",           cat:"Cosmetics & Personal Care",name:"Shampoo",        emoji:"💇", ing:["Water","Sodium Laureth Sulphate (SLES)","Cocamidopropyl Betaine","Glycerin","Fragrance","Citric Acid","Preservative"] },
  { key:"body-lotion",       cat:"Cosmetics & Personal Care",name:"Body Lotion",    emoji:"🧴", ing:["Water","Glycerin","Petrolatum","Stearic Acid","Triethanolamine","Fragrance","Preservative (Phenoxyethanol)"] },
  { key:"face-cream",        cat:"Cosmetics & Personal Care",name:"Face Cream",     emoji:"🫙", ing:["Water","Shea Butter","Niacinamide","Glycerin","Cetearyl Alcohol","Fragrance","Phenoxyethanol"] },
  { key:"lipstick",          cat:"Cosmetics & Personal Care",name:"Lipstick",       emoji:"💄", ing:["Castor Oil","Plant Wax","Carnauba Wax","Synthetic Wax","Pigments","Vitamin E","Fragrance"] },
  { key:"perfume",           cat:"Cosmetics & Personal Care",name:"Perfume / Fragrance",emoji:"🌸", ing:["Ethanol","Fragrance Compounds","Water","Benzyl Alcohol","Linalool"] },
  { key:"toothpaste",        cat:"Cosmetics & Personal Care",name:"Toothpaste",     emoji:"🦷", ing:["Water","Hydrated Silica","Glycerin","Sorbitol","Sodium Lauryl Sulphate","Sodium Fluoride","Flavour","Preservative"] },
  { key:"vitamin-c",         cat:"Health & Pharma", name:"Vitamin C Supplement",    emoji:"💊", ing:["Ascorbic Acid","Microcrystalline Cellulose","Magnesium Stearate (vegetable)","Hydroxypropyl Methylcellulose"] },
  { key:"fish-oil",          cat:"Health & Pharma", name:"Fish Oil Capsule",        emoji:"🐟", ing:["Refined Fish Oil","Gelatin (Halal Certified)","Glycerin","Water","Vitamin E (Antioxidant)"] },
  { key:"probiotic",         cat:"Health & Pharma", name:"Probiotic Supplement",    emoji:"🌿", ing:["Lactobacillus acidophilus","Bifidobacterium lactis","Inulin (Prebiotic)","Maltodextrin","Magnesium Stearate (vegetable)"] },
  { key:"multivitamin",      cat:"Health & Pharma", name:"Multivitamin Tablet",     emoji:"💊", ing:["Vitamins (A,C,D,E,K,B-complex)","Minerals (Iron,Zinc,Calcium)","Microcrystalline Cellulose","Stearic Acid"] },
  { key:"herbal-extract",    cat:"Health & Pharma", name:"Herbal Extract",          emoji:"🌿", ing:["Plant Extract (specify)","Ethanol (food-grade)","Water","Glycerin"] },
  { key:"dishwash-liquid",   cat:"Cleaning & Hygiene",name:"Dishwashing Liquid",    emoji:"🫧", ing:["Water","Sodium Laureth Sulphate","Lauramine Oxide","Glycerin","Citric Acid","Fragrance","Preservative (MIT/CMIT)"] },
  { key:"floor-cleaner",     cat:"Cleaning & Hygiene",name:"Floor Cleaner",         emoji:"🧹", ing:["Water","Surfactant","Pine Oil","Fragrance","Preservative","Colour"] },
  { key:"hand-sanitizer",    cat:"Cleaning & Hygiene",name:"Hand Sanitizer",        emoji:"🙌", ing:["Ethanol 70%","Water","Glycerin","Hydrogen Peroxide","Carbomer","Triethanolamine","Fragrance"] },
  { key:"laundry-detergent", cat:"Cleaning & Hygiene",name:"Laundry Detergent",     emoji:"🧺", ing:["Sodium Carbonate","Zeolites","Sodium Percarbonate","Surfactants","Enzymes","Fragrance","Optical Brightener"] },
  { key:"hand-soap",         cat:"Cleaning & Hygiene",name:"Hand Soap (Liquid)",    emoji:"🧼", ing:["Water","Sodium Laureth Sulphate","Cocamidopropyl Betaine","Glycerin","Sodium Chloride","Fragrance","Preservative"] },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CATEGORIES = Array.from(new Set(CATALOG.map(c => c.cat)))

const STATUS_COLORS: Record<IngredientRow["status"], { bg: string; color: string; dot: string }> = {
  halal:      { bg: "#dcfce7", color: "#15803d", dot: "🟢" },
  "to-verify":{ bg: "#fef9c3", color: "#854d0e", dot: "🟡" },
  mushbooh:   { bg: "#ffedd5", color: "#9a3412", dot: "🟠" },
  haram:      { bg: "#fee2e2", color: "#991b1b", dot: "🔴" },
}

const STATUS_LABELS: Record<IngredientRow["status"], string> = {
  halal: "Halal",
  "to-verify": "To Verify",
  mushbooh: "Mushbooh",
  haram: "Haram",
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function loadFactories(): AppFactory[] {
  try {
    return JSON.parse(localStorage.getItem("hcs_factories") || "[]")
  } catch {
    return []
  }
}

function loadProducts(): StoredProduct[] {
  try {
    return JSON.parse(localStorage.getItem("hcs_products") || "[]")
  } catch {
    return []
  }
}

// ─── ProductCard (module-level, no hooks) ────────────────────────────────────
interface ProductCardProps {
  product: StoredProduct
  factories: AppFactory[]
  onDelete: (id: string) => void
}

function ProductCard({ product, factories, onDelete }: ProductCardProps) {
  const factory = factories.find(f => f.id === product.factoryId)
  const visibleIng = product.ingredients.slice(0, 4)
  const extraIng   = product.ingredients.length - 4

  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = e.currentTarget.querySelector<HTMLButtonElement>("[data-delete]")
    if (btn) btn.style.opacity = "1"
  }
  const handleMouseOut = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = e.currentTarget.querySelector<HTMLButtonElement>("[data-delete]")
    if (btn) btn.style.opacity = "0"
  }

  const addedDate = new Date(product.addedAt).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  })

  return (
    <div
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "16px 18px",
        position: "relative",
      }}
    >
      {/* Delete button */}
      <button
        data-delete
        onClick={() => onDelete(product.id)}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          opacity: 0,
          transition: "opacity 0.15s",
          background: "#fee2e2",
          border: "none",
          borderRadius: 8,
          width: 30,
          height: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#dc2626",
        }}
        title="Delete product"
      >
        <Trash2 size={14} />
      </button>

      {/* Emoji circle */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          marginBottom: 10,
        }}
      >
        {product.emoji}
      </div>

      {/* Name + code */}
      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: DARK, paddingRight: 28 }}>
        {product.name}
      </div>
      {product.code && (
        <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
          {product.code}
        </div>
      )}

      {/* Factory chip */}
      {factory && (
        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: 600,
            color: BLUE,
            background: "#eff6ff",
            padding: "2px 8px",
            borderRadius: 20,
            marginTop: 4,
            display: "inline-block",
          }}
        >
          {factory.name}
        </div>
      )}

      {/* Ingredients */}
      {product.ingredients.length > 0 && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
          }}
        >
          {visibleIng.map(ing => {
            const sc = STATUS_COLORS[ing.status]
            return (
              <span
                key={ing.id}
                style={{
                  fontSize: "0.68rem",
                  padding: "2px 8px",
                  borderRadius: 12,
                  display: "inline-flex",
                  gap: 4,
                  alignItems: "center",
                  background: sc.bg,
                  color: sc.color,
                }}
              >
                <span>{sc.dot}</span>
                {ing.name}
              </span>
            )
          })}
          {extraIng > 0 && (
            <span
              style={{
                fontSize: "0.68rem",
                padding: "2px 8px",
                borderRadius: 12,
                background: "#f1f5f9",
                color: "#64748b",
              }}
            >
              +{extraIng} more
            </span>
          )}
        </div>
      )}

      {/* Added date */}
      <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 8 }}>
        Added {addedDate}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CustomerProductsPage() {
  const [factories, setFactories] = useState<AppFactory[]>([])
  const [products,  setProducts]  = useState<StoredProduct[]>([])
  const [selectedFactory, setSelectedFactory] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Modal state
  const [modalStep, setModalStep] = useState<1 | 2>(1)
  const [catalogSearch, setCatalogSearch] = useState("")
  const [catalogCat, setCatalogCat] = useState("All")
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogItem | null>(null)
  const [isCustom, setIsCustom] = useState(false)

  // Step-2 form state
  const [formName,        setFormName]        = useState("")
  const [formCode,        setFormCode]        = useState("")
  const [formFactoryId,   setFormFactoryId]   = useState("")
  const [formIngredients, setFormIngredients] = useState<IngredientRow[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    setFactories(loadFactories())
    setProducts(loadProducts())
  }, [])

  // Persist products whenever they change
  useEffect(() => {
    localStorage.setItem("hcs_products", JSON.stringify(products))
  }, [products])

  // ── Derived data ────────────────────────────────────────────────────────────
  const filteredProducts = selectedFactory
    ? products.filter(p => p.factoryId === selectedFactory)
    : products

  const totalIngredients = products.reduce((acc, p) => acc + p.ingredients.length, 0)

  const factoryProductCount = (fid: string) =>
    products.filter(p => p.factoryId === fid).length

  // ── Catalog filter ──────────────────────────────────────────────────────────
  const catalogFiltered = CATALOG.filter(item => {
    const matchCat  = catalogCat === "All" || item.cat === catalogCat
    const matchSearch = item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                        item.cat.toLowerCase().includes(catalogSearch.toLowerCase())
    return matchCat && matchSearch
  })

  // ── Modal helpers ───────────────────────────────────────────────────────────
  function openModal() {
    setModalStep(1)
    setCatalogSearch("")
    setCatalogCat("All")
    setSelectedCatalog(null)
    setIsCustom(false)
    setFormName("")
    setFormCode("")
    setFormFactoryId(factories.length === 1 ? factories[0].id : "")
    setFormIngredients([])
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  function goToStep2(item: CatalogItem | null, custom: boolean) {
    setIsCustom(custom)
    if (item && !custom) {
      setFormName(item.name)
      setFormIngredients(
        item.ing.map(name => ({ id: uid(), name, status: "to-verify" as const }))
      )
    } else {
      setFormName("")
      setFormIngredients([])
    }
    setFormCode("")
    setFormFactoryId(factories.length === 1 ? factories[0].id : "")
    setModalStep(2)
  }

  function addIngredient() {
    setFormIngredients(prev => [...prev, { id: uid(), name: "", status: "to-verify" }])
  }

  function removeIngredient(id: string) {
    setFormIngredients(prev => prev.filter(i => i.id !== id))
  }

  function updateIngredientName(id: string, name: string) {
    setFormIngredients(prev => prev.map(i => i.id === id ? { ...i, name } : i))
  }

  function updateIngredientStatus(id: string, status: IngredientRow["status"]) {
    setFormIngredients(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  function saveProduct() {
    if (!formName.trim()) return
    const catalog = isCustom ? null : selectedCatalog
    const newProduct: StoredProduct = {
      id:         uid(),
      catalogKey: catalog?.key ?? "custom-" + uid(),
      emoji:      catalog?.emoji ?? "📦",
      name:       formName.trim(),
      code:       formCode.trim(),
      factoryId:  formFactoryId,
      ingredients: formIngredients.filter(i => i.name.trim()),
      addedAt:    new Date().toISOString(),
    }
    setProducts(prev => [newProduct, ...prev])
    closeModal()
  }

  function deleteProduct(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  // ── Status toggle button helper ─────────────────────────────────────────────
  function StatusBtn({
    currentStatus,
    value,
    ingId,
  }: {
    currentStatus: IngredientRow["status"]
    value: IngredientRow["status"]
    ingId: string
  }) {
    const sc      = STATUS_COLORS[value]
    const active  = currentStatus === value
    const label   = STATUS_LABELS[value]
    return (
      <button
        onClick={() => updateIngredientStatus(ingId, value)}
        style={{
          width: 65,
          height: 28,
          fontSize: "0.65rem",
          fontWeight: 600,
          cursor: "pointer",
          border: `1.5px solid ${active ? sc.color : "#e2e8f0"}`,
          borderRadius: 6,
          background: active ? sc.bg : "#f8fafc",
          color: active ? sc.color : "#94a3b8",
          whiteSpace: "nowrap",
          transition: "all 0.12s",
        }}
      >
        {sc.dot} {label}
      </button>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <CustomerLayout>
      <div style={{ display: "flex", gap: 0 }}>

        {/* ── Left Sidebar ── */}
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            background: "#fff",
            borderRight: "1px solid #e2e8f0",
            minHeight: "calc(100vh - 128px)",
            padding: "16px 12px",
            position: "sticky",
            top: 128,
            alignSelf: "flex-start",
          }}
        >
          {/* All Products button */}
          <button
            onClick={() => setSelectedFactory(null)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "none",
              cursor: "pointer",
              marginBottom: 6,
              background: selectedFactory === null ? "#eff6ff" : "transparent",
              color: selectedFactory === null ? BLUE : DARK,
              fontWeight: selectedFactory === null ? 600 : 400,
              fontSize: "0.8rem",
            }}
          >
            <span>All Products ({products.length})</span>
            <span
              style={{
                fontSize: "0.68rem",
                padding: "1px 7px",
                borderRadius: 12,
                background: selectedFactory === null ? BLUE : "#f1f5f9",
                color: selectedFactory === null ? "#fff" : "#64748b",
              }}
            >
              {products.length}
            </span>
          </button>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #f1f5f9", margin: "8px 0" }} />

          <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600, marginBottom: 6, paddingLeft: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Factories
          </div>

          {factories.length === 0 ? (
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", padding: "8px 4px" }}>
              No factories registered
            </div>
          ) : (
            factories.map(f => {
              const isActive = selectedFactory === f.id
              const cnt = factoryProductCount(f.id)
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFactory(f.id)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "none",
                    cursor: "pointer",
                    marginBottom: 4,
                    background: isActive ? "#eff6ff" : "transparent",
                    color: isActive ? BLUE : DARK,
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "0.8rem",
                    textAlign: "left",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
                    {f.name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      padding: "1px 7px",
                      borderRadius: 12,
                      background: isActive ? BLUE : "#f1f5f9",
                      color: isActive ? "#fff" : "#64748b",
                      flexShrink: 0,
                    }}
                  >
                    {cnt}
                  </span>
                </button>
              )
            })
          )}
        </aside>

        {/* ── Main area ── */}
        <main style={{ flex: 1, padding: "24px 28px" }}>

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: DARK, margin: 0 }}>
              Product Portfolio
            </h1>
            <button
              onClick={openModal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: BLUE,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "9px 18px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>

          {/* Summary stats */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            {[
              { label:"Total Products",     value:products.length,   color:BLUE  },
              { label:"Total Ingredients",  value:totalIngredients,  color:GREEN },
            ].map(s => (
              <div key={s.label} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"14px 22px", boxShadow:"0 1px 4px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04)", display:"flex", flexDirection:"column", gap:2 }}>
                <span style={{ fontSize:"1.4rem", fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</span>
                <span style={{ fontSize:"0.72rem", color:"#64748b", fontWeight:500 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Product grid or empty state */}
          {filteredProducts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#94a3b8",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
                No products yet
              </div>
              <div style={{ fontSize: "0.8rem" }}>
                Click "Add Product" to get started
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {filteredProducts.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  factories={factories}
                  onDelete={deleteProduct}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,33,112,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 760,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: DARK }}>
                  {modalStep === 1 ? "Add Product" : "Configure Product"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>
                  {modalStep === 1 ? "Step 1 of 2 — Choose from catalog" : "Step 2 of 2 — Set details"}
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

              {/* ── Step 1: Catalog browser ── */}
              {modalStep === 1 && (
                <>
                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 14px",
                      borderRadius: 8,
                      border: "1.5px solid #e2e8f0",
                      fontSize: "0.85rem",
                      outline: "none",
                      marginBottom: 14,
                      boxSizing: "border-box",
                    }}
                  />

                  {/* Category tabs */}
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      overflowX: "auto",
                      marginBottom: 16,
                      paddingBottom: 4,
                    }}
                  >
                    {["All", ...CATEGORIES].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCatalogCat(cat)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 20,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: "none",
                          whiteSpace: "nowrap",
                          background: catalogCat === cat ? BLUE : "#f1f5f9",
                          color: catalogCat === cat ? "#fff" : "#64748b",
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Catalog grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {catalogFiltered.map(item => {
                      const isSelected = selectedCatalog?.key === item.key
                      return (
                        <div
                          key={item.key}
                          onClick={() => setSelectedCatalog(isSelected ? null : item)}
                          style={{
                            cursor: "pointer",
                            border: `1.5px solid ${isSelected ? BLUE : "#e2e8f0"}`,
                            borderRadius: 10,
                            padding: "14px 10px",
                            textAlign: "center",
                            background: isSelected ? "#eff6ff" : "#fafafa",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 7,
                            transition: "all 0.12s",
                          }}
                        >
                          <span style={{ fontSize: "2rem" }}>{item.emoji}</span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: isSelected ? BLUE : DARK, lineHeight: 1.3 }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: "0.62rem", color: "#94a3b8" }}>{item.cat}</span>
                        </div>
                      )
                    })}
                  </div>

                  {catalogFiltered.length === 0 && (
                    <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0", fontSize: "0.85rem" }}>
                      No products match your search
                    </div>
                  )}
                </>
              )}

              {/* ── Step 2: Configure ── */}
              {modalStep === 2 && (
                <>
                  {/* Back link */}
                  <button
                    onClick={() => setModalStep(1)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: BLUE,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      marginBottom: 16,
                      padding: 0,
                    }}
                  >
                    <ArrowLeft size={14} />
                    Back to catalog
                  </button>

                  {/* Selected item header */}
                  {!isCustom && selectedCatalog && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 20,
                        padding: "12px 16px",
                        background: "#f8fafc",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <span style={{ fontSize: "2rem" }}>{selectedCatalog.emoji}</span>
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: DARK }}>{selectedCatalog.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{selectedCatalog.cat}</div>
                      </div>
                    </div>
                  )}

                  {isCustom && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 20,
                        padding: "12px 16px",
                        background: "#f8fafc",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <span style={{ fontSize: "2rem" }}>📦</span>
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: DARK }}>Custom Product</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Define your own product</div>
                      </div>
                    </div>
                  )}

                  {/* Form fields */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Product Name */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: DARK, marginBottom: 5 }}>
                        Product Name <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="e.g. Halal Chicken Nuggets"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 8,
                          border: "1.5px solid #e2e8f0",
                          fontSize: "0.85rem",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* Product Code */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: DARK, marginBottom: 5 }}>
                        Product Code / SKU
                      </label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={e => setFormCode(e.target.value)}
                        placeholder="e.g. SKU-001"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 8,
                          border: "1.5px solid #e2e8f0",
                          fontSize: "0.85rem",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* Factory */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: DARK, marginBottom: 5 }}>
                        Factory
                      </label>
                      <select
                        value={formFactoryId}
                        onChange={e => setFormFactoryId(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 8,
                          border: "1.5px solid #e2e8f0",
                          fontSize: "0.85rem",
                          outline: "none",
                          boxSizing: "border-box",
                          background: "#fff",
                          color: formFactoryId ? DARK : "#94a3b8",
                        }}
                      >
                        <option value="">— Select a factory —</option>
                        {factories.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.city}, {f.country})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ingredients */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: DARK, marginBottom: 8 }}>
                        Ingredients
                      </label>

                      {formIngredients.length === 0 && (
                        <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: 8 }}>
                          No ingredients added yet.
                        </div>
                      )}

                      {formIngredients.map(ing => (
                        <div
                          key={ing.id}
                          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
                        >
                          <input
                            type="text"
                            value={ing.name}
                            onChange={e => updateIngredientName(ing.id, e.target.value)}
                            placeholder="Ingredient name"
                            style={{
                              flex: 1,
                              height: 34,
                              padding: "0 10px",
                              borderRadius: 7,
                              border: "1.5px solid #e2e8f0",
                              fontSize: "0.8rem",
                              outline: "none",
                            }}
                          />
                          <StatusBtn currentStatus={ing.status} value="halal"      ingId={ing.id} />
                          <StatusBtn currentStatus={ing.status} value="to-verify"  ingId={ing.id} />
                          <StatusBtn currentStatus={ing.status} value="mushbooh"   ingId={ing.id} />
                          <StatusBtn currentStatus={ing.status} value="haram"      ingId={ing.id} />
                          <button
                            onClick={() => removeIngredient(ing.id)}
                            style={{
                              background: "#fee2e2",
                              border: "none",
                              borderRadius: 6,
                              width: 28,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              color: "#dc2626",
                              flexShrink: 0,
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={addIngredient}
                        style={{
                          background: "none",
                          border: "none",
                          color: BLUE,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: "4px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Plus size={14} />
                        Add Ingredient
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              {modalStep === 1 && (
                <>
                  <button
                    onClick={() => { setIsCustom(true); setSelectedCatalog(null); goToStep2(null, true) }}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 8,
                      border: "1.5px solid #e2e8f0",
                      background: "#fff",
                      color: DARK,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Add Custom Product
                  </button>
                  <button
                    disabled={!selectedCatalog}
                    onClick={() => selectedCatalog && goToStep2(selectedCatalog, false)}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: selectedCatalog ? BLUE : "#e2e8f0",
                      color: selectedCatalog ? "#fff" : "#94a3b8",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: selectedCatalog ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </>
              )}

              {modalStep === 2 && (
                <>
                  <button
                    onClick={closeModal}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 8,
                      border: "1.5px solid #e2e8f0",
                      background: "#fff",
                      color: DARK,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!formName.trim()}
                    onClick={saveProduct}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: formName.trim() ? GREEN : "#e2e8f0",
                      color: formName.trim() ? "#fff" : "#94a3b8",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: formName.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    Save Product
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  )
}
