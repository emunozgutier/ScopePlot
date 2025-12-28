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
