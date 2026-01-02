import { create } from 'zustand';
const initialMenuBarData = {
    activeMenu: null, // 'File', 'Math', 'Help'
};

const initialCsvData = {
    isOpen: false,
};

export const useMenuBarStore = create((set) => ({
    menuBarData: initialMenuBarData,
    csvData: initialCsvData,
    setMenuBarData: (newData) => set({ menuBarData: newData }),
    setMenuAction: (action) => {
        // Allow components to subscribe to actions if needed, or just handle valid actions
        // treating this store mainly as state container for now
    },
    openCsvModal: () => set((state) => ({
        csvData: { ...state.csvData, isOpen: true }
    })),
    closeCsvModal: () => set((state) => ({
        csvData: { ...state.csvData, isOpen: false }
    }))
}));
