/**
 * Generates a signal buffer based on configuration.
 * Local helper for standard shapes.
 */
const generateBuffer = (config) => {
    const { duration, sampleRate, frequency, shape, amplitude } = config;
    const count = Math.floor(duration * sampleRate);
    const points = [];

    for (let i = 0; i < count; i++) {
        const t = i / sampleRate;
        const phase = 0;
        const omega = 2 * Math.PI * frequency;
        let val = 0;

        if (shape === 'sine') {
            val = Math.sin(omega * t + phase);
        } else if (shape === 'square') {
            val = Math.sin(omega * t + phase) > 0 ? 1 : -1;
        } else if (shape === 'triangle') {
            val = (2 / Math.PI) * Math.asin(Math.sin(omega * t + phase));
        }

        points.push([t, val * amplitude]);
    }
    return points;
};

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
