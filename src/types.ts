export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    created: number;
    lastReviewed: number | null;
    interval: number; // minutes (if demo) or days
    ease: number; // ease factor
    lapses: number;
    nextReview?: number;
}