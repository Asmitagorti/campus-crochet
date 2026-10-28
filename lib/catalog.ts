import { media } from "./media";
export type Product = {
  databaseId?: string;
  active?: boolean;
  revision?: number;
  id: string;
  name: string;
  category: string;
  note: string;
  price: number;
  description: string;
  details: [string, string][];
  colors: string[];
  stock: number | null;
  packedWeightGrams?: number | null;
  madeToOrder: boolean;
  gallery: string[];
};
export const photo = (id: string) =>
  media(
    ["tulips", "bunny", "coaster", "beanie", "pastel-bag"].includes(id)
      ? `/images/${id}-clean.png`
      : `/images/${id}.jpg`,
  );
export const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
// Launch prices proposed for review. Stock count confirmed by the owner.
const base = { stock: 25, madeToOrder: false };
export const products: Product[] = [
  {
    ...base,
    id: "stitch",
    name: "A little blue bestie",
    category: "Crochet Toys",
    note: "A pocketful of personality",
    price: 749,
    description:
      "Big ears, a soft little belly, and more personality than a desk has room for. This blue crochet companion is stitched by hand, one loop at a time, for your shelf, your study corner, or someone who could use a little smile.",
    details: [
      ["Colours", "Ocean blue, sky blue & petal pink"],
      ["Finish", "Soft crochet body with stitched facial details"],
      ["Includes", "One handmade crochet keepsake"],
      ["Made for", "Gifting, collecting & display"],
    ],
    colors: ["#126bd5", "#89c9ef", "#f5b2ce"],
    gallery: [photo("stitch")],
  },
  {
    ...base,
    id: "coaster",
    name: "Coffee & a little comfort",
    category: "Rugs & Mats",
    note: "For your favourite cup",
    price: 299,
    description:
      "A tiny coffee corner, wherever you set your cup. This hand-crocheted coaster pairs a playful cup motif with a soft pink border. A sweet companion for study sessions, slow mornings and that very necessary second coffee.",
    details: [
      ["Colours", "Blush, cream, pale blue & cocoa"],
      ["Design", "Coffee cup motif with a crochet border"],
      ["Includes", "One crochet coaster"],
      ["Use", "Under mugs on a dry, flat surface"],
    ],
    colors: ["#ecc6d1", "#d7e8e6", "#664c47"],
    gallery: [photo("coaster"), media("/images/coaster.jpg")],
  },
  {
    ...base,
    id: "bunny",
    name: "Strawberry bunny",
    category: "Keychains & Charms",
    note: "The sweetest little companion",
    price: 499,
    description:
      "Floppy ears, a tiny pink nose, and a strawberry held close. Our little bunny brings a soft, cheerful touch to a bedside shelf or a thoughtful gift. The stitched expression gives each handmade piece its own quiet personality.",
    details: [
      ["Colours", "Cream, strawberry pink & leaf green"],
      ["Details", "Floppy ears and a crochet strawberry"],
      ["Includes", "One bunny keepsake; keyring hardware not included"],
      ["Made for", "Collecting, display & thoughtful gifting"],
    ],
    colors: ["#f7efdf", "#eab7d6", "#82b52c"],
    gallery: [photo("bunny"), media("/images/bunny.jpg")],
  },
  {
    ...base,
    id: "minion",
    name: "Your sunshine sidekick",
    category: "Crochet Toys",
    note: "Small friend, big energy",
    price: 649,
    description:
      "A cheerful yellow companion wearing blue overalls and carrying a little crochet flower. Handmade texture and a stitched smile make this a happy addition to a desk, a shelf, or a gift for your favourite person.",
    details: [
      ["Colours", "Sunshine yellow, blue & lavender"],
      ["Details", "Crochet goggles, overalls and flower"],
      ["Includes", "One handmade crochet keepsake"],
      ["Made for", "Collecting, gifting & display"],
    ],
    colors: ["#edcf45", "#1974cf", "#bdb6dd"],
    gallery: [photo("minion")],
  },
  {
    ...base,
    id: "tulips",
    name: "Blooms that stay",
    category: "Home Decor",
    note: "A little forever kind of gift",
    price: 249,
    description:
      "For the person you would bring flowers to, again and again. Two crochet tulips in soft pink and lavender hang from bright green stems. Tuck them into a little corner, add them to a gift, or keep a little spring for yourself.",
    details: [
      ["Colours", "Pink & lavender with green stems"],
      ["Includes", "One pair of crochet tulips"],
      ["Finish", "Soft yarn stems and stitched leaves"],
      ["Display", "Decorative hanging flowers; vase not included"],
    ],
    colors: ["#c298db", "#e399c8", "#81bf32"],
    gallery: [photo("tulips"), media("/images/tulips.jpg")],
  },
  {
    ...base,
    id: "beanie",
    name: "Golden hour beanie",
    category: "Accessories",
    note: "Something soft for cooler days",
    price: 449,
    description:
      "A little sunshine for a cooler morning. The golden hour beanie has a textured handmade stitch and a folded cuff, in a mustard shade that feels at home with nearly everything. Ask us about fit before placing your request.",
    details: [
      ["Colour", "Mustard yellow"],
      ["Design", "Textured crochet with a folded cuff"],
      ["Includes", "One crochet beanie"],
      ["Fit", "Confirm measurements with the maker before ordering"],
    ],
    colors: ["#c49b23"],
    gallery: [photo("beanie"), media("/images/beanie.jpg")],
  },
  {
    ...base,
    id: "flowers",
    name: "Made-for-you gifting",
    category: "Gift Sets",
    note: "Thoughtfulness, stitched in",
    price: 299,
    description:
      "Some occasions deserve a little more than a message on a screen. A handcrafted card finished with crochet flowers makes a keepsake out of your congratulations. Contact support about the occasion and message before ordering; we will confirm the details with you.",
    details: [
      ["Palette", "Warm pinks, cream & leafy green"],
      ["Includes", "One handmade card with crochet floral details"],
      ["Personal touch", "Message and occasion confirmed before making"],
      ["Finish", "Mixed paper and crochet construction"],
    ],
    colors: ["#cd4765", "#e7b6a2", "#577b45"],
    gallery: [photo("flowers")],
  },
  {
    ...base,
    id: "bag",
    name: "Everyday blue tote",
    category: "Accessories",
    note: "Take a little handmade with you",
    price: 899,
    description:
      "A deep blue shoulder bag with an all-over textured stitch. Made slowly and designed to be carried into everyday moments. The soft crochet structure brings a little warmth to a practical favourite; confirm sizing and lining options before ordering.",
    details: [
      ["Colour", "Deep denim blue"],
      ["Construction", "Textured crochet body with shoulder strap"],
      ["Includes", "One handmade shoulder bag"],
      ["Sizing & lining", "Confirmed with the maker before production"],
    ],
    colors: ["#1e4f77"],
    gallery: [photo("bag")],
  },
  {
    ...base,
    id: "pastel-bag",
    name: "Petal patchwork shoulder bag",
    category: "Accessories",
    note: "A little garden to take along",
    price: 999,
    description:
      "Pink, lavender and cream flowers meet in a patchwork of granny squares. This soft shoulder bag is a celebration of the patient, familiar rhythm of crochet. Carry a little colour with you, from a coffee catch-up to a slow weekend wander.",
    details: [
      ["Colours", "Pink, lavender & cream"],
      ["Pattern", "Floral granny-square patchwork"],
      ["Includes", "One crochet shoulder bag with long strap"],
      ["Sizing & lining", "Confirmed with the maker before production"],
    ],
    colors: ["#ec87b9", "#c3b7e6", "#f2dfd7"],
    gallery: [photo("pastel-bag")],
  },
  {
    ...base,
    id: "round-coasters",
    name: "Slow morning coasters",
    category: "Rugs & Mats",
    note: "A soft landing for your cup",
    price: 349,
    description:
      "Simple, softly scalloped crochet coasters in a warm neutral shade. A little texture for a bedside table, a coffee corner, or a thoughtful housewarming gift. Handmade details keep even the everyday moments feeling special.",
    details: [
      ["Colour", "Warm taupe"],
      ["Design", "Round crochet with scalloped edges"],
      ["Includes", "A set of four coasters"],
      ["Use", "Under cups on a dry, flat surface"],
    ],
    colors: ["#ab9583"],
    gallery: [photo("round-coasters")],
  },
];
export const categories = [
  { name: "Crochet Toys", image: "stitch" },
  { name: "Rugs & Mats", image: "coaster" },
  { name: "Keychains & Charms", image: "bunny" },
  { name: "Accessories", image: "pastel-bag" },
  { name: "Home Decor", image: "tulips" },
  { name: "Gift Sets", image: "flowers" },
];
export const getProduct = (id: string) => products.find((p) => p.id === id);
export const availability = (p: Product) =>
  p.stock !== null && p.stock > 0
    ? "In stock"
    : p.madeToOrder
      ? "Made to order"
      : "Out of stock";
export const canOrder = (p: Product) =>
  p.madeToOrder || (p.stock !== null && p.stock > 0);
export const maxQuantity = (p: Product) =>
  p.stock !== null && p.stock > 0
    ? Math.min(10, p.stock)
    : p.madeToOrder
      ? 10
      : 0;
