/**
 * A stylesheet imported from a module is bundled by esbuild, not read as a
 * value. This tells the type checker the same thing.
 */
declare module '*.css';
