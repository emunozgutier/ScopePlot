import { create } from 'zustand';
import { computeFFT } from '../utils/fft';

import { initialControlPanelData } from './useControlPanelStore';
import { getSampledData } from '../module/submodule1/submodule2/ControlPanelTimeSamples';

// Helper to generate initial time data locally to avoid circular dependencies
const generateInitialTimeData = (timePerDiv, totalSamples) => {
    const points = [];
    const totalTime = timePerDiv * 10;
    if (totalSamples <= 0) return points;
    if (totalSamples === 1) return [[0, 0]];
    for (let i = 0; i < totalSamples; i++) {
        const t = (i / (totalSamples - 1)) * totalTime;
        points.push([t, 0]);
    }
    return points;
};

// Helper to create initial signal structure with data
const createInitialSignal = (id) => {
    const { timePerUnit, TotalSignalSamples } = initialControlPanelData;
    const initialTimeData = generateInitialTimeData(timePerUnit, TotalSignalSamples);
    const initialSample = getSampledData(initialTimeData, 'time', initialControlPanelData);

    return {
        id,
        defaultZeroData: true, // Flag to indicate initialization state (if needed by logic)
        timeData: initialTimeData,
        frequencyData: null,
        timeDataSample: initialSample,
        frequencyDataSample: []
    };
};

const initialSignalData = [
    createInitialSignal(0),
    createInitialSignal(1),
    createInitialSignal(2),
    createInitialSignal(3),
];

const signalSampler = (signalData, sampleCount) => {
    // Implement signal sampling logic here
    const sampledData = signalData.map((point, index) => {
        if (index % sampleCount === 0) {
            return point;
        }
        return null;
    }).filter(point => point !== null);
    return sampledData;
};

export const useSignalStore = create((set, get) => ({
    signalList: initialSignalData,

    /**
     * Updates only the time domain data for a specific signal.
     * @param {number} signalId 
     * @param {Array<Array<number>>} data - [[time, voltage], ...]
     */
    updateTimeData: (signalId, data) => set((state) => {
        const newSignals = state.signalList.map(sig => {
            if (sig.id === signalId) {
                return { ...sig, timeData: data, frequencyData: null };
            }
            return sig;
        });
        return { signalList: newSignals };
    }),

    /**
     * Updates only the frequency domain data for a specific signal.
     * @param {number} signalId 
     */
    calculateFrequencyData: (signalId) => set((state) => {
        const signal = state.signalList.find(sig => sig.id === signalId);

        if (!signal || !signal.timeData || signal.timeData.length < 2) {
            return state;
        }

        // Infer sample rate from time data (1 / delta_t)
        const dt = signal.timeData[1][0] - signal.timeData[0][0];
        const sampleRate = dt > 0 ? 1 / dt : 1000; // Default or fallback

        const fftData = computeFFT(signal.timeData, sampleRate);

        const newSignals = state.signalList.map(sig => {
            if (sig.id === signalId) {
                return { ...sig, frequencyData: fftData };
            }
            return sig;
        });
        return { signalList: newSignals };
    }),

    calculateDataSample: (signalId, sampleCount) => set((state) => {
        const signal = state.signalData.find(sig => sig.id === signalId);

        if (!signal || !signal.timeData || signal.timeData.length < 2) {
            return state;
        }

        const sampledTimeData = signalSampler(signal.timeData, sampleCount);

        // check if frequency data is not null and not empty
        if (signal.frequencyData && signal.frequencyData.length > 0) {
            const sampledFrequencyData = signalSampler(signal.frequencyData, sampleCount);
            const newSignals = state.signalList.map(sig => {
                if (sig.id === signalId) {
                    return { ...sig, timeDataSample: sampledTimeData, frequencyDataSample: sampledFrequencyData };
                }
                return sig;
            });
            return { signalList: newSignals };
        }
        else {
            const newSignals = state.signalList.map(sig => {
                if (sig.id === signalId) {
                    return { ...sig, timeDataSample: sampledTimeData };
                }
                return sig;
            });
            return { signalList: newSignals };
        }
    })
}));
