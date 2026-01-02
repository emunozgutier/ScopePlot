/**
 * Finds the top N peaks in the signal data using the first derivative method (f'(x) = 0).
 * Filters out peaks that are less than 5% of the global maximum magnitude.
 * @param {Array<Array<number>>} data - The signal data as an array of [x, y] pairs.
 * @param {number} n - The number of peaks to return.
 * @returns {Array<{x: number, y: number, index: number}>} - The top N peaks.
 */
export function findPeaks(data, n) {
    if (!data || data.length < 2) return [];

    const peaks = [];

    // Calculate first derivative (dy)
    const dy = [];
    for (let i = 0; i < data.length - 1; i++) {
        dy.push(data[i + 1][1] - data[i][1]);
    }

    // Scan for zero crossings (positive to negative)
    for (let i = 0; i < dy.length - 1; i++) {
        const currentSlope = dy[i];
        const nextSlope = dy[i + 1];

        if (currentSlope > 0 && nextSlope < 0) {
            peaks.push({
                x: data[i + 1][0],
                y: data[i + 1][1],
                index: i + 1
            });
        }
        else if (currentSlope > 0 && nextSlope === 0) {
            let j = i + 1;
            while (j < dy.length && dy[j] === 0) {
                j++;
            }
            if (j < dy.length && dy[j] < 0) {
                peaks.push({
                    x: data[i + 1][0],
                    y: data[i + 1][1],
                    index: i + 1
                });
                i = j - 1;
            }
        }
    }

    // 1. Find Max Magnitude
    if (peaks.length === 0) return [];
    const maxMag = Math.max(...peaks.map(p => p.y));

    // 2. Filter peaks below threshold (e.g., 5% of max)
    // This helps remove noise / side lobes that are insignificant
    const threshold = maxMag * 0.05;
    const significantPeaks = peaks.filter(p => p.y >= threshold);

    // 3. Sort by magnitude (y) descending
    significantPeaks.sort((a, b) => b.y - a.y);

    // Return the top n peaks
    return significantPeaks.slice(0, n);
}
