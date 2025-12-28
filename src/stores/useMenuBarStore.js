import { create } from 'zustand';
const initialMenuBarData = {
    activeMenu: null // 'File', 'Math', 'Help'
};

export const useMenuBarStore = create((set) => ({
    menuBarData: initialMenuBarData,
    setMenuBarData: (newData) => set({ menuBarData: newData }),
    setMenuAction: (action) => {
        // Allow components to subscribe to actions if needed, or just handle valid actions
        // treating this store mainly as state container for now
    }
}));
