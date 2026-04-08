import type {MetadataRoute} from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "CV Make",
        short_name: "CV Make",
        description: "Free online resume builder with real-time preview and PDF export",
        start_url: "/",
        display: "standalone",
        background_color: "#f9fafb",
        theme_color: "#111111",
    };
}
