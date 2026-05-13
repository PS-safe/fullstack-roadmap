// Fallback module declaration so the project type-checks before `npm install`.
// After install, mermaid ships its own richer types and this declaration is
// shadowed by the real ones. Safe to keep.
declare module 'mermaid' {
  type RenderResult = { svg: string; bindFunctions?: (el: Element) => void };
  type MermaidConfig = Record<string, unknown>;
  const mermaid: {
    initialize(config: MermaidConfig): void;
    render(id: string, chart: string): Promise<RenderResult>;
  };
  export default mermaid;
}
