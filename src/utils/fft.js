import FFT from 'fft.js';

export function computeFFT(voltageTimeData, sampleRateProvided = null) {
    if (!voltageTimeData || voltageTimeData.length < 2) return [];

    // 1. Extract Voltage Data
    const data = voltageTimeData.map(v => v[1]);
    const n = data.length;

    // 2. Determine Sample Rate (Fs)
    let Fs = sampleRateProvided;
    if (!Fs) {
        const t0 = voltageTimeData[0][0];
        const t1 = voltageTimeData[1][0];
        const dt = t1 - t0;
        Fs = dt > 0 ? 1 / dt : 1000;
    }

    // 3. Power of 2 for FFT
    // Find next power of 2
    const p = Math.ceil(Math.log2(n));
    const size = Math.pow(2, p);

    // 4. Prepare Complex Input
    const fft = new FFT(size);
    const input = fft.createComplexArray();

    // Fill with data and zero-pad
    for (let i = 0; i < n; i++) {
        input[2 * i] = data[i];       // Real
        input[2 * i + 1] = 0;         // Imag
    }
    for (let i = n; i < size; i++) {
        input[2 * i] = 0;
        input[2 * i + 1] = 0;
    }

    // 5. Execute Transform
    const output = fft.createComplexArray();
    fft.transform(output, input);

    // 6. Compute Frequency and Magnitude
    // Result size is size/2 + 1 usually (Nyquist), but we can just map first half
    const result = [];
    const limit = size / 2;

    for (let i = 0; i < limit; i++) {
        const re = output[2 * i];
        const im = output[2 * i + 1];
        // Magnitude
        const mag = Math.sqrt(re * re + im * im) / size; // Normalize by size usually

        // Frequency
        const freq = i * Fs / size;

        result.push([freq, mag]);
    }

    return result;
}
