import type {MetadataRoute} from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: "https://cv-make.com",
            priority: 1.0,
        },
        {
            url: "https://cv-make.com/editor",
            priority: 0.8,
        },
    ];
}
