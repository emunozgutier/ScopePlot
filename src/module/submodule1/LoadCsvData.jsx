import React, { useState, useRef } from 'react';
import { useMenuBarStore } from '../../stores/useMenuBarStore';
import { useSignalStore } from '../../stores/useSignalStore';
import { useControlPanelStore } from '../../stores/useControlPanelStore';

const LoadCsvData = () => {
    const { csvData, closeCsvModal } = useMenuBarStore();
    const { signalList } = useSignalStore();
    const { controlPanelData, updateControlPanelData } = useControlPanelStore();

    // State for file and parsing
    const [fileStats, setFileStats] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(0);
    const [timeColIndex, setTimeColIndex] = useState(-1);
    const [voltageColIndex, setVoltageColIndex] = useState(-1);
    const [fullParsedData, setFullParsedData] = useState([]); // Store full data to load

    const fileInputRef = useRef(null);

    // Helper to count non-empty values
    const countValidNumbers = (rows, colIndex) => {
        let count = 0;
        for (let row of rows) {
            if (row[colIndex] !== undefined && row[colIndex] !== '' && !isNaN(parseFloat(row[colIndex]))) {
                count++;
            }
        }
        return count;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            // Native simpler parser
            const rows = text.split(/\r?\n/).map(line => line.split(','));
            // Filter empty last lines
            const dataRows = rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));

            if (dataRows.length === 0) return;

            // Generate Columns
            const headers = dataRows[0].map((_, i) => `Column ${i + 1}`); // Or use first row if header?
            // Let's assume no header for now or treat first row as data if numeric? 
            // Better to just show data and let user verify.

            // Smart select: find columns with most numbers
            const colCounts = headers.map((_, i) => ({ index: i, count: countValidNumbers(dataRows, i) }));
            colCounts.sort((a, b) => b.count - a.count);

            const bestCols = colCounts.slice(0, 2);
            let tIndex = -1, vIndex = -1;

            if (bestCols.length > 0) tIndex = bestCols[0].index;
            if (bestCols.length > 1) vIndex = bestCols[1].index;

            // Try to be smarter? Time usually increases linearly.
            // But requirement simply says "find 2 columns that are the longest".
            // So I stick to count.

            setFullParsedData(dataRows);
            setColumns(headers);
            setTimeColIndex(tIndex);
            setVoltageColIndex(vIndex);

            // Preview 100x100
            const previewRows = dataRows.slice(0, 100).map(row => row.slice(0, 100));
            setPreviewData(previewRows);

            setFileStats({
                name: file.name,
                rows: dataRows.length,
                cols: dataRows[0].length
            });
        };
        reader.readAsText(file);
    };

    const handleLoad = () => {
        if (timeColIndex === -1 || voltageColIndex === -1) {
            alert("Please select valid Time and Voltage columns.");
            return;
        }

        // Extract Data
        const extractedData = [];
        for (let row of fullParsedData) {
            const t = parseFloat(row[timeColIndex]);
            const v = parseFloat(row[voltageColIndex]);
            if (!isNaN(t) && !isNaN(v)) {
                extractedData.push([t, v]);
            }
        }

        // Sort by time? Usually expected.
        extractedData.sort((a, b) => a[0] - b[0]);

        // Resampling Logic (Linear Interpolation) to 1024 points
        const resampleData = (data, targetCount) => {
            if (data.length < 2) return data;

            const output = [];
            const tStart = data[0][0];
            const tEnd = data[data.length - 1][0];
            const duration = tEnd - tStart;

            if (duration === 0) return Array(targetCount).fill(data[0]);

            let srcIdx = 0;

            for (let i = 0; i < targetCount; i++) {
                const t = tStart + (duration * i) / (targetCount - 1);

                // Advance srcIdx until data[srcIdx+1].time > t
                while (srcIdx < data.length - 1 && data[srcIdx + 1][0] <= t) {
                    srcIdx++;
                }

                const p0 = data[srcIdx];
                const p1 = data[srcIdx + 1];

                if (!p1) {
                    output.push([t, p0[1]]);
                    continue;
                }

                const t0 = p0[0];
                const t1 = p1[0];
                const v0 = p0[1];
                const v1 = p1[1];

                if (t1 === t0) {
                    output.push([t, v0]);
                } else {
                    const fraction = (t - t0) / (t1 - t0);
                    const v = v0 + (v1 - v0) * fraction;
                    output.push([t, v]);
                }
            }
            return output;
        };

        const resampledData = resampleData(extractedData, 1024);

        // Update Store
        // We need to call useSignalStore.getState().updateTimeData(selectedChannel, extractedData)
        // Or via hook if we exported action. We exported updateTimeData.

        // Wait, I need to get the function from the hook component-side or reuse logic?
        // useSignalStore is a hook.
        useSignalStore.getState().updateTimeData(selectedChannel, resampledData);

        // Ensure Channel is visible
        const channelConfig = controlPanelData.channels.find(c => c.id === selectedChannel);
        if (channelConfig && !channelConfig.visible) {
            const newChannels = controlPanelData.channels.map(c =>
                c.id === selectedChannel ? { ...c, visible: true } : c
            );
            updateControlPanelData({ ...controlPanelData, channels: newChannels });
        }

        closeCsvModal();
    };

    if (!csvData.isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '90vw', width: '900px' }}>
                <div className="modal-header">
                    <h2>Load CSV Data</h2>
                    <button className="close-btn" onClick={closeCsvModal}>×</button>
                </div>

                <div className="modal-row">
                    <input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
                </div>

                {fileStats && (
                    <div className="modal-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <p><strong>File:</strong> {fileStats.name} ({fileStats.rows} rows, {fileStats.cols} cols)</p>

                        <div style={{ display: 'flex', gap: '20px', margin: '10px 0' }}>
                            <div>
                                <label>Time Column: </label>
                                <select value={timeColIndex} onChange={e => setTimeColIndex(parseInt(e.target.value))}>
                                    {columns.map((_, i) => <option key={i} value={i}>Column {i + 1}</option>)}
                                </select>
                            </div>
                            <div>
                                <label>Voltage Column: </label>
                                <select value={voltageColIndex} onChange={e => setVoltageColIndex(parseInt(e.target.value))}>
                                    {columns.map((_, i) => <option key={i} value={i}>Column {i + 1}</option>)}
                                </select>
                            </div>
                            <div>
                                <label>Target Channel: </label>
                                <select value={selectedChannel} onChange={e => setSelectedChannel(parseInt(e.target.value))}>
                                    {[0, 1, 2, 3].map(id => <option key={id} value={id}>Channel {id + 1}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ width: '100%', maxHeight: '300px', overflow: 'auto', border: '1px solid #555' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#eee' }}>
                                <thead>
                                    <tr>
                                        {columns.slice(0, 100).map((_, i) => (
                                            <th key={i} style={{
                                                border: '1px solid #666', padding: '4px',
                                                background: (i === timeColIndex ? '#2a4' : i === voltageColIndex ? '#e44' : '#333')
                                            }}>
                                                Col {i + 1}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, rI) => (
                                        <tr key={rI}>
                                            {row.map((cell, cI) => (
                                                <td key={cI} style={{ border: '1px solid #444', padding: '4px', textAlign: 'right' }}>{cell}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={closeCsvModal}>Cancel</button>
                    <button className="btn-primary" onClick={handleLoad} disabled={!fileStats}>Load Data</button>
                </div>
            </div>
        </div>
    );
};

export default LoadCsvData;
