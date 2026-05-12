import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

declare const process: { env: Record<string, string | undefined> };

const VIKTOR_API_URL = process.env.VIKTOR_SPACES_API_URL!;
const PROJECT_NAME = process.env.VIKTOR_SPACES_PROJECT_NAME!;
const PROJECT_SECRET = process.env.VIKTOR_SPACES_PROJECT_SECRET!;

async function callViktorTool<T>(role: string, args: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${VIKTOR_API_URL}/api/viktor-spaces/tools/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_name: PROJECT_NAME,
      project_secret: PROJECT_SECRET,
      role,
      arguments: args,
    }),
  });
  if (!response.ok) {
    throw new Error(`Viktor tool call failed: HTTP ${response.status}`);
  }
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error ?? "Viktor tool call failed");
  }
  return json.result as T;
}

interface BuyBox {
  _id: string;
  name: string;
  makes: string[];
  models: string[];
  yearMin: number;
  yearMax: number;
  priceMin: number;
  priceMax: number;
  kmMax: number;
  states: string[];
  bodyTypes: string[];
  transmissions: string[];
  fuelTypes: string[];
  excludeKeywords: string[];
}

interface ParsedListing {
  title: string;
  year: number;
  make: string;
  model: string;
  variant?: string;
  price: number;
  km?: number;
  transmission?: string;
  fuel?: string;
  bodyType?: string;
  colour?: string;
  suburb?: string;
  state?: string;
  sourceUrl: string;
  sourceId: string;
  description?: string;
  sellerName?: string;
  daysListed?: number;
  isDealerPost: boolean;
  dealerPostReason?: string;
}

/**
 * Parse the AI search response text into structured listings.
 * Uses multiple strategies: JSON extraction, then regex fallback.
 */
function parseListingsFromResponse(
  responseText: string,
  source: "carsales" | "gumtree" | "facebook",
  buyBox: BuyBox
): ParsedListing[] {
  const listings: ParsedListing[] = [];

  // Strategy 1: Try to find JSON array in the response
  const jsonMatch = responseText.match(/\[[\s\S]*?\{[\s\S]*?"(?:title|make|year|price)"[\s\S]*?\}[\s\S]*?\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const listing = normaliseListingObj(item, source);
          if (listing && isWithinBuyBox(listing, buyBox)) {
            listings.push(listing);
          }
        }
        if (listings.length > 0) return listings;
      }
    } catch {
      // JSON parse failed, fall through to regex
    }
  }

  // Strategy 2: Line-by-line regex extraction
  // Look for patterns like "2021 Toyota Hilux SR5 - $45,000 - 65,000km - Sydney NSW"
  const lines = responseText.split("\n");
  for (const line of lines) {
    // Match year-make-model pattern with price
    const yearMatch = line.match(/\b(20[0-2]\d)\b/);
    const priceMatch = line.match(/\$[\s]*([\d,]+)/);
    if (!yearMatch || !priceMatch) continue;

    const year = parseInt(yearMatch[1]);
    const price = parseInt(priceMatch[1].replace(/,/g, ""));
    if (isNaN(year) || isNaN(price) || price < 1000) continue;

    // Try to extract make/model from context around the year
    const afterYear = line.slice(line.indexOf(yearMatch[0]) + yearMatch[0].length).trim();
    const makeModelMatch = afterYear.match(/^[\s-]*([A-Z][a-z]+)\s+([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)/);

    let make = makeModelMatch?.[1] ?? buyBox.makes[0] ?? "Unknown";
    let model = makeModelMatch?.[2] ?? buyBox.models[0] ?? "Unknown";

    // Check if any buy box make appears in the line
    for (const bMake of buyBox.makes) {
      if (line.toLowerCase().includes(bMake.toLowerCase())) {
        make = bMake;
        // Try to find the model after the make
        const makeIdx = line.toLowerCase().indexOf(bMake.toLowerCase());
        const afterMake = line.slice(makeIdx + bMake.length).trim();
        const modelMatch = afterMake.match(/^[\s-]*([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)/);
        if (modelMatch) model = modelMatch[1];
        break;
      }
    }

    // Extract km
    const kmMatch = line.match(/([\d,]+)\s*(?:km|kms|kilometres)/i);
    const km = kmMatch ? parseInt(kmMatch[1].replace(/,/g, "")) : undefined;

    // Extract location
    const stateMatch = line.match(/\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/);
    const suburbMatch = line.match(/(?:in|from|at|located)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);

    // Extract URL
    const urlMatch = line.match(/https?:\/\/[^\s)]+/);

    // Detect dealer posts
    const dealerKeywords = ["dealer", "dealership", "wholesale", "yard", "motors", "auto group", "cars direct"];
    const isDealerPost = dealerKeywords.some(kw => line.toLowerCase().includes(kw));

    const title = `${year} ${make} ${model}`;
    const sourceId = urlMatch
      ? urlMatch[0].replace(/[^a-zA-Z0-9]/g, "").slice(-20)
      : `${source}-${year}-${make}-${model}-${price}`.toLowerCase().replace(/\s/g, "-");

    const listing: ParsedListing = {
      title,
      year,
      make,
      model,
      price,
      km,
      suburb: suburbMatch?.[1],
      state: stateMatch?.[1],
      sourceUrl: urlMatch?.[0] ?? `https://${source === "carsales" ? "www.carsales.com.au" : source === "gumtree" ? "www.gumtree.com.au" : "www.facebook.com/marketplace"}/search/${make.toLowerCase()}-${model.toLowerCase()}`,
      sourceId,
      isDealerPost,
      dealerPostReason: isDealerPost ? "Dealer keywords detected in listing text" : undefined,
    };

    if (isWithinBuyBox(listing, buyBox)) {
      listings.push(listing);
    }
  }

  // Strategy 3: If we got nothing, try to extract from bullet points or numbered lists
  if (listings.length === 0) {
    const bulletPattern = /(?:^|\n)\s*(?:[-•*\d.]+)\s*(.*?\$[\d,]+.*?)(?=\n|$)/g;
    let match: RegExpExecArray | null;
    while ((match = bulletPattern.exec(responseText)) !== null) {
      const bullet = match[1];
      const yearM = bullet.match(/\b(20[0-2]\d)\b/);
      const priceM = bullet.match(/\$[\s]*([\d,]+)/);
      if (!yearM || !priceM) continue;

      const year = parseInt(yearM[1]);
      const price = parseInt(priceM[1].replace(/,/g, ""));
      if (isNaN(year) || isNaN(price) || price < 1000) continue;

      const make = buyBox.makes[0] ?? "Unknown";
      const model = buyBox.models[0] ?? "Unknown";
      const kmM = bullet.match(/([\d,]+)\s*(?:km|kms)/i);
      const stateM = bullet.match(/\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/);

      listings.push({
        title: `${year} ${make} ${model}`,
        year,
        make,
        model,
        price,
        km: kmM ? parseInt(kmM[1].replace(/,/g, "")) : undefined,
        state: stateM?.[1],
        sourceUrl: `https://${source === "carsales" ? "www.carsales.com.au" : source === "gumtree" ? "www.gumtree.com.au" : "www.facebook.com/marketplace"}/listing/${year}-${make}-${model}`.toLowerCase(),
        sourceId: `${source}-${year}-${make}-${model}-${price}`,
        isDealerPost: false,
      });
    }
  }

  return listings;
}

