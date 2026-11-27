import { create } from 'zustand'

export interface Store {
    'pdfKey': string | null;
    'setPdfKey': (pdfKey: string) => void;
    // page the PDF viewer should show; `nonce` changes on every jump so
    // jumping to the same page twice still scrolls back to it
    'pdfPage': { page: number; nonce: number } | null;
    'goToPage': (page: number) => void;
}

export const useAStore = create<Store>()(
    (set) => ({
        'pdfKey': null,
        'setPdfKey': (file_key) => set(() => ({ pdfKey: file_key, pdfPage: null })),
        'pdfPage': null,
        'goToPage': (page) => set(() => ({ pdfPage: { page, nonce: Date.now() } })),
    })
)
