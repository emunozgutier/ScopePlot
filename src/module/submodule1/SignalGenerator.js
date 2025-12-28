import { generateBuffer } from './DisplaySignal';

/**
 * Generates signal data based on configuration.
 * Encapsulates standard shapes (via generateBuffer) and custom logic (like Sawtooth).
 * @param {Object} config - { duration, sampleRate, freq, shape, amp, id }
 * @returns {Array<Array<number>>} Array of [time, voltage] points
 */
export const generateSignal = (config) => {
    // Determine frequency and amplitude from config, supporting both 'freq' and 'frequency' keys if needed,
    // though loadTestHelpers used 'freq'. generateBuffer uses 'frequency'.
    // Let's standardize on properties available in config.
    // loadTestHelpers config: { id, shape, freq, amp }
    const frequency = config.freq || config.frequency;
    const amplitude = config.amp || config.amplitude;
    const { duration, sampleRate, shape, id } = config;

    // Custom Sawtooth Logic (from original loadTestHelpers id=3)
    // Or if shape is explicitly set to 'sawtooth'
    if (id === 3 || shape === 'sawtooth') {
        const count = Math.floor(duration * sampleRate);
        const buffer = [];
        for (let i = 0; i < count; i++) {
            const t = i / sampleRate;
            // Sawtooth: 2 * (t * freq - floor(t * freq + 0.5))
            const val = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
            buffer.push([t, val * amplitude]);
        }
        return buffer;
    }

    // Standard Shapes
    return generateBuffer({
        duration,
        sampleRate,
        frequency, // generateBuffer expects 'frequency'
        shape,
        amplitude // generateBuffer expects 'amplitude'
    });
};
