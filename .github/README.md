# auto-imports

Speed up react development by never again waste time writing and fixing imports 😃

## Usage
```bash
npm install -D auto-imports
npx auto-imports --watch
```

This tools generates a file **global.js** that you must import at the top of your app’s entry point (for example, `main.js`):

```js
import "./global.js";
```

## Options

| Option          | Description                | Default         |
|----------------|----------------------------|-----------------|
| `--src <dir>`  | Source directory           | `src`           |
| `--out <file>` | Generated output file      | `src/global.js` |
| `--watch`      | Auto-regenerate on changes |                 |

## Implementation

Mainstream JS developers are terrified of `globalThis` and cry about “polluting the global scope.”

We are C developers. We love globals. We feels experienced enough to break conventions to write faster, cleaner code 😃 This tool automatically scans your `.js`, `.jsx`, `.ts`, and `.tsx` files, grabs your default exports, and binds them globally.

No more:

```js
import Button from "../../components/Button";
```

You just write:

```jsx
<Button/>
```

## The “Named Default” Rule

The script strictly looks for **named default exports**.

At first, this might sound weird, but it works perfectly as an opt-in mechanism. A default export doesn’t technically require a name.

- Want it global? Give it a name:
  ```js
  export default function Button() {}
  ```
- Want it local? Leave it anonymous:
  ```js
  export default function () {}
  ```

If you have a utility module with multiple exports, group them into a single **named default object**, and the whole group becomes globally available automatically.

## Collisions

The script protects against two types of naming collisions by **skipping the conflicting import** and logging a warning:

### Reserved Globals
To avoid overwriting native APIs, the tool checks if an export name already exists in globalThis (e.g., fetch, Map, or Date). If a match is found, the file is ignored to maintain environment stability.

### Duplicate Exports
- If multiple files share the same default export name, the script applies a "first-discovery" rule:
- Selection: Only the first file encountered during the directory crawl is registered in the global file.
- Traceability: The console warning displays the paths for both the registered file and the conflicting one, making it easy to identify which file needs a rename.