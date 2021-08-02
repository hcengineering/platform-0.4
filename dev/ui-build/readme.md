# anticrm ui-build

`ui-build` build svelte components into JS using esbuild + svelet and it generates TypeScript definitions for Svelte components using typescript compiler and do statically analyzing their props, events, slots and more.

Slots props can be defined using [JSDoc notation](https://jsdoc.app/).

**Please note** that the generated TypeScript definitions require [Svelte version 3.31](https://github.com/sveltejs/svelte/blob/master/CHANGELOG.md#3300) or greater.

---

Given a Svelte component, `ui-build` can generate TypeScript definitions compatible with the [Svelte Language Server](https://github.com/sveltejs/language-tools):

**Button.svelte**

```svelte
<script>
  export let type = "button";
  export let primary = false;
</script>

<button {...$$restProps} {type} class:primary on:click>
  <slot>Click me</slot>
</button>
```

The generated definition extends the official `SvelteComponentTyped` interface exported from Svelte.

**Button.d.ts**

```ts
// eslint-disable-next-line
/// <reference types="svelte" />
import { SvelteComponentTyped } from 'svelte'

export interface ButtonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap['button']> {
  /**
   * @constant
   * @default 'button'
   */
  type?: string

  /**
   * @constant
   * @default false
   */
  primary?: boolean
}

export default class Button extends SvelteComponentTyped<
  ButtonProps,
  { click: WindowEventMap['click'] },
  { default: {} }
> {}
```

Sometimes, inferring prop types is insufficient.

slot types and signatures can be augmented using [JSDoc](https://jsdoc.app/) notations.

```ts
export let type: 'button' | 'submit' | 'reset' | = 'button'

/**
 * Set to `true` to use the primary variant
 */
export let primary = false
```

```ts
// eslint-disable-next-line
/// <reference types="svelte" />
import { SvelteComponentTyped } from 'svelte'

export interface Button2Props extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap['button']> {
  /**
   * @constant
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset'

  /**
   * @constant
   * @default false
   */
  primary?: boolean
}

export default class Button2 extends SvelteComponentTyped<
  Button2Props,
  { click: WindowEventMap['click'] },
  { default: {} }
> {}
```

---

## Table of Contents

- [anticrm ui-build](#anticrm-ui-build)
  - [Table of Contents](#table-of-contents)
  - [Approach](#approach)
  - [Usage](#usage)
    - [Installation](#installation)
  - [API Reference](#api-reference)
    - [`@type`](#type)
    - [`@typedef`](#typedef)
    - [`@slot`](#slot)
    - [`@event`](#event)
    - [`@restProps`](#restprops)
    - [`@extends`](#extends)

## Approach

`ui-build` uses esbuild + typescript + Svelte compiler to statically analyze all Svelte components exported from a library to generate documentation that is useful for the end user.

Extracted metadata:

- props
- slots
- forwarded events
- dispatched events
- `$$restProps`

This tool adopts a progressively enhanced approach. Any property type that cannot be inferred (e.g. "hello" is a string) falls back to "any" to minimize incorrectly typed properties or signatures. To mitigate this, the library author can add type information to TS or via JSDoc annotations for slot to specify types that cannot be reliably inferred.

The generated TypeScript definitions for a component extends the `SvelteComponentTyped` interface available in svelte version 3.31.

## Usage

### Installation

Not required, a part of @anticrm build infrastructure.

## API Reference

A JSDoc type information is optional, and mostly could be used for slot defined props and events, since type inferencing and typescript could not provide enought details for type information in case of slots.

### `@type`

Without a `@type` annotation, ui-build will infer the primitive type for a prop using typescript and inference:

```ts
export let kind = 'primary'
// inferred type: "string"
```

Use the `@type` tag to explicitly document the type. In the following example, the `kind` property has an enumerated (enum) type.

Signature:

```ts
/**
 * Optional description
 * @type {Type}
 */
```

Example:

```ts
/**
 * Specify the kind of button
 * @type {"primary" | "secondary" | "tertiary"}
 */
export let kind = 'primary'

/**
 * Specify the Carbon icon to render
 * @type {typeof import("carbon-icons-svelte").CarbonIcon}
 */
export let renderIcon = Close20
```

### `@typedef`

The `@typedef` tag can be used to define a common type that is used multiple times within a component. All typedefs defined in a component will be exported from the generated TypeScript definition file.

Signature:

```ts
/**
 * @typedef {Type} TypeName
 */
```

Example:

```ts
/**
 * @typedef {string} AuthorName
 * @typedef {{ name?: AuthorName; dob?: string; }} Author
 */

/** @type {Author} */
export let author = {}

/** @type {Author[]} */
export let authors = []
```

### `@slot`

Use the `@slot` tag for typing component slots.

Signature:

```ts
/**
 * @slot {Type} [slot name]
 */
```

Example:

```svelte
<script lang='ts'>
  /**
   * @slot {{ prop: number; doubled: number; }}
   * @slot {{ props: { class?: string; } }} description
   */

  export let prop = 0;
</script>

<h1>
  <slot {prop} doubled={prop * 2} />
</h1>

<p>
  <slot name="description" props={{ class: $$props.class }} />
</p>
```

### `@event`

Use the `@event` tag for typing dispatched events. An event name must be specified.

Signature:

```ts
/**
 * @event {EventDetail} eventname
 */
```

Example:

```ts
/**
 * @event {{ key: string }} button:key
 */

export let key = ''

import { createEventDispatcher } from 'svelte'

const dispatch = createEventDispatcher()

$: dispatch('button:key', { key })
```

### `@restProps`

`ui-build` can pick up inline HTML elements that `$$restProps` is forwarded to. However, it cannot infer the underlying element for instantiated components.

You can use the `@restProps` tag to explicitly define element tags that `$$restProps` is forwarded to.

Signature:

```js
/**
 * Single element
 * @restProps {tagname}
 *
 * Multiple elements
 * @restProps {tagname-1 | tagname-2 | tagname-3}
 */
```

Example:

```svelte
<script>
  /** @restProps {h1 | button} */
  export let edit = false;

  import Button from "../";
</script>

{#if edit}
  <Button {...$$restProps} />
{:else}
  <h1 {...$$restProps}><slot /></h1>
{/if}
```

### `@extends`

In some cases, a component may be based on another component. The `@extends` tag can be used to extend generated component props.

Signature:

```js
/**
 * @extends {<relative path to component>} ComponentProps
 */
```

Example:

```js
/** @extends {"./Button"} ButtonProps */

export const secondary = true

import Button from './Button.svelte'
```
