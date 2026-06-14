import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { findProseLinks, type LinkOptions } from "../lib/proseLinker";

/**
 * Renders a prose string with the FIRST mention of each known site/niche
 * auto-linked to its /reviews/{slug} or /niche/{slug} page. Plain text
 * otherwise. Newlines are preserved by the caller's `whitespace-pre-line`.
 *
 * Pass a shared `linked` Set across multiple <LinkedProse> instances on the
 * same page so each site/niche links only once for the whole article.
 */
interface LinkedProseProps {
  text: string;
  /** Shared dedup Set across the article (mutated as links are emitted). */
  linked: Set<string>;
  options?: LinkOptions;
}

const LinkedProse = ({ text, linked, options }: LinkedProseProps) => {
  const matches = findProseLinks(text, linked, options);
  if (matches.length === 0) return <>{text}</>;

  const nodes: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.index > cursor) nodes.push(<Fragment key={`t${i}`}>{text.slice(cursor, m.index)}</Fragment>);
    const anchor = text.slice(m.index, m.index + m.length);
    nodes.push(
      <Link key={`l${i}`} to={m.href} className="text-secondary hover:underline underline-offset-2">
        {anchor}
      </Link>,
    );
    cursor = m.index + m.length;
  });
  if (cursor < text.length) nodes.push(<Fragment key="tail">{text.slice(cursor)}</Fragment>);

  return <>{nodes}</>;
};

export default LinkedProse;
