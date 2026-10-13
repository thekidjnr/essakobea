import type { Viewport } from "next";

// iPhone Safari zooms the page in when an input under 16px is tapped. The
// admin uses smaller form text, so stop that auto-zoom here (pinch zoom still
// works on iOS). The public site keeps the default viewport.
export const viewport: Viewport = {
  viewportFit: "cover",
  maximumScale: 1,
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // .admin-ui opts out of the site-wide 16px input text in globals.css
  return <div className="admin-ui contents">{children}</div>;
}
