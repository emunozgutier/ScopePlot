import { useSignalStore } from '../../stores/useSignalStore';
import { useControlPanelStore } from '../../stores/useControlPanelStore';
import { generateSignalAndStore, SampleSignal } from './SignalGenerator';
import { performAutoSet } from './AutoSet';

/**
 * Runs Load Test 1:
 * Channel 0: Sine
 * Channel 1: Triangle
 * Channel 2: Square
 * Channel 3: Sawtooth (Manual Gen in SignalGenerator)
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
        { id: 3, shape: 'sawtooth', freq: baseFreq * 1.0, amp: 5 } // Explicitly set sawtooth
    ];

    // Constructing updates
    const newChannels = [...controlPanelData.channels];

    configs.forEach(cfg => {
        const periods = 100;
        const samplesPerPeriod = 10;
        const duration = periods / cfg.freq;
        const sampleRate = samplesPerPeriod * cfg.freq;

        // Use new SignalGenerator functions
        generateSignalAndStore(cfg.id, {
            ...cfg,
            duration,
            sampleRate
        });

        SampleSignal(cfg.id);

        // Update Signal metadata
        updateSignal(cfg.id, {
            defaultZeroData: false
        });

        // Ensure visible
        const chIndex = newChannels.findIndex(c => c.id === cfg.id);
        if (chIndex !== -1) {
            newChannels[chIndex] = { ...newChannels[chIndex], visible: true };
        }
    });

    // Update channels visibility
    updateControlPanelData({ ...controlPanelData, channels: newChannels });

    // AutoSet with delay
    setTimeout(() => {
        const updatedSignalData = useSignalStore.getState().displayData.signalData;
        const currentControlPanelData = useControlPanelStore.getState().controlPanelData;
        const autoSetData = performAutoSet(currentControlPanelData, updatedSignalData);
        updateControlPanelData(autoSetData);
    }, 100);
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
        const amp = 5;

        // Use new SignalGenerator functions
        generateSignalAndStore(cfg.id, {
            id: cfg.id,
            shape: cfg.shape,
            freq,
            amp,
            duration,
            sampleRate
        });

        SampleSignal(cfg.id);

        updateSignal(cfg.id, {
            defaultZeroData: false
        });

        const chIndex = newChannels.findIndex(c => c.id === cfg.id);
        if (chIndex !== -1) {
            newChannels[chIndex] = { ...newChannels[chIndex], visible: true };
        }
    });

    // Update channels visibility
    updateControlPanelData({ ...controlPanelData, channels: newChannels });

    // AutoSet with delay
    setTimeout(() => {
        const updatedSignalData = useSignalStore.getState().displayData.signalData;
        const currentControlPanelData = useControlPanelStore.getState().controlPanelData;
        const autoSetData = performAutoSet(currentControlPanelData, updatedSignalData);
        updateControlPanelData(autoSetData);
    }, 100);
};
