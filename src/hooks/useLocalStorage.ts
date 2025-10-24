import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T | (() => T)) {
    const [state, setState] = useState<T>(() => {
        try {
            const raw = localStorage.getItem(key);
            if (raw) return JSON.parse(raw) as T;
            return typeof initial === "function" ? (initial as () => T)() : initial;
        } catch (e) {
            console.error("reading localStorage failed", e);
            return typeof initial === "function" ? (initial as () => T)() : initial;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (e) {
            console.error("writing localStorage failed", e);
        }
    }, [key, state]);

    return [state, setState] as const;
}