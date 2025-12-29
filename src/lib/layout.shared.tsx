import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      url: "/",
      title: (
        <div className="flex flex-col">
          <Image
            src="/logos/acr-logo-red.svg"
            alt="ACR Automotive"
            width={100}
            height={40}
            className="dark:hidden"
          />
          <Image
            src="/logos/acr-logo-black.svg"
            alt="ACR Automotive"
            width={100}
            height={40}
            className="hidden dark:block"
          />
          <span className="text-lg text-muted-foreground mt-2">
            Documentation Portal
          </span>
        </div>
      ),
    },
  };
}
