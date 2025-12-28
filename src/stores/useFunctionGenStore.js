import { create } from 'zustand';
import { initialFunctionGenSignalData } from '../components/FunctionGenSignalData';

export const useFunctionGenStore = create((set) => ({
    functionGenSignalData: initialFunctionGenSignalData,
    setFunctionGenSignalData: (newData) => set({ functionGenSignalData: newData }),
    openModal: () => set((state) => ({
        functionGenSignalData: { ...state.functionGenSignalData, isOpen: true }
    })),
    closeModal: () => set((state) => ({
        functionGenSignalData: { ...state.functionGenSignalData, isOpen: false }
    }))
}));
