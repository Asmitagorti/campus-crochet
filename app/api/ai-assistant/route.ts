import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_TURNS = 12;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const RATE_BUCKETS = new Map<string, { count: number; resetAt: number }>();

function rateLimitOk(userId: string): boolean {
  const now = Date.now();
  const bucket = RATE_BUCKETS.get(userId);
  if (!bucket || bucket.resetAt < now) {
    RATE_BUCKETS.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count += 1;
  return true;
}

function sanitizeForDisplay(text: string): string {
  return text
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim()
    .slice(0, 800);
}

type Filters = {
  category?: string;
  budget?: number;
  color?: string;
  occasion?: string;
  style?: string;
  intent: "buy" | "gift" | "custom";
};

type SearchResponse = {
  response: string;
  needsFollowUp: boolean;
  followUpQuestion?: string;
};

const CATEGORY_KEYWORDS: Record<string, string> = {
  scrunchie: "Scrunchies",
  hair: "Scrunchies",
  keychain: "Keychains",
  charm: "Charms",
  phone: "Charms",
  bookmark: "Bookmarks",
  bag: "Bags",
  tote: "Bags",
  pouch: "Bags",
  coaster: "Home",
  home: "Home",
  decor: "Home",
};

const COLOR_KEYWORDS = [
  "pink",
  "rose",
  "dusty rose",
  "blush",
  "red",
  "green",
  "sage",
  "lavender",
  "purple",
  "cream",
  "white",
  "yellow",
  "sunflower",
  "terracotta",
  "brown",
  "blue",
  "orange",
  "maroon",
  "mint",
  "peach",
  "olive",
  "mustard",
];

const OCCASION_KEYWORDS: Record<string, string> = {
  birthday: "birthday",
  anniversary: "anniversary",
  valentine: "valentine",
  wedding: "wedding",
  friendship: "friendship",
  rakhi: "rakhi",
  diwali: "diwali",
  pongal: "pongal",
  christmas: "christmas",
  college: "college",
  fresher: "college",
  graduation: "graduation",
  convocation: "graduation",
};

function keywordFilters(message: string): Filters {
  const lower = message.toLowerCase();
  const filters: Filters = { intent: "buy" };

  if (/\b(custom|personalize|design my own|bespoke)\b/.test(lower)) {
    filters.intent = "custom";
  } else if (
    /\b(gift|present|for my friend|for my sister|for my brother|for her|for him)\b/.test(
      lower
    )
  ) {
    filters.intent = "gift";
  }

  const budgetMatch = lower.match(
    /(?:under|below|less than|max|maximum|budget|upto|up to|within|around|approx(?:imately)?)\s*(?:₹|rs\.?|rupees?|inr|\$)?\s*(\d{2,5})/i
  );
  if (budgetMatch) {
    filters.budget = parseInt(budgetMatch[1], 10);
  }

  for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      filters.category = cat;
      break;
    }
  }

  for (const c of COLOR_KEYWORDS) {
    if (lower.includes(c)) {
      filters.color = c.replace(/\b\w/g, (l) => l.toUpperCase());
      break;
    }
  }

  for (const [keyword, occ] of Object.entries(OCCASION_KEYWORDS)) {
    if (lower.includes(keyword)) {
      filters.occasion = occ;
      break;
    }
  }

  return filters;
}