/** Normalise a raw object (from JSON parsing) into our listing shape */
function normaliseListingObj(
  obj: Record<string, unknown>,
  source: "carsales" | "gumtree" | "facebook"
): ParsedListing | null {
  const year = Number(obj.year ?? obj.Year ?? 0);
  const price = Number(String(obj.price ?? obj.Price ?? "0").replace(/[$,]/g, ""));
  const make = String(obj.make ?? obj.Make ?? "");
  const model = String(obj.model ?? obj.Model ?? "");
  if (!year || !price || !make) return null;

  const kmRaw = obj.km ?? obj.kms ?? obj.kilometres ?? obj.odometer;
  const km = kmRaw ? Number(String(kmRaw).replace(/[,km\s]/g, "")) : undefined;

  const url = String(obj.url ?? obj.link ?? obj.sourceUrl ?? "");
  const sourceId = url
    ? url.replace(/[^a-zA-Z0-9]/g, "").slice(-20)
    : `${source}-${year}-${make}-${model}-${price}`.toLowerCase().replace(/\s/g, "-");

  return {
    title: String(obj.title ?? `${year} ${make} ${model}`),
    year,
    make,
    model,
    variant: obj.variant ? String(obj.variant) : undefined,
    price,
    km: km && !isNaN(km) ? km : undefined,
    transmission: obj.transmission ? String(obj.transmission) : undefined,
    fuel: obj.fuel ? String(obj.fuel) : undefined,
    bodyType: obj.bodyType ?? obj.body_type ? String(obj.bodyType ?? obj.body_type) : undefined,
    colour: obj.colour ?? obj.color ? String(obj.colour ?? obj.color) : undefined,
    suburb: obj.suburb ?? obj.location ? String(obj.suburb ?? obj.location) : undefined,
    state: obj.state ? String(obj.state) : undefined,
    sourceUrl: url || `https://www.${source === "facebook" ? "facebook.com/marketplace" : source + ".com.au"}/`,
    sourceId,
    sellerName: obj.sellerName ?? obj.seller ? String(obj.sellerName ?? obj.seller) : undefined,
    isDealerPost: Boolean(obj.isDealerPost ?? obj.isDealer ?? false),
    dealerPostReason: obj.dealerPostReason ? String(obj.dealerPostReason) : undefined,
  };
}

