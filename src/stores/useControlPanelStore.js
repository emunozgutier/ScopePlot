import { create } from 'zustand';
export const initialControlPanelData = {
    timePerUnit: 1, // sec/div
    freqPerUnit: 50, // Hz/div
    timeOffset: 0, // seconds
    freqOffset: 0, // Hz
    TotalSignalSamples: 1024,
    timeDomain: true,
    channels: [
        { id: 0, visible: true, voltsPerUnitTimeDomain: 1, offsetTimeDomain: 0, voltsPerUnitFreqDomain: 1, offsetFreqDomain: 0, acMode: true, noiseFilter: false, color: '#ffff00' },
        { id: 1, visible: false, voltsPerUnitTimeDomain: 1, offsetTimeDomain: 0, voltsPerUnitFreqDomain: 1, offsetFreqDomain: 0, acMode: true, noiseFilter: false, color: '#00ff00' },
        { id: 2, visible: false, voltsPerUnitTimeDomain: 1, offsetTimeDomain: 0, voltsPerUnitFreqDomain: 1, offsetFreqDomain: 0, acMode: true, noiseFilter: false, color: '#00ffff' },
        { id: 3, visible: false, voltsPerUnitTimeDomain: 1, offsetTimeDomain: 0, voltsPerUnitFreqDomain: 1, offsetFreqDomain: 0, acMode: true, noiseFilter: false, color: '#ff00ff' },
    ]
};

export const useControlPanelStore = create((set) => ({
    controlPanelData: initialControlPanelData,
    updateControlPanelData: (newData) => set({ controlPanelData: newData }),
    // Specific setters can be added here for finer granularity
    setTimeDomain: (timeDomain) => set((state) => ({
        controlPanelData: { ...state.controlPanelData, timeDomain }
    }))
}));
