"use client";

import { Preloader } from "@/components/ui/Preloader";

export default function DocsLoading() {
  return <Preloader isLoading={true} animationSrc="/animations/gear-loader.lottie" />;
}
