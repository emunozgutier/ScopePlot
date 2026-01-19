import React from 'react';
import DisplayOffsetColumn from './submodule1/DisplayOffsetColumn';
import DisplayGraph from './submodule1/DisplayGraph';
import DisplayAxis from './submodule1/DisplayAxis';

const Display = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minWidth: 0 }}>
            {/* Top Area: Sidebar + Plot */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
                {/* Sidebar for Offset Tabs */}
                <DisplayOffsetColumn />

                {/* Main Display Area */}
                <DisplayGraph />
            </div>

            {/* Bottom Area: X-Axis Labels */}
            <DisplayAxis />
        </div>
    );
};

export default Display;
