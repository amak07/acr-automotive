# Lottie Animations (dotLottie format)

Place your `.lottie` files (dotLottie compressed format) in this directory.

## Recommended: gear-loader.lottie

Download a gear/mechanical loading animation from:

- https://lottiefiles.com (search: "gear loading", "cog spinner", "mechanical")

**Important**: Download as `.lottie` format (compressed), NOT `.json`

Save as `gear-loader.lottie` in this folder.

## Usage

```tsx
import { Preloader } from "@/components/ui/Preloader";

<Preloader
  isLoading={isLoading}
  animationSrc="/animations/gear-loader.lottie"
/>;
```

## Why dotLottie?

- **Smaller file size**: Up to 90% smaller than JSON
- **Faster loading**: Less data to transfer
- **Better compression**: Uses efficient binary format
