import { create } from 'zustand';
import { computeFFT } from '../utils/fft';

// Helper to create initial signal structure
const createInitialSignal = (id) => ({
    id,
    timeData: [], // Array of [time, voltage]
    frequencyData: null,
    timeDataSample: [],
    frequencyDataSample: []
});

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

        ///////////////////////////////////////////////////
        // Time data first
        ///////////////////////////////////////////////////
        if (!signal || !signal.timeData || signal.timeData.length < 2) {
            return state;
        }

        const sampledTimeData = signalSampler(signal.timeData, sampleCount);

        if (signal.frequencyData) {
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
