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
    // Kil0
    if (absVal >= 1000) {
        const kVal = value / 1e3;
        return `${parseFloat(kVal.toPrecision(3))} k${unit}`;
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
    }

    const num = parseFloat(numPart);
    if (isNaN(num)) return 0;
    return num * multiplier;
};
