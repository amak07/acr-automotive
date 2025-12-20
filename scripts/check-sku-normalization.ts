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

async function checkNormalization() {
  const prod = createClient(prodUrl, prodKey);
  const local = createClient(localUrl, localKey);

  console.log("=== CHECKING SKU NORMALIZATION ===\n");

  // Check if acr_sku_normalized exists and is populated in PROD
  const { data: prodSample, error: prodError } = await prod
    .from("parts")
    .select("acr_sku, acr_sku_normalized")
    .limit(10);

  if (prodError) {
    console.log("PROD ERROR:", prodError.message);
  } else {
    console.log("PRODUCTION - Sample parts with acr_sku_normalized:");
    prodSample?.forEach((p) => {
      console.log(
        `  ${p.acr_sku} -> normalized: "${p.acr_sku_normalized || "NULL"}"`
      );
    });
  }

  // Check how many have NULL normalized SKU in prod
  const { count: prodNullCount } = await prod
    .from("parts")
    .select("*", { count: "exact", head: true })
    .is("acr_sku_normalized", null);

  const { count: prodNotNullCount } = await prod
    .from("parts")
    .select("*", { count: "exact", head: true })
    .not("acr_sku_normalized", "is", null);

  console.log(`\nPROD: ${prodNullCount} parts with NULL acr_sku_normalized`);
  console.log(
    `PROD: ${prodNotNullCount} parts with populated acr_sku_normalized`
  );

  // Same for local
  const { data: localSample } = await local
    .from("parts")
    .select("acr_sku, acr_sku_normalized")
    .limit(10);

  console.log("\nLOCAL - Sample parts with acr_sku_normalized:");
  localSample?.forEach((p) => {
    console.log(
      `  ${p.acr_sku} -> normalized: "${p.acr_sku_normalized || "NULL"}"`
    );
  });

  const { count: localNullCount } = await local
    .from("parts")
    .select("*", { count: "exact", head: true })
    .is("acr_sku_normalized", null);

  const { count: localNotNullCount } = await local
    .from("parts")
    .select("*", { count: "exact", head: true })
    .not("acr_sku_normalized", "is", null);

  console.log(`\nLOCAL: ${localNullCount} parts with NULL acr_sku_normalized`);
  console.log(
    `LOCAL: ${localNotNullCount} parts with populated acr_sku_normalized`
  );

  // Check if the normalize_sku function exists in prod
  console.log("\n=== CHECKING FOR normalize_sku FUNCTION ===");
  const { data: funcCheck, error: funcError } = await prod.rpc(
    "normalize_sku",
    { sku: "ACR512001" }
  );

  if (funcError) {
    console.log("PROD: normalize_sku function ERROR:", funcError.message);
  } else {
    console.log("PROD: normalize_sku('ACR512001') =", funcCheck);
  }
}

checkNormalization().catch(console.error);
