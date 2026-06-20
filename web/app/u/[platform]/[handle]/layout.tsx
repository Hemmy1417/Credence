// Server layout for a Credence profile route. The page itself is a client
// component, so metadata lives here. The sibling opengraph-image.tsx supplies the
// actual share image; this sets the title/description and the large Twitter card.
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ platform: string; handle: string }>;
}): Promise<Metadata> {
  const { platform, handle } = await params;
  const p = decodeURIComponent(platform).toLowerCase();
  const h = decodeURIComponent(handle).toLowerCase().replace(/^@/, "");
  const title = `${h} · ${p} — verified on Credence`;
  const description = `${p}/${h}'s on-chain Credence identity: verification status, Credence Score and a shareable proof, sealed on GenLayer.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
