import { create } from 'zustand';
import { initialControlPanelData } from '../components/ControlPanelData';

export const useControlPanelStore = create((set) => ({
    controlPanelData: initialControlPanelData,
    updateControlPanelData: (newData) => set({ controlPanelData: newData }),
    // Specific setters can be added here for finer granularity
    setTimeDomain: (timeDomain) => set((state) => ({
        controlPanelData: { ...state.controlPanelData, timeDomain }
    }))
}));
