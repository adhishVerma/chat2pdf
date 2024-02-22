import { create } from 'zustand'

export interface Store {
    'pdfUrl': Object[] | [];
    'setPdf': (url: any[]) => void;
    'chatID': string | null;
    'setChatID': (chatId: string) => void;
    'pdfKey' : string | null;
    'setPdfKey': (pdfKey: string) => void;
}

export const useAStore = create<Store>()(
    (set) => ({
        'pdfUrl': [],
        'setPdf': (url) => set(() => ({ pdfUrl: url })),
        'chatID': null,
        'setChatID': (chatId) => set(() => ({ chatID: chatId })),
        'pdfKey' : null,
        'setPdfKey' : (file_key) => set(() => ({pdfKey: file_key})),
    })
)