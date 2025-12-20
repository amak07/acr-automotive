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

async function checkStorage() {
  const prod = createClient(prodUrl, prodKey);

  console.log("=== CHECKING PRODUCTION STORAGE ===\n");

  // List all files in the storage bucket
  const { data: folders, error: folderError } = await prod.storage
    .from("acr-part-images")
    .list("", { limit: 1000 });

  if (folderError) {
    console.log("Error listing storage:", folderError.message);
    return;
  }

  console.log("Top-level folders/files in storage:", folders?.length);

  // Count files in each folder (SKU)
  let totalFiles = 0;
  let skusWithFiles = 0;

  if (folders) {
    for (const folder of folders.slice(0, 10)) {
      if (folder.name) {
        const { data: files } = await prod.storage
          .from("acr-part-images")
          .list(folder.name, { limit: 100 });
        console.log(`  ${folder.name}: ${files?.length || 0} files`);
        totalFiles += files?.length || 0;
        if (files && files.length > 0) skusWithFiles++;
      }
    }
  }

  console.log("\n=== PRODUCTION DATABASE PART_IMAGES SAMPLE ===");
  const { data: sampleImages } = await prod
    .from("part_images")
    .select("part_id, image_url, view_type")
    .limit(10);

  console.log("Sample part_images records:");
  sampleImages?.forEach((img) => {
    console.log(`  ${img.image_url} (${img.view_type || "no view_type"})`);
  });

  console.log("\n=== PARTS WITHOUT IMAGES IN PROD ===");
  const { data: partsWithoutImages, count } = await prod
    .from("parts")
    .select("acr_sku", { count: "exact" })
    .eq("has_product_images", false)
    .limit(20);

  console.log(`Parts WITHOUT images: ${count}`);
  console.log(
    "Sample SKUs without images:",
    partsWithoutImages
      ?.map((p) => p.acr_sku)
      .slice(0, 10)
      .join(", ")
  );
}

checkStorage().catch(console.error);
