import { findPeaks } from './FindPeak.js';

function runTest(name, dataY, n, expectedLength) {
    const data = dataY.map((y, i) => [i, y]);
    const peaks = findPeaks(data, n);
    console.log(`Test: ${name}`);
    console.log(`Input: ${JSON.stringify(dataY)}`);
    console.log(`Found ${peaks.length} peaks:`, peaks.map(p => `(x:${p.x}, y:${p.y})`));

    if (peaks.length === expectedLength) {
        console.log("PASS\n");
    } else {
        console.error(`FAIL: Expected ${expectedLength} peaks, found ${peaks.length}\n`);
    }
}

// Case from user: 1 big peak, some small noise
// Peak at 10. Noise at 0.1.
// Should only find 1 peak if we implement thresholding (assuming default threshold > 1%).
runTest("Noise filtering", [0, 0.1, 0, 10, 0, 0.05, 0], 3, 1);

// Harmonics case (should maybe keep these?)
// 10, 3, 1. (30%, 10%)
// If threshold is 5%, keep all.
runTest("Harmonics", [0, 10, 0, 3, 0, 1, 0], 3, 3);
