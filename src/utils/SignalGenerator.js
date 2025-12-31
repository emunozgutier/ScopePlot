import { useSignalStore } from '../stores/useSignalStore';
import { useControlPanelStore } from '../stores/useControlPanelStore';
import { getSampledData } from '../module/submodule1/submodule2/ControlPanelTimeSamples';

/**
 * Generates signal data based on configuration.
 * Encapsulates standard shapes and custom logic.
 * @param {Object} config - { duration, sampleRate, freq, shape, amp, id }
 * @returns {Array<Array<number>>} Array of [time, voltage] points
 */
export const generateSignal = (config) => {
    // Determine frequency and amplitude from config, supporting both 'freq' and 'frequency' keys if needed.
    const frequency = config.freq || config.frequency;
    const amplitude = config.amp || config.amplitude;
    const { duration, sampleRate, shape, id } = config;

    const count = Math.floor(duration * sampleRate);
    const buffer = [];
    const omega = 2 * Math.PI * frequency;
    const phase = 0; // Standard phase for now

    for (let i = 0; i < count; i++) {
        const t = i / sampleRate;
        let val = 0;

        if (id === 3 || shape === 'sawtooth') {
            // Sawtooth: 2 * (t * freq - floor(t * freq + 0.5))
            val = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
        } else if (shape === 'sine') {
            val = Math.sin(omega * t + phase);
        } else if (shape === 'square') {
            val = Math.sin(omega * t + phase) > 0 ? 1 : -1;
        } else if (shape === 'triangle') {
            val = (2 / Math.PI) * Math.asin(Math.sin(omega * t + phase));
        }

        buffer.push([t, val * amplitude]);
    }

    return buffer;
};

/**
 * Generates and stores signal data for a specific channel.
 * @param {number} channel - The channel ID (0-3).
 * @param {Object} config - Signal configuration.
 */
export const generateSignalAndStore = (channel, config) => {
    const data = generateSignal(config);
    useSignalStore.getState().updateTimeData(channel, data);
};

/**
 * Samples the signal for a specific channel and stores it.
 * @param {number} channel - The channel ID (0-3).
 */
export const SampleSignal = (channel) => {
    const signalStore = useSignalStore.getState();
    const controlPanelStore = useControlPanelStore.getState();

    // Find the signal for the given channel
    const signal = signalStore.signalList.find(s => s.id === channel);

    if (signal && signal.timeData) {
        const sampledData = getSampledData(
            signal.timeData,
            'time',
            controlPanelStore.controlPanelData
        );

        // Manual update as updateSignal/calculateDataSample are limited/buggy
        const newSignals = signalStore.signalList.map(sig => {
            if (sig.id === channel) {
                return { ...sig, timeDataSample: sampledData };
            }
            return sig;
        });
        useSignalStore.setState({ signalList: newSignals });
    }
};

/**
 * Generates a default zero-voltage signal.
 * @param {number} timePerDiv - Time per division in seconds.
 * @param {number} totalSamples - Total number of samples.
 * @returns {Array<Array<number>>} Array of [time, voltage] points.
 */
export const defaultSignal = (timePerDiv, totalSamples) => {
    const points = [];
    const totalTime = timePerDiv * 10;

    if (totalSamples <= 0) return points;

    if (totalSamples === 1) {
        return [[0, 0]];
    }

    for (let i = 0; i < totalSamples; i++) {
        const t = (i / (totalSamples - 1)) * totalTime;
        const v = 0;
        points.push([t, v]);
    }
    return points;
};
