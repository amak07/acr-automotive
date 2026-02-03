"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/shared/layout/AppHeader";
import { PublicPartDetails } from "@/components/features/public/parts/PublicPartDetails";
import { usePublicPartById } from "@/hooks";
import { Preloader } from "@/components/ui/Preloader";

// Path to dotLottie animation in public folder
const GEAR_ANIMATION_SRC = "/animations/gear-loader.lottie";

function PartDetailsContent() {
  const params = useParams();
  const sku = params.sku as string;

  const { data: part, isLoading, error } = usePublicPartById(sku);

  // Show preloader during initial load (no data yet)
  const isInitialLoad = isLoading && !part;

  return (
    <>
      <Preloader isLoading={isInitialLoad} animationSrc={GEAR_ANIMATION_SRC} />

      <main className="px-4 py-6 mx-auto md:px-6 lg:max-w-6xl lg:px-8">
        <PublicPartDetails part={part} isLoading={isLoading} error={error} />
      </main>
    </>
  );
}

export default function PublicPartDetailsPage() {
  return (
    <Suspense
      fallback={
        <Preloader isLoading={true} animationSrc={GEAR_ANIMATION_SRC} />
      }
    >
      <div>
        <AppHeader variant="public" />
        <PartDetailsContent />
      </div>
    </Suspense>
  );
}