function pickLlmProvider(): "openai" | "anthropic" | "gemini" | null {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

function extractJson(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

async function llmFilters(
  message: string,
  history: any[]
): Promise<Filters | null> {
  const provider = pickLlmProvider();
  if (!provider) return null;

  const systemPrompt = `You extract shopping search criteria from a Campus Crochet student's natural-language request. Campus Crochet sells these categories: Scrunchies, Keychains, Charms, Bookmarks, Bags, Home. Respond as JSON with this exact shape:
{
  "intent": "buy" | "gift" | "custom",
  "category": "<one of the categories above, or omitted>",
  "budget": <integer rupees, no decimals, omitted if none>,
  "color": "<color name as the product would store it, or omitted>",
  "occasion": "<birthday|anniversary|graduation|friendship|other, omitted if none>",
  "style": "<cute|minimal|bold|cozy|other, omitted if none>"
}
Only include a field if the user mentioned it. JSON only, no prose.`;

  try {
    let responseText: string | null = null;

    if (provider === "openai") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            ...(history || [])
              .slice(-6)
              .map((m: any) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
          ],
        }),
      });
      const data = await r.json();
      responseText = data?.choices?.[0]?.message?.content;
    } else if (provider === "anthropic") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model:
            process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022",
          max_tokens: 300,
          system: systemPrompt,
          messages: [
            ...(history || [])
              .slice(-6)
              .map((m: any) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
          ],
        }),
      });
      const data = await r.json();
      const text = data?.content?.[0]?.text;
      responseText = typeof text === "string" ? extractJson(text) : null;
    } else if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${
        process.env.GEMINI_MODEL || "gemini-1.5-flash"
      }:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: message }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
      const data = await r.json();
      responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    if (!responseText) return null;
    const parsed = JSON.parse(responseText);
    return {
      intent:
        parsed.intent === "custom" || parsed.intent === "gift"
          ? parsed.intent
          : "buy",
      category: parsed.category || undefined,
      budget: typeof parsed.budget === "number" ? parsed.budget : undefined,
      color: parsed.color || undefined,
      occasion: parsed.occasion || undefined,
      style: parsed.style || undefined,
    };
  } catch (e) {
    console.error("LLM extract error:", e);
    return null;
  }
}

function occasionMatchesCategory(
  occasion: string,
  category: string
): boolean {
  const map: Record<string, string[]> = {
    birthday: ["Scrunchies", "Keychains", "Charms"],
    friendship: ["Scrunchies", "Keychains", "Charms"],
    anniversary: ["Charms", "Bags"],
    graduation: ["Charms", "Scrunchies", "Keychains"],
    college: ["Scrunchies", "Keychains", "Charms", "Bookmarks"],
    valentine: ["Charms", "Scrunchies", "Keychains"],
  };
  return map[occasion]?.includes(category) ?? false;
}

async function searchProducts(filters: Filters): Promise<any[]> {
  let dbQuery = supabase
    .from("products")
    .select(
      `
      id,
      name,
      price,
      category,
      description,
      badge,
      image_url,
      product_images ( image_id, image_url, display_order ),
      product_colors ( color_id, color_name )
    `
    )
    .eq("active", true)
    .order("price", { ascending: true });

  if (filters.category) {
    dbQuery = dbQuery.eq("category", filters.category);
  }
  if (typeof filters.budget === "number") {
    dbQuery = dbQuery.lte("price", filters.budget);
  }

  const { data, error } = await dbQuery;
  if (error) {
    console.error("searchProducts error:", error);
    return [];
  }

  let results = data ?? [];

  if (filters.color) {
    const needle = filters.color.toLowerCase();
    results = results.filter((p: any) => {
      const colorNames =
        p.product_colors?.map((c: any) => c.color_name.toLowerCase()) ?? [];
      return colorNames.some((c: string) => c.includes(needle));
    });
  }

  if (filters.occasion || filters.style) {
    const occ = filters.occasion?.toLowerCase();
    const style = filters.style?.toLowerCase();
    results = results.filter((p: any) => {
      const hay = `${p.name} ${p.category} ${p.description ?? ""}`.toLowerCase();
      if (occ && !hay.includes(occ) && !occasionMatchesCategory(occ, p.category))
        return false;
      if (style && !hay.includes(style)) return false;
      return true;
    });
  }

  return results.slice(0, 6);
}

