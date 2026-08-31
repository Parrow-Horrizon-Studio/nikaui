import { PreviewWithSwitchers } from "./preview-switchers";
import { SourceView } from "./source-view";

/**
 * One tag for what every component page needs: a running component, a way to
 * feel its motion, and the file the reader will own.
 *
 * Composed here rather than in each page so the three cannot get out of step
 * across 28 pages — the same reason the component index is derived rather
 * than hand-listed.
 */
export function ComponentDemo({
  name,
  source = true,
}: {
  name: string;
  /** Set false on a page that shows the source in its own section instead. */
  source?: boolean;
}) {
  return (
    <>
      <PreviewWithSwitchers name={name} />
      {source ? <SourceView name={name} /> : null}
    </>
  );
}
