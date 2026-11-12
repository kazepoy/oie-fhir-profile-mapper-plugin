// SPDX-License-Identifier: MPL-2.0
// Declarations for the type check (npm run check); not part of the bundle.

/** JSX factory and fragment, injected by esbuild from src/host/jsx-runtime.js. */
declare const h: (type: any, props: any, ...children: any[]) => any;
declare const Fragment: (props: { children?: any }) => any;
/** The plugin version, set by build.mjs. */
declare const __MAPPER_VERSION__: string;

/** Style sheets are bundled as text. */
declare module "*.css" {
  const text: string;
  export default text;
}

declare namespace JSX {
  type Element = any;
  interface IntrinsicElements { [name: string]: any }
  interface IntrinsicAttributes { key?: any }
  interface ElementChildrenAttribute { children: {} }
  type LibraryManagedAttributes<Component, Props> = Partial<Props> & { key?: any };
}