function composeResponse(
  filters: Filters,
  matches: any[],
  message: string
): SearchResponse {
  if (filters.intent === "custom") {
    return {
      response: sanitizeForDisplay(
        "I'd love to help you create a custom piece. I can submit a request for you to the maker — they'll get back with a price and timeline (usually 3–5 working days)."
      ),
      needsFollowUp: true,
      followUpQuestion: sanitizeForDisplay(
        "What would you like made? Please describe the design, colors, and occasion (if any)."
      ),
    };
  }

  if (matches.length === 0) {
    const safeQuery = sanitizeForDisplay(message.trim());
    return {
      response: sanitizeForDisplay(
        `I couldn't find a product in our collection that matches "${safeQuery}". The maker takes custom requests too — describe what you have in mind and I'll submit a request for you.`
      ),
      needsFollowUp: true,
      followUpQuestion: sanitizeForDisplay("What custom piece were you imagining?"),
    };
  }

  const bits: string[] = [];
  if (filters.budget) bits.push(`under ₹${filters.budget}`);
  if (filters.category) bits.push(`in ${filters.category}`);
  if (filters.color) bits.push(`in ${filters.color}`);
  if (filters.occasion) bits.push(`for a ${filters.occasion}`);

  const lead =
    bits.length > 0
      ? `Found ${matches.length} match${matches.length > 1 ? "es" : ""} ${bits.join(", ")}.`
      : `Found ${matches.length} piece${matches.length > 1 ? "s" : ""} that might work.`;

  if (matches.length === 1) {
    const first = matches[0];
    const colorList =
      first.product_colors?.map((c: any) => c.color_name).join(", ") ?? "";
    return {
      response: sanitizeForDisplay(
        `${lead} **${first.name}** (₹${first.price}) comes in ${colorList || "the colors shown"}. Tap it to view details, or hit Add to put it in your cart.`
      ),
      needsFollowUp: false,
    };
  }

  return {
    response: sanitizeForDisplay(
      `${lead} Tap any to view details, or hit Add to put it in your cart.`
    ),
    needsFollowUp: false,
  };
}

function shapeProduct(p: any) {
  const primaryImage =
    p.image_url ??
    p.product_images?.sort(
      (a: any, b: any) =>
        (a.display_order ?? 0) - (b.display_order ?? 0)
    )[0]?.image_url ??
    "";
  const colorNames = p.product_colors?.map((c: any) => c.color_name) ?? [];
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price),
    category: p.category,
    image: primaryImage,
    description: p.description,
    badge: p.badge,
    colors: colorNames,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!rateLimitOk(session.id)) {
      return Response.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      message?: unknown;
      history?: unknown;
    } | null;
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { message, history } = body;

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const cleanMessage = sanitizeForDisplay(message).slice(0, MAX_MESSAGE_LENGTH);
    if (!cleanMessage) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .slice(-MAX_HISTORY_TURNS)
          .filter(
            (m): m is { role: "user" | "assistant"; content: string } =>
              !!m &&
              typeof m === "object" &&
              typeof (m as { content?: unknown }).content === "string" &&
              ((m as { role?: unknown }).role === "user" ||
                (m as { role?: unknown }).role === "assistant")
          )
          .map((m) => ({
            role: m.role,
            content: sanitizeForDisplay(m.content),
          }))
      : [];

    let filters = await llmFilters(cleanMessage, safeHistory);
    if (!filters) {
      filters = keywordFilters(cleanMessage);
    }

    const products = await searchProducts(filters);
    const { response, needsFollowUp, followUpQuestion } = composeResponse(
      filters,
      products,
      cleanMessage
    );

    return Response.json({
      response,
      suggestions: products.map(shapeProduct),
      needsFollowUp,
      followUpQuestion,
      intent: filters.intent,
      filters,
    });
  } catch (error: unknown) {
    console.error("AI ASSISTANT ERROR:", error);
    const message =
      error instanceof Error ? error.message : "AI assistant error";
    return Response.json({ error: message }, { status: 500 });
  }
}