import { create } from 'zustand';
import { computeFFT } from '../utils/fft';
import { initialControlPanelData } from './useControlPanelStore';

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

    return {
        id,
        defaultZeroData: true, // Flag to indicate initialization state (if needed by logic)
        timeData: initialTimeData,
        frequencyData: null,
        timeDataSample: null,
        frequencyDataSample: null
    };
};

const initialSignalData = [
    createInitialSignal(0),
    createInitialSignal(1),
    createInitialSignal(2),
    createInitialSignal(3),
];

const signalSampler = (signalData, sampleCount) => {
    if (signalData.length <= sampleCount) {
        return signalData;
    }

    const step = signalData.length / sampleCount;
    const sampledData = [];

    for (let i = 0; i < sampleCount; i++) {
        const index = Math.floor(i * step);
        if (index < signalData.length) {
            sampledData.push(signalData[index]);
        }
    }
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
        const signal = state.signalList.find(sig => sig.id === signalId);

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
    }),

    // Cursor State
    cursor: {
        active: false,
        channelId: 0,
        index: 0
    },

    setCursorActive: (active) => set((state) => ({
        cursor: { ...state.cursor, active }
    })),

    setCursorChannel: (channelId) => set((state) => ({
        cursor: { ...state.cursor, channelId, index: 0 }
    })),

    setCursorIndex: (index) => set((state) => {
        const currentChannel = state.signalList.find(s => s.id === state.cursor.channelId);
        let maxIndex = 100;
        if (currentChannel && currentChannel.timeData) {
            maxIndex = currentChannel.timeData.length - 1;
        }

        const newIndex = Math.max(0, Math.min(index, maxIndex));
        return {
            cursor: { ...state.cursor, index: newIndex }
        };
    }),

    moveCursor: (direction) => set((state) => {
        const currentChannel = state.signalList.find(s => s.id === state.cursor.channelId);
        if (!currentChannel || !currentChannel.timeData) return state;

        const maxIndex = currentChannel.timeData.length - 1;
        const newIndex = Math.max(0, Math.min(state.cursor.index + direction, maxIndex));

        return {
            cursor: { ...state.cursor, index: newIndex }
        };
    })
}));
