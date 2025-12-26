export const initialControlPanelData = {
    timePerUnit: 1, // sec/div
    timeOffset: 0, // seconds
    TotalSignalSamples: 1000,
    channels: [
        { id: 0, visible: true, voltsPerUnit: 1, offset: 0, acMode: true, noiseFilter: false, color: '#ffff00' },
        { id: 1, visible: false, voltsPerUnit: 1, offset: 0, acMode: true, noiseFilter: false, color: '#00ff00' },
        { id: 2, visible: false, voltsPerUnit: 1, offset: 0, acMode: true, noiseFilter: false, color: '#00ffff' },
        { id: 3, visible: false, voltsPerUnit: 1, offset: 0, acMode: true, noiseFilter: false, color: '#ff00ff' },
    ]
};
