import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { AppShellWithProviders } from "./App";

interface HelmetData {
  title?: { toString(): string };
  meta?: { toString(): string };
  link?: { toString(): string };
  script?: { toString(): string };
  htmlAttributes?: { toString(): string };
  bodyAttributes?: { toString(): string };
}

interface RenderResult {
  html: string;
  helmet: HelmetData | null;
}

/**
 * Server-side render entry. Called by scripts/prerender-app.ts at build
 * time for every route. Returns the rendered HTML body and the helmet
 * context for splicing into the index.html template.
 */
export function render(url: string): RenderResult {
  const helmetContext: { helmet?: HelmetData } = {};

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <AppShellWithProviders />
      </StaticRouter>
    </HelmetProvider>
  );

  return { html, helmet: helmetContext.helmet ?? null };
}
