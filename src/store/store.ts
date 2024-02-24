import { create } from 'zustand'

export interface Store {
    'pdfUrl': Object[] | [];
    'setPdf': (url: any[]) => void;
    'chatId': string | null;
    'setChatId': (chatId: string) => void;
    'pdfKey' : string | null;
    'setPdfKey': (pdfKey: string) => void;
}

export const useAStore = create<Store>()(
    (set) => ({
        'pdfUrl': [],
        'setPdf': (url) => set(() => ({ pdfUrl: url })),
        'chatId': null,
        'setChatId': (chatId) => set(() => ({ chatId: chatId })),
        'pdfKey' : null,
        'setPdfKey' : (file_key) => set(() => ({pdfKey: file_key}))
    })
)