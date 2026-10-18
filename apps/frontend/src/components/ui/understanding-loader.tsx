import { createPortal } from "react-dom";

export function UnderstandingLoader({
  label = "Connecting the dots…",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div role="status" aria-live="polite" className="understanding-compact">
        <span aria-hidden="true" className="understanding-compact-dot" />
        <span>{label}</span>
      </div>
    );
  }

  return createPortal(
    <div role="status" aria-live="polite" className="understanding-screen">
      <div aria-hidden="true" className="understanding-atmosphere">
        <span className="understanding-cloud understanding-cloud-a" />
        <span className="understanding-cloud understanding-cloud-b" />
        <span className="understanding-cloud understanding-cloud-c" />
        <svg className="understanding-lines" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <path d="M-180 300 C 130 90, 330 510, 650 250 S 1120 110, 1630 360" />
          <path d="M-200 610 C 150 360, 430 850, 760 540 S 1210 400, 1650 700" />
          <path d="M-100 800 C 250 680, 350 260, 720 410 S 1170 930, 1570 690" />
        </svg>
      </div>
      <p className="understanding-label">{label}</p>
    </div>,
    document.body,
  );
}
