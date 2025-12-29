# [Component/API/Module] Reference

> **Doc Type**: Reference | **Audience**: Developers

## Overview

**What it is**: [One sentence description]

**Purpose**: [What problem it solves]

**Location**: `src/path/to/module`

## Quick Start

```typescript
// Minimal example to get started
import { Something } from "@/path/to/module";

const result = Something.doThing();
```

## API

### `functionName()`

[Brief description of what the function does]

**Signature**:

```typescript
function functionName(param1: Type1, param2?: Type2): ReturnType;
```

**Parameters**:

| Parameter | Type    | Required | Default        | Description   |
| --------- | ------- | -------- | -------------- | ------------- |
| `param1`  | `Type1` | Yes      | -              | [Description] |
| `param2`  | `Type2` | No       | `defaultValue` | [Description] |

**Returns**: `ReturnType` - [Description of return value]

**Example**:

```typescript
// Basic usage
const result = functionName("value", { option: true });

// With error handling
try {
  const result = functionName("value");
} catch (error) {
  console.error("Failed:", error.message);
}
```

---

### `anotherFunction()`

[Brief description]

**Signature**:

```typescript
function anotherFunction(options: Options): Promise<Result>;
```

**Parameters**:

| Parameter | Type      | Required | Description   |
| --------- | --------- | -------- | ------------- |
| `options` | `Options` | Yes      | [Description] |

**Options Object**:

```typescript
interface Options {
  required: string; // [Description]
  optional?: number; // [Description] (default: 10)
}
```

**Returns**: `Promise<Result>` - [Description]

**Example**:

```typescript
const result = await anotherFunction({
  required: "value",
  optional: 20,
});
```

---

## Types

### `TypeName`

```typescript
interface TypeName {
  id: string;
  name: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}
```

| Property    | Type                      | Description              |
| ----------- | ------------------------- | ------------------------ |
| `id`        | `string`                  | Unique identifier        |
| `name`      | `string`                  | Display name             |
| `createdAt` | `Date`                    | Creation timestamp       |
| `metadata`  | `Record<string, unknown>` | Optional additional data |

---

## Constants

| Constant          | Value  | Description               |
| ----------------- | ------ | ------------------------- |
| `MAX_ITEMS`       | `100`  | Maximum items per request |
| `DEFAULT_TIMEOUT` | `5000` | Default timeout in ms     |

---

## Error Handling

### Error Types

| Error             | Code                | When It Occurs           |
| ----------------- | ------------------- | ------------------------ |
| `ValidationError` | `VALIDATION_FAILED` | Invalid input parameters |
| `NotFoundError`   | `NOT_FOUND`         | Resource doesn't exist   |
| `AuthError`       | `UNAUTHORIZED`      | Missing or invalid auth  |

### Example Error Handling

```typescript
import { ValidationError, NotFoundError } from "@/lib/errors";

try {
  const result = await functionName(params);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof NotFoundError) {
    // Handle not found
  } else {
    // Handle unexpected error
    throw error;
  }
}
```

---

## Configuration

### Environment Variables

| Variable          | Required | Default | Description            |
| ----------------- | -------- | ------- | ---------------------- |
| `FEATURE_ENABLED` | No       | `true`  | Enable/disable feature |
| `MAX_RETRIES`     | No       | `3`     | Maximum retry attempts |

### Runtime Configuration

```typescript
import { configure } from "@/path/to/module";

configure({
  maxRetries: 5,
  timeout: 10000,
});
```

---

## Related

- **Tutorial**: [Getting started with X] → [link]
- **How-To**: [Common task with X] → [link]
- **Architecture**: [How X fits in the system] → [link]

---

_Last updated: YYYY-MM-DD_
