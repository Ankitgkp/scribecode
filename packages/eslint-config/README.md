# `@repo/eslint-config`

Shared ESLint flat configurations for the repository.

| Export                     | Use case                              |
| -------------------------- | ------------------------------------- |
| `@repo/eslint-config/base` | Framework-agnostic base (TypeScript). |
| `@repo/eslint-config/react`| React applications (Vite SPA).        |
| `@repo/eslint-config/node` | Node.js applications (backend).       |

Each app exposes an `eslint.config.js` that re-exports the appropriate config:

```js
import { config } from "@repo/eslint-config/react";

export default config;
```
