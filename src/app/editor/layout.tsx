import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Resume Editor",
    description: "Edit your resume with real-time preview and export to PDF",
    robots: {
        index: true,
        follow: true,
    },
};

export default function EditorLayout({children}: {children: React.ReactNode}) {
    return children;
}
