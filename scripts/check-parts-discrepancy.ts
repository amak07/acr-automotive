import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load production env
dotenv.config({
  path: path.join(process.cwd(), ".env.production"),
  override: true,
});

const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Local Supabase (default Docker)
const localUrl = "http://127.0.0.1:54321";
const localKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

async function checkParts() {
  const prod = createClient(prodUrl, prodKey);
  const local = createClient(localUrl, localKey);

  console.log("=== PARTS COUNT ===");

  const { count: prodPartsCount } = await prod
    .from("parts")
    .select("*", { count: "exact", head: true });
  const { count: localPartsCount } = await local
    .from("parts")
    .select("*", { count: "exact", head: true });

  console.log("Production parts:", prodPartsCount);
  console.log("Local parts:", localPartsCount);

  console.log("\n=== PART IMAGES COUNT ===");

  const { count: prodImagesCount } = await prod
    .from("part_images")
    .select("*", { count: "exact", head: true });
  const { count: localImagesCount } = await local
    .from("part_images")
    .select("*", { count: "exact", head: true });

  console.log("Production part_images:", prodImagesCount);
  console.log("Local part_images:", localImagesCount);

  console.log("\n=== 360 FRAMES COUNT ===");

  const { count: prod360Count } = await prod
    .from("part_360_frames")
    .select("*", { count: "exact", head: true });
  const { count: local360Count } = await local
    .from("part_360_frames")
    .select("*", { count: "exact", head: true });

  console.log("Production part_360_frames:", prod360Count);
  console.log("Local part_360_frames:", local360Count);

  console.log("\n=== PARTS WITH IMAGES (has_product_images=true) ===");

  const { count: prodWithImages } = await prod
    .from("parts")
    .select("*", { count: "exact", head: true })
    .eq("has_product_images", true);
  const { count: localWithImages } = await local
    .from("parts")
    .select("*", { count: "exact", head: true })
    .eq("has_product_images", true);

  console.log("Production parts with images:", prodWithImages);
  console.log("Local parts with images:", localWithImages);

  console.log("\n=== PARTS WITH 360 VIEWER ===");

  const { count: prodWith360 } = await prod
    .from("parts")
    .select("*", { count: "exact", head: true })
    .eq("has_360_viewer", true);
  const { count: localWith360 } = await local
    .from("parts")
    .select("*", { count: "exact", head: true })
    .eq("has_360_viewer", true);

  console.log("Production parts with 360:", prodWith360);
  console.log("Local parts with 360:", localWith360);

  // Check SKU samples
  console.log("\n=== SAMPLE SKUs FROM LOCAL (first 10) ===");
  const { data: localSampleParts } = await local
    .from("parts")
    .select("acr_sku")
    .order("acr_sku")
    .limit(10);
  console.log(localSampleParts?.map((p) => p.acr_sku).join(", "));

  console.log("\n=== SAMPLE SKUs FROM PROD (first 10) ===");
  const { data: prodSampleParts } = await prod
    .from("parts")
    .select("acr_sku")
    .order("acr_sku")
    .limit(10);
  console.log(prodSampleParts?.map((p) => p.acr_sku).join(", "));

  // Find SKUs in local but not in prod
  console.log("\n=== CHECKING FOR MISSING SKUs ===");
  const { data: allLocalSkus } = await local.from("parts").select("acr_sku");
  const { data: allProdSkus } = await prod.from("parts").select("acr_sku");

  const localSkuSet = new Set(allLocalSkus?.map((p) => p.acr_sku) || []);
  const prodSkuSet = new Set(allProdSkus?.map((p) => p.acr_sku) || []);

  const missingInProd = Array.from(localSkuSet).filter(
    (sku) => !prodSkuSet.has(sku)
  );
  const extraInProd = Array.from(prodSkuSet).filter(
    (sku) => !localSkuSet.has(sku)
  );

  console.log("SKUs in local but NOT in prod:", missingInProd.length);
  if (missingInProd.length > 0 && missingInProd.length <= 20) {
    console.log("  Missing:", missingInProd.join(", "));
  } else if (missingInProd.length > 20) {
    console.log("  First 20 missing:", missingInProd.slice(0, 20).join(", "));
  }

  console.log("SKUs in prod but NOT in local:", extraInProd.length);
  if (extraInProd.length > 0 && extraInProd.length <= 20) {
    console.log("  Extra:", extraInProd.join(", "));
  }
}

checkParts().catch(console.error);
