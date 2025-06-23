# Humbleicons Integration Guide

## Overview

[Humbleicons](https://www.humbleicons.com) has been successfully installed and integrated into your Next.js app. Humbleicons is a pack of simple, neutral, carefully crafted icons that you can use in your personal and commercial projects for free.

## Installation Complete

✅ **Package installed**: `humbleicons@1.15.0` via pnpm
✅ **SVG sprite copied**: `public/humbleicons.svg`
✅ **React component created**: `components/ui/humbleicon.tsx`
✅ **CSS styling added**: `styles/globals.css`
✅ **Showcase component created**: `components/humbleicons-showcase.tsx`

## Files Created/Modified

### 1. React Component (`components/ui/humbleicon.tsx`)
A reusable React component with TypeScript support:

```tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface HumbleIconProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
}

export function HumbleIcon({
  name,
  className,
  size = 'md',
  style
}: HumbleIconProps) {
  return (
    <svg
      className={cn('humbleicons inline-block', sizeClasses[size], className)}
      style={style}
      aria-hidden="true"
    >
      <use xlinkHref={`/humbleicons.svg#${name}`} />
    </svg>
  );
}
```

### 2. CSS Styling (`styles/globals.css`)
Added the recommended humbleicons styling:

```css
.humbleicons {
  width: 1.3em;
  height: 1.3em;
  display: inline-block;
  align-self: center;
  vertical-align: text-top;
  color: currentColor;
  fill: currentColor;
  stroke: currentColor;
}
```

### 3. SVG Sprite (`public/humbleicons.svg`)
The complete SVG sprite file containing all humbleicons, accessible at `/humbleicons.svg`.

## Usage Examples

### Basic Usage
```tsx
import { HumbleIcon } from '../components/ui/humbleicon';

// Simple icon
<HumbleIcon name="shield" />

// With custom size
<HumbleIcon name="user" size="lg" />

// With custom styling
<HumbleIcon name="heart" className="text-red-500" />
```

### In Buttons
```tsx
<button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md">
  <HumbleIcon name="plus" size="sm" className="mr-2" />
  Add Item
</button>
```

### In Navigation
```tsx
<a href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
  <HumbleIcon name="home" size="sm" className="mr-2" />
  Dashboard
</a>
```

### Status Indicators
```tsx
<div className="flex items-center">
  <HumbleIcon name="check" size="sm" className="mr-2 text-green-500" />
  <span className="text-green-700">Success</span>
</div>
```

## Available Icons

Humbleicons includes hundreds of icons. Here are some commonly used ones:

### Navigation & Interface
- `home`, `arrow-right`, `arrow-left`, `settings`, `search`, `menu`
- `plus`, `minus`, `x`, `check`, `star`, `heart`

### Communication & Social
- `bell`, `mail`, `phone`, `message`, `share`

### Finance & Business
- `wallet`, `credit-card`, `chart`, `trending-up`, `dollar-sign`

### Security & System
- `shield`, `lock`, `unlock`, `key`, `eye`, `eye-off`

### User & Account
- `user`, `users`, `profile`, `account`

### Files & Data
- `file`, `folder`, `download`, `upload`, `archive`

## Size Options

The component supports 4 predefined sizes:
- `sm`: 16x16 (w-4 h-4)
- `md`: 20x20 (w-5 h-5) - default
- `lg`: 24x24 (w-6 h-6)
- `xl`: 32x32 (w-8 h-8)

## Color Customization

Icons inherit the current text color and can be customized:

```tsx
// Using Tailwind classes
<HumbleIcon name="heart" className="text-red-500" />
<HumbleIcon name="check" className="text-green-600" />
<HumbleIcon name="star" className="text-yellow-500" />

// Using custom styles
<HumbleIcon
  name="shield"
  style={{ color: '#3B82F6' }}
/>
```

## Integration with Existing Icons

Humbleicons works seamlessly alongside your existing icon libraries (Heroicons, Lucide React):

```tsx
import { Shield as LucideShield } from 'lucide-react';
import { HumbleIcon } from '../components/ui/humbleicon';

// Compare different icon libraries
<div className="flex space-x-4">
  <LucideShield className="h-5 w-5 text-blue-600" />
  <HumbleIcon name="shield" className="text-blue-600" />
</div>
```

## Best Practices

1. **Consistent Sizing**: Use the size prop for consistent icon sizing
2. **Accessibility**: Icons are marked as `aria-hidden="true"` by default
3. **Performance**: The SVG sprite method is efficient for loading multiple icons
4. **Color Inheritance**: Icons inherit the current text color by default
5. **Semantic Usage**: Choose appropriate icon names that match their semantic meaning

## Troubleshooting

### Icon Not Displaying
- Ensure the icon name is correct (check the sprite file)
- Verify the sprite file is accessible at `/humbleicons.svg`
- Check that the CSS styles are loaded

### TypeScript Errors
- Make sure the component is properly imported
- Verify that the `cn` utility function is available from `lib/utils`

### Performance
- The SVG sprite method loads all icons once and references them efficiently
- Consider lazy loading if you have many icons on a single page

## Resources

- [Official Humbleicons Website](https://www.humbleicons.com)
- [GitHub Repository](https://github.com/zraly/humbleicons)
- [Figma File](https://www.figma.com/community/file/1130668478279346604)

## Next Steps

You can now:
1. Replace existing icons with humbleicons where appropriate
2. Use humbleicons for new UI components
3. Combine different icon libraries based on your design needs
4. Explore the full set of available icons in the sprite file

The integration is complete and the icons are ready to use throughout your application!
