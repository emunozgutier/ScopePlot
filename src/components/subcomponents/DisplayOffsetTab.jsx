import React from 'react';

const DisplayOffsetTab = ({ channel }) => {
    const { id, offset, voltsPerUnit, color, visible } = channel;

    if (!visible) return null;

    // Calculate Zero Position in Grid Units (0 = Top, 8 = Bottom)
    // Center is 4.
    // Positive Offset moves signal UP (decreasing Y).
    // Position of V=0:
    // y = 4 - (offset / voltsPerUnit)
    const zeroPosUnits = 4 - (offset / voltsPerUnit);

    // Convert to Percentage for CSS 'top'
    // 0 units -> 0%
    // 8 units -> 100%
    const topPercent = (zeroPosUnits / 8) * 100;

    // Clamp visual position to keep it mostly inside or at least visible on edge
    // Scopes usually arrow points even if off screen, but for now let's just render.
    // Maybe clamp to 0-100% if we want it to stay in view, or let it clip if functionality requires.
    // Requirement: "if you scroll... and offset is offscreen leave it as is".
    // So we allow it to go offscreen? "leave it as is" usually implies the values change but maybe the signal disappears.
    // If the tab is offscreen, user can't see it.
    // I will let it float freely; css overflow:hidden on container will clip it.

    return (
        <div
            style={{
                position: 'absolute',
                top: `${topPercent}%`,
                left: '0',
                transform: 'translateY(-50%)',
                backgroundColor: color,
                color: 'black', // Assuming bright channel colors
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 4px',
                borderTopRightRadius: '4px',
                borderBottomRightRadius: '4px',
                zIndex: 10,
                boxShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none', // Don't block clicks if we had any
                transition: 'top 0.1s ease-out'
            }}
        >
            Ch{id + 1}
            <div
                style={{
                    position: 'absolute',
                    left: '-5px',
                    top: '50%',
                    marginTop: '-5px',
                    width: 0,
                    height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderRight: `5px solid ${color}`
                }}
            />
        </div>
    );
};

export default DisplayOffsetTab;
