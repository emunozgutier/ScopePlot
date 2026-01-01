import { fft, util } from 'fft-js';

export function computeFFT(voltageTimeData) {
    // voltageTimeData is an array of [time, voltage] pairs
    // I want result to be [freq, mag] pairs
    const voltageData = voltageTimeData.map(v => v[1]);
    const sampleRate = 1 / (voltageTimeData[1][0] - voltageTimeData[0][0]);
    const numberOfSamples = voltageTimeData.length;

    // we need voltageData to be an array of length 2^N
    // do a simple loop
    const powerOfTwo = Math.ceil(Math.log2(voltageData.length));
    const zerosToPad = 2 ** powerOfTwo - voltageData.length;
    const paddedData = voltageData.concat(Array(zerosToPad).fill(0));

    const phasors = fft(paddedData);
    const frequencies = util.fftFreq(phasors, sampleRate);
    const magnitudes = util.fftMag(phasors);

    const result = frequencies.map((freq, index) => [freq, magnitudes[index] / numberOfSamples]);

    return result;
}
