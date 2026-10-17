import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SoloType — Minimalist Spaced Repetition Typing",
    short_name: "SoloType",
    description:
      "A minimalist touch typing web app featuring Spaced Repetition error optimization, Single Letter reflex drills, and Flash & Type visual memory training.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#10b981",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
