/**
 * ControlPanelTimeSamples
 * Utility to downsample signal data for display points.
 */

/**
 * Downsamples data to a maximum of 1000 points based on the current view.
 * 
 * @param {Array} data - The source data array.
 * @param {string} domain - 'time' or 'frequency'.
 * @param {Object} controlPanelData - Configuration for time/div, offset, etc.
 * @returns {Array} - The sampled data array.
 */
export const getSampledData = (data, domain, controlPanelData) => {
    if (!data || data.length === 0) return [];

    const MAX_SAMPLES = 1000;

    // If data is smaller than max samples, no need to sample
    if (data.length <= MAX_SAMPLES) {
        return data;
    }

    // Since the requirement is specifically "create 1,000 bins... and picks the first pont",
    // we will apply this logic regardless of whether we are zoomed in or not, 
    // effectively validating against the whole dataset or the "window" is key.
    // The user said "creates 1,000 bins on the time/div and offset", which implies
    // sampling based on the VIEWABLE area or the total range?
    // "creates 1,000 bins on the time/div and offset" -> This likely means the *viewable* range.
    // However, DisplaySignal usually receives the full dataset.
    // Let's implement a simple uniform downsampler first based on the user's description.

    // "creates 1,000 bins on the time/div and offset"
    // Time View Window:
    const { timePerUnit = 1, timeOffset = 0 } = controlPanelData || {};
    const totalViewTime = timePerUnit * 10;
    const startTime = -timeOffset;
    const endTime = startTime + totalViewTime;

    // We want 1000 bins spanning the VIEW window (or maybe the whole signal? User said "on the time/div and offset")
    // Usually, you sample what's ON SCREEN.
    // Let's sample based on the View Window.

    // However, data might be outside the window.
    // If we only sample the window, we ignore data outside.

    // Let's define the bin size based on the window.
    const binSize = totalViewTime / MAX_SAMPLES;

    const sampledData = [];

    // We need to iterate through the data and pick points for bins.
    // Assuming data is sorted by time (it usually is).
    // This is O(N) where N is data length.

    let currentBinIndex = 0;
    let lastBinIndex = -1;

    for (let i = 0; i < data.length; i++) {
        const point = data[i];
        const t = point[0]; // [time, voltage]

        // Calculate which bin this time falls into relative to the window START?
        // Or just relative to 0?
        // User said "bins on the time/div...".
        // Let's use the view window start as the anchor.

        // If point is before the window, we might skip it or clamp.
        // If we want to pan smoothly, we might need to sample the whole range using the density determined by time/div?
        // "creates 1,000 bins on the time/div and offset" strongly suggests screen-based sampling.

        if (t < startTime) continue;
        if (t > endTime) break; // utilizing sorted assumption

        const binIndex = Math.floor((t - startTime) / binSize);

        if (binIndex < 0) continue;
        if (binIndex >= MAX_SAMPLES) break;

        if (binIndex > lastBinIndex) {
            // First point in this bin
            sampledData.push(point);
            lastBinIndex = binIndex;
        }
    }

    return sampledData;
};

/**
 * More advanced binning based on Time/Div if needed later.
 * For now, the prompt asks: "creates 1,000 bins on the time/div and offset"
 * This suggests the bins should be relative to the SCREEN, not just the array index.
 */
export const getViewBasedSampledData = (data, domain, controlPanelData) => {
    if (!data || data.length === 0) return [];

    // TODO: Implement view-based binning if the simple decimation above isn't what's desired.
    // For 'time' domain:
    // Window Start = -controlPanelData.timeOffset
    // Window End = Window Start + (controlPanelData.timePerUnit * 10)

    return simpleDownsample(data, 1000);
};

const simpleDownsample = (data, targetCount) => {
    if (data.length <= targetCount) return data;
    const step = Math.ceil(data.length / targetCount);
    const result = [];
    for (let i = 0; i < data.length; i += step) {
        result.push(data[i]);
    }
    return result;
}

export default getSampledData;
