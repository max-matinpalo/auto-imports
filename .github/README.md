# auto-imports

Stop hand-writing imports for React components and other PascalCase defaults. `auto-imports` is a tiny Vite plugin that scans your source files, finds named default exports, and injects missing imports automatically.

No more import spaghetti:

```js
import Button from "../../components/Button";
```

Just use the component:

```jsx
<Button />
```

## Install

```bash
npm install -D auto-imports
```

## Usage

Add the plugin to your Vite config:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import autoImports from "auto-imports";

export default defineConfig({
	plugins: [
		autoImports(),
		react()
	]
});
```

That’s it. During development and builds, the plugin scans your source files and injects imports for matching names when they are used.

## How it works

`auto-imports` scans your source directory for `.js`, `.jsx`, `.ts`, and `.tsx` files. It ignores `node_modules`, hidden folders, and `.d.ts` files.

When it finds a capitalized default export, it remembers the export name and file path:

```js
export default function Button() {}
```

Then, when another file uses `Button` without importing or declaring it, the plugin injects the import automatically:

```js
import Button from "./components/Button";
```

## TypeScript support

The plugin also writes a declaration file so TypeScript can understand the auto-imported globals:

```txt
src/global.d.ts
```

Make sure your `tsconfig.json` includes your source directory:

```json
{
	"include": ["src"]
}
```

## Export rules

Only capitalized default exports are auto-imported.

### Supported

```js
export default function Button() {}
```

```js
export default class Modal {}
```

```js
function Avatar() {}
export default Avatar;
```

```js
const Icons = { SearchIcon, CloseIcon };
export default Icons;
```

### Ignored

```js
export default function () {}
```

```js
export default helper;
```

```js
export const Button = () => {};
```

Lowercase names, anonymous defaults, and named exports are ignored. This keeps auto-importing opt-in and predictable.

## Options

```js
autoImports({
	src: "src",
	extensions: [".js", ".jsx", ".ts", ".tsx"],
	dts: "src/global.d.ts"
});
```

| Option | Description | Default |
| --- | --- | --- |
| `src` | Source directory to scan | `"src"` |
| `extensions` | File extensions to scan | `[".js", ".jsx", ".ts", ".tsx"]` |
| `dts` | Generated TypeScript declaration file | `"src/global.d.ts"` |

## Manual imports win

If a file already imports or declares a name, `auto-imports` leaves it alone:

```js
import Button from "./MySpecialButton";

export default function Page() {
	return <Button />;
}
```

The plugin also skips importing from the same file, so exports do not accidentally import themselves. Tiny foot-gun helmet included. 🪖

## Name collisions

Avoid duplicate default export names. If multiple files export the same capitalized name, the latest discovered mapping can replace the previous one internally.

Keep names unique for best results:

```txt
src/components/Button.jsx
src/admin/AdminButton.jsx
```

## Notes

- This is a Vite plugin, not a CLI.
- It does not generate or require `global.js`.
- It does not assign values to `globalThis`.
- It injects real ES imports into transformed modules.
- It is best suited for React components and PascalCase utility groups.

## License

MIT
