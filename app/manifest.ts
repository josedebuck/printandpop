import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "print&pop · gestión",
    short_name: "print&pop",
    description: "Costos, stock y ventas del emprendimiento",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf9f3",
    theme_color: "#3562a8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
