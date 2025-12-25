import React from 'react';

/**
 * Renders a point on the display.
 * Intended to be used within an SVG container.
 * 
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string} color - Fill color
 * @param {number} radius - Radius of the point
 */
const DisplayPoint = ({ x, y, color = 'red', radius = 0.1 }) => {
    return (
        <circle
            cx={x}
            cy={y}
            r={radius}
            fill={color}
            stroke="none"
        />
    );
};

export default DisplayPoint;
