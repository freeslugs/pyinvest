# Linting & Prettier Setup for Next.js

## 🎯 Overview

Your Next.js application now has a comprehensive linting and formatting setup following industry best practices. This configuration ensures code quality, consistency, and maintainability across your project.

## 📦 Installed Dependencies

### ESLint & Plugins

- `eslint-config-prettier` - Disables conflicting ESLint rules with Prettier
- `eslint-plugin-import` - Import/export syntax linting
- `eslint-plugin-tailwindcss` - TailwindCSS class name linting
- `@typescript-eslint/eslint-plugin` - TypeScript-specific linting rules
- `@typescript-eslint/parser` - TypeScript parser for ESLint

### Prettier & Plugins

- `prettier` - Code formatter
- `prettier-plugin-tailwindcss` - Automatic TailwindCSS class sorting

## 📝 Configuration Files

### `.eslintrc.json`

- Extends Next.js core web vitals configuration
- Includes import ordering rules
- Configured for TypeScript and React best practices
- Prettier integration to avoid conflicts

### `.prettierrc`

- Single quotes for JavaScript/TypeScript
- Trailing commas where valid in ES5
- 2-space indentation
- 80 character line width
- TailwindCSS class sorting enabled

### `.prettierignore`

- Excludes generated files, dependencies, and build artifacts
- Prevents formatting of package manager files

### `.editorconfig`

- Ensures consistent coding styles across different editors
- UTF-8 encoding, LF line endings, 2-space indentation

### `.vscode/settings.json`

- Auto-format on save
- Auto-fix ESLint issues on save
- Auto-organize imports
- TailwindCSS IntelliSense support

## 🚀 Available Scripts

### Formatting

```bash
npm run format          # Format all files with Prettier
npm run format:check    # Check if files are formatted correctly
```

### Linting

```bash
npm run lint           # Run ESLint
npm run lint:fix       # Run ESLint with auto-fix
npm run lint:strict    # Run full linting suite (ESLint + Prettier + TypeScript)
npm run type-check     # Run TypeScript type checking
npm run check-all      # Run all checks
```

## 🔧 Current Status

### ✅ Working Features

- Code formatting with Prettier
- Import statement organization
- TailwindCSS class sorting
- Basic ESLint rules
- VS Code integration
- Auto-fix on save

### ⚠️ Remaining Warnings

Some console statements and `<img>` elements should be addressed:

- Replace `console.log` with proper logging or remove debug statements
- Replace `<img>` elements with Next.js `<Image>` component
- Fix React Hook dependency arrays where needed

## 💡 Best Practices

### Import Organization

Imports are now automatically organized in this order:

1. Built-in modules (Node.js)
2. External packages
3. Internal modules
4. Parent directory imports
5. Sibling imports
6. Index imports

### Development Workflow

1. **Write code** - Focus on functionality
2. **Save file** - Auto-formatting and ESLint fixes apply
3. **Before commit** - Run `npm run check-all` to ensure quality
4. **CI/CD** - Include linting checks in your pipeline

## 🛠️ Customization

### Adding Rules

To add more ESLint rules, edit `.eslintrc.json`:

```json
{
  "rules": {
    "your-rule": "error"
  }
}
```

### Prettier Options

To modify formatting, edit `.prettierrc`:

```json
{
  "printWidth": 100,
  "tabWidth": 4
}
```

### VS Code Extensions

Recommended extensions for optimal experience:

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)

## 🔍 Troubleshooting

### TypeScript Version Warning

The TypeScript version (5.8.3) is newer than officially supported. This warning can be ignored as functionality works correctly.

### Import Errors

If you see import resolution errors, ensure your `tsconfig.json` paths are correctly configured.

### Pre-commit Hooks

A pre-commit hook is set up to run `npm run lint:strict` before each commit, ensuring code quality.

---

**Next Steps:**

1. Address remaining warnings in your codebase
2. Set up CI/CD pipeline with linting checks
3. Consider adding additional rules based on your team's preferences
