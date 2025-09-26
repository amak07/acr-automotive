"use client";

import { useParams } from "next/navigation";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicPartDetails } from "@/components/public/parts/PublicPartDetails";
import { usePublicPartById } from "@/hooks";

export default function PublicPartDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: part, isLoading, error } = usePublicPartById(id);

  return (
    <div className="min-h-screen bg-acr-gray-100">
      <PublicHeader />

      <main className="px-4 py-6 mx-auto lg:max-w-6xl lg:px-8">
        <PublicPartDetails part={part} isLoading={isLoading} error={error} />
      </main>
    </div>
  );
}
