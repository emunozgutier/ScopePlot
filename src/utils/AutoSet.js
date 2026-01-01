import { snapTo125 } from './KnobNumber';

export const performAutoSet = (controlPanelData, signalList) => {
    const visibleChannels = controlPanelData.channels.filter(ch => ch.visible);
    const activeSignals = signalList.filter(sig =>
        visibleChannels.some(ch => ch.id === sig.id) &&
        (controlPanelData.timeDomain ? (sig.timeData?.length > 0) : (sig.frequencyData?.length > 0))
    );

    if (activeSignals.length === 0) return controlPanelData;

    // --- Frequency Domain AutoSet ---
    if (!controlPanelData.timeDomain) {
        // 1. Horizontal (Frequency Span) Logic
        // We want to find the maximum frequency with significant magnitude.
        // However, simpler approach: Find the max frequency in the dataset (Nyquist of current capture)
        // OR better: Find the max freq with a peak?
        // Let's stick to the plan: "Identify the highest frequency with significant magnitude"
        // But for robust "AutoSet", often just fitting the available bandwidth is enough if we assume user wants to see what's captured.
        // But if the capture is huge (high sample rate), showing it all might bunch up the useful signal.
        // Let's find the max frequency where magnitude is > 1% of the global max magnitude.

        let globalMaxMag = 0;
        activeSignals.forEach(sig => {
            sig.frequencyData.forEach(d => {
                if (d[1] > globalMaxMag) globalMaxMag = d[1];
            });
        });

        let significantMaxFreq = 0;
        activeSignals.forEach(sig => {
            sig.frequencyData.forEach(d => {
                // Check if magnitude is significant (e.g. > 5% of max)
                // If signal is pure noise this might be erratic, but better than showing empty space.
                if (d[1] > globalMaxMag * 0.05) {
                    if (d[0] > significantMaxFreq) significantMaxFreq = d[0];
                }
            });
        });

        // If no significant freq found (silence), use the max available freq
        if (significantMaxFreq === 0) {
            activeSignals.forEach(sig => {
                const lastPoint = sig.frequencyData[sig.frequencyData.length - 1];
                if (lastPoint && lastPoint[0] > significantMaxFreq) significantMaxFreq = lastPoint[0];
            });
        }

        // We want 'significantMaxFreq' to be at roughly the 10th division (right edge) or little less (90%).
        // MaxFreqDisplayed = TotalSamples / (timePerUnit * 10) / 2  <-- Wait, this formula is derived from sampling rate.
        // Re-eval formula:
        // SampleRate = N / T_total = N / (timePerUnit * 10)
        // MaxFreq = SampleRate / 2 = N / (20 * timePerUnit)
        // We want MaxFreq >= significantMaxFreq
        // significantMaxFreq = N / (20 * timePerUnit)
        // timePerUnit = N / (20 * significantMaxFreq)

        const N = controlPanelData.TotalSignalSamples;
        let newTimePerUnit = (significantMaxFreq > 0) ? N / (20 * significantMaxFreq) : controlPanelData.timePerUnit;

        // Snap Time to 1-2-5 (Standard scope behavior)
        newTimePerUnit = snapTo125(newTimePerUnit);


        // 2. Vertical (Magnitude) Logic
        const newChannels = controlPanelData.channels.map(ch => {
            if (!ch.visible) return ch;
            const sig = signalList.find(s => s.id === ch.id);
            if (!sig || !sig.frequencyData || sig.frequencyData.length === 0) return ch;

            let maxMag = 0;
            sig.frequencyData.forEach(d => {
                if (d[1] > maxMag) maxMag = d[1];
            });

            if (maxMag === 0) return ch;

            // We want maxMag to fit in ~6 grid units (Display height is 8).
            // Mag is plotted as: y = 8 - (mag * 10 + offset) / voltsPerUnit
            // We want y approx 2 (near top) for the peak.
            // 2 = 8 - (maxMag * 10) / voltsPerUnit  (assuming offset 0)
            // 6 = (maxMag * 10) / voltsPerUnit
            // voltsPerUnit = (maxMag * 10) / 6

            let newVoltsPerUnit = (maxMag * 10) / 6;
            newVoltsPerUnit = snapTo125(newVoltsPerUnit);

            return { ...ch, voltsPerUnit: newVoltsPerUnit, offset: 0 };
        });

        return {
            ...controlPanelData,
            timePerUnit: newTimePerUnit,
            timeOffset: 0, // Frequency domain usually starts at 0 Hz
            channels: newChannels
        };
    }

    // --- Time Domain AutoSet (Existing Logic) ---

    // 1. Time Logic
    let activeMaxTime = 0;
    activeSignals.forEach(sig => {
        const vData = sig.timeData;
        const lastPoint = vData[vData.length - 1];
        if (lastPoint && lastPoint[0] > activeMaxTime) activeMaxTime = lastPoint[0];
    });

    // Set Time/Div to fit maxTime in 10 units
    // If maxTime is very small (e.g. 0), keep default.
    let newTimePerUnit = activeMaxTime > 0 ? activeMaxTime / 10 : controlPanelData.timePerUnit;

    // Snap Time to 1-2-5
    newTimePerUnit = snapTo125(newTimePerUnit);


    // 2. Voltage Logic
    const newChannels = controlPanelData.channels.map(ch => {
        if (!ch.visible) return ch;
        const sig = signalList.find(s => s.id === ch.id);

        // Safety check for signal data
        if (!sig || !sig.timeData || sig.timeData.length === 0) return ch;

        let minV = Infinity;
        let maxV = -Infinity;

        // Analyze raw voltage
        sig.timeData.forEach(([_, v]) => {
            if (v < minV) minV = v;
            if (v > maxV) maxV = v;
        });

        if (minV === Infinity) return ch;

        const range = maxV - minV;
        const center = (maxV + minV) / 2;

        // Grid Height is 8 units. We want signal to cover ~6 units?
        // Volts/Unit = Range / 6
        let newVoltsPerUnit = range > 0 ? range / 6 : 1;

        // Snap Volts to 1-2-5
        newVoltsPerUnit = snapTo125(newVoltsPerUnit);

        // Offset Logic:
        // Y = 4 - (v + offset) / voltsPerUnit
        // We want 'center' to be at Y=4 (Screen Center).
        // 4 = 4 - (center + offset) / voltsPerUnit -> center + offset = 0 -> offset = -center.
        const newOffset = -center;

        return { ...ch, voltsPerUnit: newVoltsPerUnit, offset: newOffset };
    });

    // Compute min time for offset
    let minTime = Infinity;
    activeSignals.forEach(sig => {
        const firstPoint = sig.timeData[0];
        if (firstPoint && firstPoint[0] < minTime) minTime = firstPoint[0];
    });
    const newTimeOffset = minTime !== Infinity ? -minTime : 0;

    return {
        ...controlPanelData,
        timePerUnit: newTimePerUnit,
        timeOffset: newTimeOffset,
        channels: newChannels
    };
};
