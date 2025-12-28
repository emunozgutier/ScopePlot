
import { useSignalStore } from '../../stores/useSignalStore';
import { useControlPanelStore } from '../../stores/useControlPanelStore';
import { generateBuffer } from './DisplaySignal';
import { getSampledData } from './submodule2/ControlPanelTimeSamples';
import { performAutoSet } from './AutoSet';

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
        { id: 3, shape: 'sine', freq: baseFreq * 1.0, amp: 5 } // Sawtooth manual or placeholder
    ];

    // Constructing updates
    const newChannels = [...controlPanelData.channels];

    configs.forEach(cfg => {
        const periods = 10;
        const samplesPerPeriod = 10;
        const duration = periods / cfg.freq;
        const sampleRate = samplesPerPeriod * cfg.freq;

        let buffer = [];
        if (cfg.id === 3) { // Sawtooth manual gen
            const count = Math.floor(duration * sampleRate);
            for (let i = 0; i < count; i++) {
                const t = i / sampleRate;
                // Sawtooth: 2 * (t * freq - floor(t * freq + 0.5))
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

    // Final Autoset
    // 1. Get latest signals from store (updated in loop)
    const updatedSignalData = useSignalStore.getState().displayData.signalData;
    // 2. Intermediate CP Data with new channels visibility
    const intermediateControlPanelData = { ...controlPanelData, channels: newChannels };
    // 3. Compute Autoset
    const autoSetData = performAutoSet(intermediateControlPanelData, updatedSignalData);
    // 4. Update Store
    updateControlPanelData(autoSetData);
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

    // Final Autoset
    const updatedSignalData = useSignalStore.getState().displayData.signalData;
    const intermediateControlPanelData = { ...controlPanelData, channels: newChannels };
    const autoSetData = performAutoSet(intermediateControlPanelData, updatedSignalData);
    updateControlPanelData(autoSetData);
};
