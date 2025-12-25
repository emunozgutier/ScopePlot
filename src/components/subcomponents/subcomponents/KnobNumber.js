/**
 * Formats a number with metric prefixes (u, m, k, etc.)
 * @param {number} value - The value to format
 * @param {string} unit - The base unit (e.g., 'V', 's', 'Hz')
 * @returns {string} - Formatted string
 */
export const formatMetric = (value, unit = '') => {
    if (value === 0) return `0 ${unit}`;

    const absVal = Math.abs(value);

    // Less than 1 micro -> Nano (if needed, but 1uV min)
    if (absVal < 1e-6) {
        return `${(value * 1e9).toFixed(1)} n${unit}`;
    }
    // Micro
    if (absVal < 1e-3) {
        // Check if it's cleaner as integer
        const uVal = value * 1e6;
        return `${parseFloat(uVal.toPrecision(3))} u${unit}`;
    }
    // Milli
    if (absVal < 1) {
        const mVal = value * 1e3;
        return `${parseFloat(mVal.toPrecision(3))} m${unit}`;
    }
    // Kilo
    if (absVal >= 1000 && absVal < 1e6) {
        const kVal = value / 1e3;
        return `${parseFloat(kVal.toPrecision(3))} k${unit}`;
    }
    // Mega
    if (absVal >= 1e6) {
        const mVal = value / 1e6;
        return `${parseFloat(mVal.toPrecision(3))} M${unit}`;
    }

    // Base unit
    return `${parseFloat(value.toPrecision(3))} ${unit}`;
};

/**
 * Parses a string with metric prefixes back to a number
 * @param {string} valStr - The string to parse (e.g., "2 mV")
 * @returns {number} - The numeric value
 */
export const parseMetric = (valStr) => {
    if (!valStr) return 0;
    const str = valStr.toString().trim().toLowerCase().replace(/\s/g, ''); // Remove spaces

    // Check suffixes
    let multiplier = 1;
    let numPart = str;

    if (str.endsWith('n') || str.endsWith('nv') || str.endsWith('ns')) {
        multiplier = 1e-9;
        numPart = str.replace(/[a-z]+$/, '');
    } else if (str.endsWith('u') || str.endsWith('uv') || str.endsWith('us')) {
        multiplier = 1e-6;
        numPart = str.replace(/[a-z]+$/, '');
    } else if (str.endsWith('m') || str.endsWith('mv') || str.endsWith('ms')) {
        multiplier = 1e-3;
        numPart = str.replace(/[a-z]+$/, '');
    } else if (str.endsWith('k') || str.endsWith('kv') || str.endsWith('khz')) {
        multiplier = 1e3;
        numPart = str.replace(/[a-z]+$/, '');
    } else if (str.endsWith('v') || str.endsWith('s') || str.endsWith('hz')) {
        numPart = str.replace(/[a-z]+$/, '');
    } else if (str.endsWith('m') || str.endsWith('mv') || str.endsWith('ms')) {
        // Wait, 'm' is milli. user might mean Mega? Usually M is mega, m is milli. 
        // parseMetric should follow standard SI or common usage.
        // In code above 'm' is 1e-3. 
        // If we want Mega support in parse, we need case sensitivity or distinct suffix like 'meg'.
        // But let's assume 'M' input is possible.
    }

    // Simple Mega check if ends with M
    if (valStr.toString().trim().endsWith('M') || valStr.toString().trim().endsWith('MHZ') || valStr.toString().trim().endsWith('MV')) {
        multiplier = 1e6;
        numPart = str.replace(/[a-z]+$/i, ''); // i for case insensitive strip
    }

    const num = parseFloat(numPart);
    if (isNaN(num)) return 0;
    return num * multiplier;
};

// --- Step Logic ---

// Generate 1-2-5 steps from 1ns (1e-9) to 100M (1e8)
const generateSteps = () => {
    const steps = [];
    for (let exp = -9; exp <= 8; exp++) {
        steps.push(1 * Math.pow(10, exp));
        if (exp < 8) {
            steps.push(2 * Math.pow(10, exp));
            steps.push(5 * Math.pow(10, exp));
        }
    }
    // Fix floating point issues
    return steps.map(s => parseFloat(s.toPrecision(1))).sort((a, b) => a - b);
};

export const STEPS_1_2_5 = generateSteps();

export const snapTo125 = (val) => {
    if (val <= STEPS_1_2_5[0]) return STEPS_1_2_5[0];
    if (val >= STEPS_1_2_5[STEPS_1_2_5.length - 1]) return STEPS_1_2_5[STEPS_1_2_5.length - 1];

    // Check closest
    return STEPS_1_2_5.reduce((prev, curr) => {
        return (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
    });
};

