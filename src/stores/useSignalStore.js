import { create } from 'zustand';
import { initialDisplayData } from '../components/DisplayData';

export const useSignalStore = create((set, get) => ({
    displayData: initialDisplayData,

    // Replace entire displayData
    setDisplayData: (newData) => set({ displayData: newData }),

    // Replace signalData array
    setSignalData: (newSignals) => set((state) => ({
        displayData: { ...state.displayData, signalData: newSignals }
    })),

    // Update a single signal
    updateSignal: (signalId, newData) => set((state) => {
        const newSignals = state.displayData.signalData.map(sig => {
            if (sig.id === signalId) {
                return { ...sig, ...newData };
            }
            return sig;
        });
        return { displayData: { ...state.displayData, signalData: newSignals } };
    })
}));
