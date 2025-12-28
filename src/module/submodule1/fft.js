import FFT from 'fft.js';

export function computeFFT(voltageTimeData, sampleRate) {
    if (!voltageTimeData || voltageTimeData.length === 0) return [];

    // 1. Extract voltage samples
    const data = voltageTimeData.map(d => d[1]);
    const rawLen = data.length;

    // 2. Find next power of 2
    let p = 1;
    while (p < rawLen) p <<= 1;

    // 3. Initialize FFT
    const f = new FFT(p);
    const input = f.createComplexArray();
    const output = f.createComplexArray();

    // 4. Fill input (Zero-padding is implicit if we stop filling)
    for (let i = 0; i < rawLen; i++) {
        input[2 * i] = data[i];     // Real
        input[2 * i + 1] = 0;       // Imag
    }

    // 5. Transform
    f.transform(output, input);

    // 6. Calculate Magnitude & Frequency
    // We only need the first p/2 + 1 bins (Nyquist)
    // However, for typical visualization, p/2 is enough.
    const result = [];
    const numBins = p / 2;

    for (let i = 0; i < numBins; i++) {
        const re = output[2 * i];
        const im = output[2 * i + 1];
        // Magnitude = sqrt(re^2 + im^2) / N  (Normalization)
        const magnitude = Math.sqrt(re * re + im * im) / p;

        const freq = i * sampleRate / p;

        result.push({ freq, magnitude });
    }

    return result;
}
