import { db, listingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

// Deliberately fictional. Never represents registry availability or verified credits.
const projects = [
  ["Chikkaballapur Melia Dubia Block", "Karnataka", "voluntary", "removal", "issued", 2024, "Demo Verra", "Agroforestry", 1200, 850, null, 92, 13.435, 77.731],
  ["Coorg Community Forest", "Karnataka", "voluntary", "avoidance", "issued", 2023, "Demo Gold Standard", "Forest conservation", 1800, 1200, null, 88, 12.424, 75.739],
  ["Pune Biochar Collective", "Maharashtra", "voluntary", "removal", "issued", 2025, "Demo Puro.earth", "Biochar", 2400, 320, null, 95, 18.52, 73.856],
  ["Belagavi Clean Cooking", "Karnataka", "voluntary", "reduction", "issued", 2024, "Demo Gold Standard", "Clean cookstoves", 600, 2400, null, 81, 15.85, 74.497],
  ["Satara Bamboo Grove", "Maharashtra", "voluntary", "removal", "future", 2026, "Demo Verra", "Bamboo agroforestry", 1100, 1500, 2028, 86, 17.68, 73.99],
  ["Shivamogga Soil Project", "Karnataka", "voluntary", "removal", "future", 2026, "Demo Verra", "Soil carbon", 950, 780, 2027, 83, 13.93, 75.57],
  ["Mandya Farm Forestry", "Karnataka", "india_offset", "removal", "issued", 2024, "Demo Indian Carbon Registry", "Farm forestry", 1000, 900, null, 89, 12.52, 76.9],
  ["Nashik Rice Methane Project", "Maharashtra", "india_offset", "reduction", "issued", 2025, "Demo Indian Carbon Registry", "Alternate wetting and drying", 800, 1700, null, 84, 19.997, 73.79],
  ["Dharwad Solar Community", "Karnataka", "india_offset", "avoidance", "issued", 2023, "Demo Indian Carbon Registry", "Community solar", 700, 3200, null, 80, 15.458, 75.008],
  ["Kolhapur Tree Corridor", "Maharashtra", "india_offset", "removal", "future", 2026, "Demo Indian Carbon Registry", "Afforestation", 1300, 1100, 2029, 87, 16.705, 74.243],
  ["Ballari Plant Efficiency", "Karnataka", "india_compliance", "reduction", "issued", 2025, "Demo CCTS", "Industrial efficiency", 1600, 4200, null, 90, 15.139, 76.921],
  ["Solapur Cement Efficiency", "Maharashtra", "india_compliance", "reduction", "retired", 2024, "Demo CCTS", "Waste heat recovery", 1450, 600, null, 85, 17.659, 75.907],
] as const;

const issuedDocuments = [
  "registry statement showing serial numbers",
  "verification report",
  "project design document",
  "land or project ownership proof",
];
const futureDocuments = [
  "project design document or registration proof",
  "planting plan",
  "land or project ownership proof",
  "delivery schedule",
];
const deliberatelyMissingDocuments: Record<number, string[]> = {
  1: ["verification report"],
  4: ["planting plan", "delivery schedule"],
  10: ["land or project ownership proof"],
};

export async function seedListings() {
  const existing = await db.select({
    id: listingsTable.id,
    project_name: listingsTable.project_name,
    documents: listingsTable.documents,
    demo: listingsTable.demo,
  }).from(listingsTable);
  if (existing.length) {
    const byName = new Map(existing.map(listing => [listing.project_name, listing]));
    await Promise.all(projects.map(async (project, index) => {
      const listing = byName.get(project[0]);
      if (!listing?.demo || listing.documents.length) return;
      const documents = (project[4] === "future" ? futureDocuments : issuedDocuments)
        .filter(document => !deliberatelyMissingDocuments[index]?.includes(document));
      await db.update(listingsTable).set({ documents }).where(eq(listingsTable.id, listing.id));
    }));
    return;
  }
  await db.insert(listingsTable).values(projects.map((p, index) => ({
    project_name: p[0], region: p[1], market: p[2], action: p[3], status: p[4],
    vintage: p[5], registry: p[6], method: p[7], price_inr_per_t: p[8], quantity_t: p[9],
    delivery_year: p[10], zerocarbon_score: p[11], lat: p[12], lon: p[13],
    documents: (p[4] === "future" ? futureDocuments : issuedDocuments)
      .filter(document => !deliberatelyMissingDocuments[index]?.includes(document)),
    description: `A clearly fictional ${p[7].toLowerCase()} demonstration project in ${p[1]}. Explore how ${p[3]} credits are labelled and compared. This listing, its score, price and serial numbers are demo data, not verified registry records. No real credits are offered or transferred.`,
    demo: true, hidden: false,
  })));
  logger.info("Seeded 12 fictional demo listings");
}
