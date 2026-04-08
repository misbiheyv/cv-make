interface GtagEventParams {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: string | number | undefined;
}

declare function gtag(command: "js", date: Date): void;
declare function gtag(command: "config", targetId: string, config?: Record<string, unknown>): void;
declare function gtag(command: "event", eventName: string, eventParams?: GtagEventParams): void;

interface Window {
    dataLayer: Array<unknown>;
}
