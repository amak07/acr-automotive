interface AcrLogoProps {
  className?: string;
  variant?: 'red' | 'black';
}

export function AcrLogo({ 
  className = "h-8",
  variant = 'red'
}: AcrLogoProps) {
  const logoSrc = `/logos/acr-logo-${variant}.svg`;
  
  return (
    <img
      src={logoSrc}
      alt="ACR Automotive"
      className={`${className} object-contain`}
    />
  );
}