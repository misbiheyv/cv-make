import {Eye, FileDown, Sparkles, UserRoundX} from "lucide-react";
import type {Metadata} from "next";
import Link from "next/link";

export const metadata: Metadata = {
    alternates: {
        canonical: "https://cv-make.com",
    },
};

const features = [
    {
        icon: Eye,
        title: "Live Preview",
        description: "See changes instantly as you type — no refresh needed",
    },
    {
        icon: FileDown,
        title: "PDF Export",
        description: "Download your resume as a professionally formatted PDF",
    },
    {
        icon: UserRoundX,
        title: "No Account Needed",
        description: "Start building immediately — no registration or email required",
    },
    {
        icon: Sparkles,
        title: "Completely Free",
        description: "All features available at no cost, no hidden fees",
    },
];

const steps = [
    {
        number: 1,
        title: "Fill in Your Details",
        description: "Enter your experience, education, and skills",
    },
    {
        number: 2,
        title: "Preview in Real Time",
        description: "See your resume take shape as you type",
    },
    {
        number: 3,
        title: "Download as PDF",
        description: "Export a professionally formatted PDF ready to send",
    },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero */}
            <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
                <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-tight max-w-2xl">
                    Create Your Professional Resume in Minutes
                </h1>
                <p className="mt-4 text-lg text-text-secondary max-w-xl">
                    Free online resume builder with real-time preview and PDF export. No sign-up
                    required.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center">
                    <Link href="/editor" className="btn-primary text-base px-8 py-3 inline-block">
                        Start Building
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section className="px-6 py-16 bg-white">
                <h2 className="text-2xl font-bold text-primary text-center mb-10">
                    Everything You Need
                </h2>
                <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="bg-surface rounded-[10px] border border-border p-5"
                        >
                            <feature.icon className="w-6 h-6 text-primary mb-3" />
                            <h3 className="font-semibold text-primary mb-1">{feature.title}</h3>
                            <p className="text-sm text-text-secondary">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="px-6 py-16">
                <h2 className="text-2xl font-bold text-primary text-center mb-10">How It Works</h2>
                <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                    {steps.map((step) => (
                        <div key={step.number}>
                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
                                {step.number}
                            </div>
                            <h3 className="font-semibold text-primary mb-1">{step.title}</h3>
                            <p className="text-sm text-text-secondary">{step.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* For Developers */}
            <section className="px-6 py-16 bg-white">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-primary mb-4">Built for Developers</h2>
                    <p className="text-text-secondary">
                        Clean formatting and ATS-friendly output designed for tech professionals.
                        Highlight your skills, projects, and experience with a resume that gets past
                        automated screening systems. Open source on{" "}
                        <a
                            href="https://github.com/misbiheyv/cv-make"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline hover:text-primary-hover"
                        >
                            GitHub
                        </a>
                        .
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-8 border-t border-border text-center text-sm text-text-tertiary">
                <p>
                    &copy; {new Date().getFullYear()} CV Make &middot;{" "}
                    <a
                        href="https://github.com/misbiheyv/cv-make"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-text-secondary transition-colors"
                    >
                        GitHub
                    </a>
                </p>
            </footer>
        </div>
    );
}
