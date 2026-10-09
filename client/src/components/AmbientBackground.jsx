/**
 * Static decorative background: three soft, blurred colour glows. No shapes, no animation.
 * variant="rich" for the Talk page, "subtle" for the dashboard.
 */
export default function AmbientBackground({ variant = 'rich' }) {
  return (
    <div className={`ambient ambient-${variant}`} aria-hidden="true">
      <span className="blob blob-1" />
      <span className="blob blob-2" />
      <span className="blob blob-3" />
    </div>
  );
}