/** Check if a parsed listing falls within buy box criteria */
function isWithinBuyBox(listing: ParsedListing, buyBox: BuyBox): boolean {
  if (listing.year < buyBox.yearMin || listing.year > buyBox.yearMax) return false;
  if (listing.price < buyBox.priceMin || listing.price > buyBox.priceMax) return false;
  if (listing.km && listing.km > buyBox.kmMax) return false;
  if (buyBox.states.length > 0 && listing.state && !buyBox.states.includes(listing.state)) return false;

  // Check makes (case-insensitive)
  if (buyBox.makes.length > 0) {
    const matchesMake = buyBox.makes.some(
      (m) => listing.make.toLowerCase().includes(m.toLowerCase()) || listing.title.toLowerCase().includes(m.toLowerCase())
    );
    if (!matchesMake) return false;
  }

  // Check exclude keywords
  if (buyBox.excludeKeywords.length > 0) {
    const titleLower = listing.title.toLowerCase();
    const descLower = (listing.description ?? "").toLowerCase();
    for (const kw of buyBox.excludeKeywords) {
      if (titleLower.includes(kw.toLowerCase()) || descLower.includes(kw.toLowerCase())) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Compute a quick deal score (1-10) based on price position vs buy box range.
 * Higher score = better deal (lower price relative to box range).
 */
function quickDealScore(listing: ParsedListing, buyBox: BuyBox): number {
  const range = buyBox.priceMax - buyBox.priceMin;
  if (range <= 0) return 5;
  // Position in range: 0 = at priceMin (great deal), 1 = at priceMax (meh)
  const position = (listing.price - buyBox.priceMin) / range;
  // Invert: lower price = higher score
  const base = Math.round((1 - position) * 7) + 3; // 3-10 range
  // Bonus for low km
  let bonus = 0;
  if (listing.km && listing.km < buyBox.kmMax * 0.5) bonus += 1;
  // Penalty for dealer posts
  if (listing.isDealerPost) bonus -= 2;
  return Math.max(1, Math.min(10, base + bonus));
}

export const run = action({
  args: {
    trigger: v.union(
      v.literal("manual"),
      v.literal("schedule"),
      v.literal("event"),
      v.literal("api"),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<{ runId: Id<"agentRuns">; listings: number }> => {
    const runId = await ctx.runMutation(api.agentRuns.create, {
      agentName: "hunter",
      trigger: args.trigger,
    });

    try {
      const buyBoxes: BuyBox[] = await ctx.runQuery(api.buyBoxes.getActive, {});

      if (buyBoxes.length === 0) {
        await ctx.runMutation(api.agentRuns.addProgress, {
          id: runId,
          message: "No active buy boxes configured. Please create a buy box in Settings first.",
        });
        await ctx.runMutation(api.agentRuns.complete, {
          id: runId,
          resultSummary: "No active buy boxes found",
        });
        return { runId, listings: 0 };
      }

      let totalListingsFound = 0;
      let totalNewListings = 0;
      let totalDealerPosts = 0;
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      for (let b = 0; b < buyBoxes.length; b++) {
        const buyBox = buyBoxes[b];
        const boxProgress = Math.round((b / buyBoxes.length) * 80);

        await ctx.runMutation(api.agentRuns.addProgress, {
          id: runId,
          message: `🔍 Processing buy box: ${buyBox.name} (${b + 1}/${buyBoxes.length})`,
          percent: boxProgress + 5,
        });

        const sources = ["carsales", "gumtree", "facebook"] as const;

        for (let s = 0; s < sources.length; s++) {
          const source = sources[s];
          const sourcePercent = boxProgress + 5 + Math.round((s / sources.length) * (80 / buyBoxes.length));

          await ctx.runMutation(api.agentRuns.addProgress, {
            id: runId,
            message: `Scanning ${source}.com.au for ${buyBox.makes.join("/")} ${buyBox.models.join("/")}...`,
            percent: sourcePercent,
          });

          try {
            const makeModelStr = buyBox.makes
              .flatMap((make) =>
                buyBox.models.length > 0
                  ? buyBox.models.map((model) => `${make} ${model}`)
                  : [make]
              )
              .join(", ");

            const stateStr = buyBox.states.length > 0 ? buyBox.states.join(", ") : "Australia";
            const bodyStr = buyBox.bodyTypes.length > 0 ? `, body types: ${buyBox.bodyTypes.join(", ")}` : "";
            const transStr = buyBox.transmissions.length > 0 ? `, transmission: ${buyBox.transmissions.join("/")}` : "";

            const searchResult = await callViktorTool<{ search_response: string }>(
              "quick_ai_search",
              {
                search_question: `Search ${source === "carsales" ? "carsales.com.au" : source === "gumtree" ? "gumtree.com.au" : "Facebook Marketplace Australia"} for: ${makeModelStr}, year ${buyBox.yearMin}-${buyBox.yearMax}, price $${buyBox.priceMin.toLocaleString()}-$${buyBox.priceMax.toLocaleString()}, under ${buyBox.kmMax.toLocaleString()}km, in ${stateStr}${bodyStr}${transStr}. List EVERY individual listing you can find with: year, make, model, variant, price, kilometres, location (suburb + state), and listing URL. Focus on PRIVATE sellers only. For each listing include whether it appears to be a dealer post. Format each listing on its own line with all details.`,
              }
            );

            totalInputTokens += 600;
            totalOutputTokens += 1800;

            // Parse the response into structured listings
            const parsedListings = parseListingsFromResponse(
              searchResult.search_response,
              source,
              buyBox
            );

            totalListingsFound += parsedListings.length;

            await ctx.runMutation(api.agentRuns.addProgress, {
              id: runId,
              message: `Found ${parsedListings.length} listing(s) on ${source}. Saving...`,
              percent: sourcePercent + 5,
            });

            // Save each listing to the DB
            for (const parsed of parsedListings) {
              try {
                if (parsed.isDealerPost) {
                  totalDealerPosts++;
                }

                const score = quickDealScore(parsed, buyBox);

                const listingId = await ctx.runMutation(api.listings.create, {
                  source,
                  sourceUrl: parsed.sourceUrl,
                  sourceId: parsed.sourceId,
                  title: parsed.title,
                  year: parsed.year,
                  make: parsed.make,
                  model: parsed.model,
                  variant: parsed.variant,
                  price: parsed.price,
                  km: parsed.km,
                  transmission: parsed.transmission,
                  fuel: parsed.fuel,
                  bodyType: parsed.bodyType,
                  colour: parsed.colour,
                  suburb: parsed.suburb,
                  state: parsed.state,
                  daysListed: parsed.daysListed,
                  photos: [],
                  description: parsed.description,
                  sellerName: parsed.sellerName,
                  rego: undefined,
                });

                // Set initial deal score
                await ctx.runMutation(api.listings.updateScoring, {
                  id: listingId,
                  dealScore: score,
                  scoringReasoning: `Quick score: price $${parsed.price.toLocaleString()} within buy box range $${buyBox.priceMin.toLocaleString()}-$${buyBox.priceMax.toLocaleString()}${parsed.km ? `, ${parsed.km.toLocaleString()}km` : ""}${parsed.isDealerPost ? " (dealer post detected, -2)" : ""}`,
                });

                totalNewListings++;

                // Add to activity feed
                await ctx.runMutation(api.activityFeed.create, {
                  agentName: "hunter",
                  type: "listing_found",
                  title: `New listing: ${parsed.title}`,
                  description: `$${parsed.price.toLocaleString()}${parsed.km ? ` · ${(parsed.km / 1000).toFixed(0)}k km` : ""}${parsed.state ? ` · ${parsed.state}` : ""} · ${source} · Score ${score}/10`,
                });
              } catch (err) {
                // Dedup — listing already exists, that's fine
                const errMsg = err instanceof Error ? err.message : "";
                if (!errMsg.includes("duplicate") && !errMsg.includes("already exists")) {
                  await ctx.runMutation(api.agentRuns.addProgress, {
                    id: runId,
                    message: `⚠️ Error saving listing "${parsed.title}": ${errMsg}`,
                  });
                }
              }
            }

            await ctx.runMutation(api.agentRuns.addProgress, {
              id: runId,
              message: `✅ ${source}: ${parsedListings.length} found, ${parsedListings.filter(l => !l.isDealerPost).length} private sellers`,
            });
          } catch (err) {
            await ctx.runMutation(api.agentRuns.addProgress, {
              id: runId,
              message: `❌ Error scanning ${source}: ${err instanceof Error ? err.message : "Unknown error"}`,
            });
          }
        }
      }

      const estCost = (totalInputTokens * 3 + totalOutputTokens * 15) / 1_000_000;

      await ctx.runMutation(api.agentRuns.complete, {
        id: runId,
        resultSummary: `Scanned ${buyBoxes.length} buy box(es) across 3 sources. Found ${totalListingsFound} listings total, ${totalNewListings} new saved to DB. ${totalDealerPosts} flagged as dealer posts.`,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        costUsd: Math.round(estCost * 10000) / 10000,
      });

      return { runId, listings: totalNewListings };
    } catch (err) {
      await ctx.runMutation(api.agentRuns.fail, {
        id: runId,
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  },
});
