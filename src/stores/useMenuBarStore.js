import { create } from 'zustand';
import { initialMenuBarData } from '../components/MenuBarData';

export const useMenuBarStore = create((set) => ({
    menuBarData: initialMenuBarData,
    setMenuBarData: (newData) => set({ menuBarData: newData }),
    setMenuAction: (action) => {
        // Allow components to subscribe to actions if needed, or just handle valid actions
        // treating this store mainly as state container for now
    }
}));
