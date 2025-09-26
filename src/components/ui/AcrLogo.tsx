import Image from "next/image";

interface AcrLogoProps {
  className?: string;
  variant?: 'red' | 'black';
  width?: number;
  height?: number;
}

export function AcrLogo({
  className = "h-8",
  variant = 'red',
  width = 120,
  height = 32
}: AcrLogoProps) {
  const logoSrc = `/logos/acr-logo-${variant}.svg`;

  return (
    <Image
      src={logoSrc}
      alt="ACR Automotive"
      width={width}
      height={height}
      className={`${className} object-contain`}
      priority
    />
  );
}