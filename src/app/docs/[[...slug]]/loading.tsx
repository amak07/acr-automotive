"use client";

import { Preloader } from "@/components/ui/Preloader";

export default function DocsPageLoading() {
  return <Preloader isLoading={true} animationSrc="/animations/gear-loader.lottie" />;
}
