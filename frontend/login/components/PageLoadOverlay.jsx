"use client";

import { useEffect, useState } from "react";

// overlay breve al cargar /login (misma lógica que Login_Next)
export default function PageLoadOverlay() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const start = Date.now();
        const minMs = 380;
        let hideTimeoutId;

        const scheduleHide = () => {
            const elapsed = Date.now() - start;
            const wait = Math.max(0, minMs - elapsed);
            hideTimeoutId = window.setTimeout(() => setVisible(false), wait);
        };

        if (document.readyState === "complete") {
            scheduleHide();
        } else {
            window.addEventListener("load", scheduleHide);
        }

        const fallbackId = window.setTimeout(() => setVisible(false), 2500);

        return () => {
            window.removeEventListener("load", scheduleHide);
            window.clearTimeout(fallbackId);
            window.clearTimeout(hideTimeoutId);
        };
    }, []);

    if (!visible) return null;

    return (
        <div className="page-loader-overlay" aria-hidden="true">
            <div className="page-loader-spinner" />
        </div>
    );
}
