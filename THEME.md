# YouTube Content OS - Theme Documentation

## CSS Custom Properties

The application uses a warm organic green color palette defined with oklch color space for perceptual uniformity.

### Light Mode

```css
:root {
  --background: oklch(0.9711 0.0074 80.7211);
  --foreground: oklch(0.2989 0.0390 29.5037);
  --card: oklch(0.9711 0.0074 80.7211);
  --card-foreground: oklch(0.2989 0.0390 29.5037);
  --popover: oklch(0.9711 0.0074 80.7211);
  --popover-foreground: oklch(0.2989 0.0390 29.5037);
  --primary: oklch(0.5329 0.1451 143.8751);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9582 0.0244 147.2913);
  --secondary-foreground: oklch(0.4331 0.1236 143.9862);
  --muted: oklch(0.9376 0.0159 73.6769);
  --muted-foreground: oklch(0.4494 0.0531 39.2056);
  --accent: oklch(0.8985 0.0554 145.9040);
  --accent-foreground: oklch(0.4331 0.1236 143.9862);
  --destructive: oklch(0.5474 0.2067 27.5515);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.8811 0.0225 74.0764);
  --input: oklch(0.8811 0.0225 74.0764);
  --ring: oklch(0.5329 0.1451 143.8751);
  --chart-1: oklch(0.6838 0.1756 143.9452);
  --chart-2: oklch(0.5843 0.1551 143.9216);
  --chart-3: oklch(0.5329 0.1451 143.8751);
  --chart-4: oklch(0.4331 0.1236 143.9862);
  --chart-5: oklch(0.2470 0.0587 145.4280);
  --sidebar: oklch(0.9376 0.0159 73.6769);
  --sidebar-foreground: oklch(0.2989 0.0390 29.5037);
  --sidebar-primary: oklch(0.5329 0.1451 143.8751);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.8985 0.0554 145.9040);
  --sidebar-accent-foreground: oklch(0.4331 0.1236 143.9862);
  --sidebar-border: oklch(0.8811 0.0225 74.0764);
  --sidebar-ring: oklch(0.5329 0.1451 143.8751);
  --font-sans: Montserrat, sans-serif;
  --font-serif: Merriweather, serif;
  --font-mono: Source Code Pro, monospace;
  --radius: 0.75rem;
}
```

### Dark Mode

```css
.dark {
  --background: oklch(0.2706 0.0309 151.7274);
  --foreground: oklch(0.9428 0.0114 71.8962);
  --card: oklch(0.3343 0.0313 146.5666);
  --card-foreground: oklch(0.9428 0.0114 71.8962);
  --popover: oklch(0.3343 0.0313 146.5666);
  --popover-foreground: oklch(0.9428 0.0114 71.8962);
  --primary: oklch(0.6838 0.1756 143.9452);
  --primary-foreground: oklch(0.2470 0.0587 145.4280);
  --secondary: oklch(0.3957 0.0306 143.2185);
  --secondary-foreground: oklch(0.8991 0.0183 142.8150);
  --muted: oklch(0.2954 0.0234 147.4071);
  --muted-foreground: oklch(0.8584 0.0192 75.3024);
  --accent: oklch(0.5843 0.1551 143.9216);
  --accent-foreground: oklch(0.9428 0.0114 71.8962);
  --destructive: oklch(0.5474 0.2067 27.5515);
  --destructive-foreground: oklch(0.9428 0.0114 71.8962);
  --border: oklch(0.3957 0.0306 143.2185);
  --input: oklch(0.3957 0.0306 143.2185);
  --ring: oklch(0.6838 0.1756 143.9452);
  --chart-1: oklch(0.7729 0.1295 145.3349);
  --chart-2: oklch(0.7261 0.1535 144.6329);
  --chart-3: oklch(0.6838 0.1756 143.9452);
  --chart-4: oklch(0.6402 0.1666 144.0910);
  --chart-5: oklch(0.5843 0.1551 143.9216);
  --sidebar: oklch(0.2706 0.0309 151.7274);
  --sidebar-foreground: oklch(0.9428 0.0114 71.8962);
  --sidebar-primary: oklch(0.6838 0.1756 143.9452);
  --sidebar-primary-foreground: oklch(0.2470 0.0587 145.4280);
  --sidebar-accent: oklch(0.5843 0.1551 143.9216);
  --sidebar-accent-foreground: oklch(0.9428 0.0114 71.8962);
  --sidebar-border: oklch(0.3957 0.0306 143.2185);
  --sidebar-ring: oklch(0.6838 0.1756 143.9452);
}
```

## Typography

### Font Stack

- **Sans-serif (UI)**: Montserrat - Used for all UI elements, buttons, labels
- **Serif (Content)**: Merriweather - Used for scripts, descriptions, readable content
- **Monospace (Code)**: Source Code Pro - Used for timestamps, technical content

### Usage Guidelines

```tsx
// UI elements - Montserrat (default)
<h1 className="font-sans">Heading</h1>
<Button>Action</Button>

// Content - Merriweather
<p className="font-serif">Long-form content...</p>
<Textarea className="font-serif" />

// Code/Timestamps - Source Code Pro
<code className="font-mono">0:00 - 0:15</code>
<pre className="font-mono">Script content</pre>
```

## Border Radius

- **Cards**: `rounded-lg` (0.75rem)
- **Inputs**: `rounded-md` (0.35rem)
- **Buttons**: `rounded-full` for primary actions, `rounded-md` for secondary
- **Avatars**: `rounded-full`

## Shadows

```css
--shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
--shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
--shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
--shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
--shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
--shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
--shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
--shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
```

## Component Patterns

### Cards

```tsx
<Card className="bg-card border-border rounded-lg shadow-sm">
  <CardHeader>
    <CardTitle className="font-sans text-foreground">Title</CardTitle>
    <CardDescription className="text-muted-foreground">
      Description text
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Buttons

```tsx
// Primary action
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
  Finalize
</Button>

// Secondary action
<Button variant="outline" className="border-border">
  Refresh
</Button>

// Ghost action (pin, edit)
<Button variant="ghost" size="icon">
  <Bookmark className="h-4 w-4" />
</Button>
```

### Form Inputs

```tsx
<Label className="font-sans text-foreground">Label</Label>
<Input className="bg-input border-input rounded-md" />
<Textarea className="bg-input border-input font-serif" />
```
