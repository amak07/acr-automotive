import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";
import { VALIDATION } from "@/lib/bulk-upload/patterns.config";
import type {
  AnalyzeResult,
  MatchedPart,
  ClassifiedFile,
  PartWithImageStats,
} from "@/lib/bulk-upload/types";

// Schema for the analyze request body
const analyzeRequestSchema = z.object({
  // Files are sent as JSON with classification info (actual files uploaded separately during execute)
  classifiedFiles: z.array(
    z.object({
      filename: z.string(),
      type: z.enum(["product", "360-frame", "skip", "unknown"]),
      extractedSku: z.string().nullable(),
      frameNumber: z.number().optional(),
      viewType: z.enum(["front", "top", "bottom", "other"]).optional(),
    })
  ),
});

type ClassifiedFileInput = z.infer<
  typeof analyzeRequestSchema
>["classifiedFiles"][number];

// Type for search_by_sku RPC result
interface SkuSearchResult {
  id: string;
  acr_sku: string;
  part_type: string;
  position_type: string | null;
  abs_type: string | null;
  bolt_pattern: string | null;
  drive_type: string | null;
  similarity_score: number;
  match_type: string;
}

/**
 * POST /api/admin/bulk-image-upload/analyze
 *
 * Analyzes classified files and matches them to parts in the database.
 * Returns information about which parts will be updated/created and any warnings.
 *
 * Request body:
 * {
 *   classifiedFiles: ClassifiedFile[] - Pre-classified file info from client
 * }
 *
 * Response:
 * {
 *   matchedParts: MatchedPart[] - Parts matched to files
 *   unmatchedFiles: ClassifiedFile[] - Files that couldn't be matched
 *   skippedFiles: string[] - Filenames that were skipped
 *   summary: { totalFiles, matchedFiles, partsToUpdate, partsNew }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classifiedFiles } = analyzeRequestSchema.parse(body);

    // Separate files by type
    const skippedFiles: string[] = [];
    const filesToMatch: ClassifiedFileInput[] = [];

    for (const file of classifiedFiles) {
      if (file.type === "skip") {
        skippedFiles.push(file.filename);
      } else {
        filesToMatch.push(file);
      }
    }

    // Group files by extracted SKU
    const filesBySku = new Map<string, ClassifiedFileInput[]>();
    const noSkuFiles: ClassifiedFileInput[] = [];

    for (const file of filesToMatch) {
      if (!file.extractedSku) {
        noSkuFiles.push(file);
        continue;
      }

      const existing = filesBySku.get(file.extractedSku) || [];
      existing.push(file);
      filesBySku.set(file.extractedSku, existing);
    }

    // Get unique SKUs to match
    const uniqueSkus = Array.from(filesBySku.keys());

    // Match SKUs to parts using search_by_sku RPC
    const skuToPartMap = new Map<
      string,
      { partId: string; acrSku: string; partType: string }
    >();
    const unmatchedSkus = new Set<string>();

    for (const sku of uniqueSkus) {
      const { data: searchResults, error } = await supabase.rpc(
        "search_by_sku",
        { search_sku: sku }
      );

      if (error) {
        console.error(`Error searching for SKU ${sku}:`, error);
        unmatchedSkus.add(sku);
        continue;
      }

      // Find the best match above threshold
      const results = searchResults as SkuSearchResult[];
      const bestMatch = results.find(
        (r) => r.similarity_score >= VALIDATION.skuMatchThreshold
      );

      if (bestMatch) {
        skuToPartMap.set(sku, {
          partId: bestMatch.id,
          acrSku: bestMatch.acr_sku,
          partType: bestMatch.part_type,
        });
      } else {
        unmatchedSkus.add(sku);
      }
    }

    // Get current image stats for matched parts
    const matchedPartIds = Array.from(skuToPartMap.values()).map(
      (p) => p.partId
    );

    const { data: partsWithImages, error: partsError } = await supabase
      .from("parts")
      .select(
        `
        id,
        acr_sku,
        part_type,
        has_360_viewer,
        viewer_360_frame_count,
        part_images(id)
      `
      )
      .in("id", matchedPartIds);

    if (partsError) {
      throw partsError;
    }

    // Create a map of part stats
    const partStatsMap = new Map<
      string,
      {
        imageCount: number;
        has360: boolean;
        frameCount: number;
      }
    >();

    for (const part of partsWithImages || []) {
      partStatsMap.set(part.id, {
        imageCount: part.part_images?.length || 0,
        has360: part.has_360_viewer || false,
        frameCount: part.viewer_360_frame_count || 0,
      });
    }

    // Build matched parts result
    const matchedParts: MatchedPart[] = [];

    for (const [extractedSku, files] of filesBySku) {
      const partInfo = skuToPartMap.get(extractedSku);
      if (!partInfo) continue;

      const stats = partStatsMap.get(partInfo.partId) || {
        imageCount: 0,
        has360: false,
        frameCount: 0,
      };

      // Separate product images and 360 frames
      const productImages = files.filter((f) => f.type === "product");
      const frames360 = files.filter((f) => f.type === "360-frame");
      const unknownFiles = files.filter((f) => f.type === "unknown");

      // Generate warnings
      const warnings: string[] = [];

      // Product image warnings
      const totalProductImages = stats.imageCount + productImages.length;
      if (totalProductImages > VALIDATION.maxProductImages) {
        warnings.push(
          `Will exceed ${VALIDATION.maxProductImages} image limit (current: ${stats.imageCount}, adding: ${productImages.length})`
        );
      }

      // 360 frame warnings
      if (frames360.length > 0) {
        if (
          frames360.length < VALIDATION.min360Frames &&
          frames360.length > 0
        ) {
          warnings.push(
            `Only ${frames360.length} 360° frames (minimum recommended: ${VALIDATION.min360Frames})`
          );
        }
        if (stats.has360) {
          warnings.push(
            `Will replace existing 360° viewer (${stats.frameCount} frames)`
          );
        }
      }

      // Unknown files warning
      if (unknownFiles.length > 0) {
        warnings.push(
          `${unknownFiles.length} file(s) with unrecognized naming pattern`
        );
      }

      // Convert to ClassifiedFile format (without File object since we're server-side)
      const toClassifiedFile = (f: ClassifiedFileInput): ClassifiedFile => ({
        file: null as unknown as File, // Placeholder - actual file sent during execute
        filename: f.filename,
        type: f.type as ClassifiedFile["type"],
        extractedSku: f.extractedSku,
        frameNumber: f.frameNumber,
        viewType: f.viewType,
      });

      matchedParts.push({
        partId: partInfo.partId,
        acrSku: partInfo.acrSku,
        partType: partInfo.partType,
        currentImageCount: stats.imageCount,
        current360FrameCount: stats.frameCount,
        productImages: productImages.map(toClassifiedFile),
        frames360: frames360.map(toClassifiedFile),
        isNew: stats.imageCount === 0 && !stats.has360,
        warnings,
      });
    }

    // Build unmatched files list
    const unmatchedFiles: ClassifiedFile[] = [];

    // Add files with unmatched SKUs
    for (const sku of unmatchedSkus) {
      const files = filesBySku.get(sku) || [];
      for (const f of files) {
        unmatchedFiles.push({
          file: null as unknown as File,
          filename: f.filename,
          type: f.type as ClassifiedFile["type"],
          extractedSku: f.extractedSku,
          frameNumber: f.frameNumber,
          viewType: f.viewType,
        });
      }
    }

    // Add files with no extracted SKU
    for (const f of noSkuFiles) {
      unmatchedFiles.push({
        file: null as unknown as File,
        filename: f.filename,
        type: f.type as ClassifiedFile["type"],
        extractedSku: null,
        frameNumber: f.frameNumber,
        viewType: f.viewType,
      });
    }

    // Build summary
    const matchedFileCount = matchedParts.reduce(
      (sum, p) => sum + p.productImages.length + p.frames360.length,
      0
    );

    const result: AnalyzeResult = {
      matchedParts,
      unmatchedFiles,
      skippedFiles,
      summary: {
        totalFiles: classifiedFiles.length,
        matchedFiles: matchedFileCount,
        partsToUpdate: matchedParts.filter((p) => !p.isNew).length,
        partsNew: matchedParts.filter((p) => p.isNew).length,
      },
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze files" },
      { status: 500 }
    );
  }
}
