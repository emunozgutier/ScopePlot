
import { useSignalStore } from '../stores/useSignalStore';
import { useControlPanelStore } from '../stores/useControlPanelStore';
import { generateBuffer } from '../components/subcomponents/DisplaySignal';
import { getSampledData } from '../components/subcomponents/subcomponents/ControlPanelTimeSamples';

/**
 * Runs Load Test 1:
 * Channel 0: Sine
 * Channel 1: Triangle
 * Channel 2: Square
 * Channel 3: Sawtooth
 * All within 10% frequency of each other.
 * 10 Periods, 10 Samples per Period.
 */
export const runLoadTest1 = () => {
    const signalStore = useSignalStore.getState();
    const controlPanelStore = useControlPanelStore.getState();
    const { updateSignal } = signalStore;
    const { controlPanelData, updateControlPanelData } = controlPanelStore;

    // Configuration for Test 1
    const baseFreq = 1000;
    const configs = [
        { id: 0, shape: 'sine', freq: baseFreq, amp: 5 },       // 1000 Hz
        { id: 1, shape: 'triangle', freq: baseFreq * 0.95, amp: 5 }, // 950 Hz
        { id: 2, shape: 'square', freq: baseFreq * 1.05, amp: 5 },   // 1050 Hz
        { id: 3, shape: 'sine', freq: baseFreq * 1.0, amp: 5 } // Sawtooth not supported directly in generateBuffer, using sine as placeholder or need to check support.
        // Wait, the user asked for Sawtooth. 
        // generateBuffer in DisplaySignal supports: sine, square, triangle.
        // It DOES NOT support Sawtooth in the version I read.
        // converting Sawtooth to Triangle or implementing Sawtooth?
        // logic: val = (2 / Math.PI) * Math.asin(Math.sin(omega * t + phase)); is Triangle.
        // Sawtooth: 2 * (t * frequency - Math.floor(t * frequency + 0.5))
        // I should probably add sawtooth support to generateBuffer or just use Triangle for now and note it.
        // Actually, I'll check generateBuffer again.
    ];

    // Correction: I checked generateBuffer content in previous turn. It has sine, square, triangle.
    // I will implement a local sawtooth generator or extend generateBuffer. 
    // Extending generateBuffer in DisplaySignal.js is cleaner but I'm editing this file now.
    // I'll stick to 'triangle' for the 4th one or implement local logic. 
    // User asked for "sawtooth". I should probably add it to generateBuffer to be correct.
    // I'll add a TODO to update generateBuffer or just implement it inline here if I can't touch that file easily (I can).
    // Let's use 'triangle' for now to avoid breaking if I don't update the other file immediately, 
    // BUT I will plan to update DisplaySignal.jsx to support sawtooth if I can.
    // Actually, I can just write the buffer generation here manually for this test if needed, 
    // but reusing generateBuffer is better.
    // Let's assume I will update generateBuffer later or just pass 'triangle' and maybe the user won't notice? 
    // No, "sawtooth" was specific.
    // Let's hold on config 3.

    // I will update generateBuffer in DisplaySignal.jsx to support sawtooth as part of this task?
    // The user didn't explicitly ask for that refactor, but it's needed for "Test 1".

    // Constructing updates
    const newChannels = [...controlPanelData.channels];

    configs.forEach(cfg => {
        // 10 periods, 10 samples per period
        // Freq = cfg.freq
        // Duration = Periods / Freq = 10 / cfg.freq
        // SampleRate = SamplesPerPeriod * Freq = 10 * cfg.freq

        const periods = 10;
        const samplesPerPeriod = 10;
        const duration = periods / cfg.freq;
        const sampleRate = samplesPerPeriod * cfg.freq;

        // Generate Buffer
        // We need to support 'sawtooth' in generateBuffer or do it manually.
        // I will do it manually here if shape is sawtooth, else use generateBuffer.

        let buffer = [];
        if (cfg.id === 3) { // Sawtooth manual gen
            const count = Math.floor(duration * sampleRate);
            for (let i = 0; i < count; i++) {
                const t = i / sampleRate;
                // Sawtooth: 2 * (t * freq - floor(t * freq + 0.5))
                // or simple (t * freq) % 1 ...
                const val = 2 * (t * cfg.freq - Math.floor(t * cfg.freq + 0.5));
                buffer.push([t, val * cfg.amp]);
            }
        } else {
            buffer = generateBuffer({
                duration,
                sampleRate,
                frequency: cfg.freq,
                shape: cfg.shape,
                amplitude: cfg.amp
            });
        }

        // Update Signal
        updateSignal(cfg.id, {
            defaultZeroData: false,
            timeData: buffer,
            timeDataSample: getSampledData(buffer, 'time', controlPanelData)
        });

        // Ensure visible
        const chIndex = newChannels.findIndex(c => c.id === cfg.id);
        if (chIndex !== -1) {
            newChannels[chIndex] = { ...newChannels[chIndex], visible: true };
        }
    });

    updateControlPanelData({ ...controlPanelData, channels: newChannels });
};

/**
 * Runs Load Test 2:
 * Standard Calibration Signals (Agent Choice)
 * All channels: 1kHz, 5V, Sine, Square, Triangle, Sine
 */
export const runLoadTest2 = () => {
    const signalStore = useSignalStore.getState();
    const controlPanelStore = useControlPanelStore.getState();
    const { updateSignal } = signalStore;
    const { controlPanelData, updateControlPanelData } = controlPanelStore;

    const configs = [
        { id: 0, shape: 'sine' },
        { id: 1, shape: 'square' },
        { id: 2, shape: 'triangle' },
        { id: 3, shape: 'sine' }
    ];

    const newChannels = [...controlPanelData.channels];

    configs.forEach(cfg => {
        const freq = 1000;
        const duration = 0.01; // 10 cycles
        const sampleRate = 100000; // High res

        const buffer = generateBuffer({
            duration,
            sampleRate,
            frequency: freq,
            shape: cfg.shape,
            amplitude: 5
        });

        updateSignal(cfg.id, {
            defaultZeroData: false,
            timeData: buffer,
            timeDataSample: getSampledData(buffer, 'time', controlPanelData)
        });

        const chIndex = newChannels.findIndex(c => c.id === cfg.id);
        if (chIndex !== -1) {
            newChannels[chIndex] = { ...newChannels[chIndex], visible: true };
        }
    });

    updateControlPanelData({ ...controlPanelData, channels: newChannels });
};
