import { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import './App.css';

// --- Data Structures ---

const DEFAULT_SIGNAL_DATA = {
  id: 0,
  defaultZeroData: true,
  voltageTimeData: [] // Array of [time, voltage]
};

const initialAppData = {
  menuBarData: {
    activeMenu: null // 'File', 'Math', 'Help'
  },
  displayData: {
    signalData: [
      { ...DEFAULT_SIGNAL_DATA, id: 0 },
      { ...DEFAULT_SIGNAL_DATA, id: 1 },
      { ...DEFAULT_SIGNAL_DATA, id: 2 },
      { ...DEFAULT_SIGNAL_DATA, id: 3 },
    ]
  },
  controlPanelData: {
    timePerUnit: 1, // sec/div
    samplesPerSecond: 100,
    channels: [
      { id: 0, visible: true, voltsPerUnit: 1, offset: 0, acMode: true, noiseFilter: false, color: '#00ff00' },
      { id: 1, visible: false, voltsPerUnit: 1, offset: 0, acMode: true, noiseFilter: false, color: '#ffff00' },
      { id: 2, visible: false, voltsPerUnit: 1, offset: 0, acMode: true, noiseFilter: false, color: '#00ffff' },
      { id: 3, visible: false, voltsPerUnit: 1, offset: 0, acMode: true, noiseFilter: false, color: '#ff00ff' },
    ]
  }
};

// --- Submodules ---

const MenuBar = ({ menuBarData, setMenuBarData }) => {
  const menus = ['File', 'Math', 'Help'];

  return (
    <div className="menu-bar">
      {menus.map(menu => (
        <div
          key={menu}
          className={classNames('menu-item', { active: menuBarData.activeMenu === menu })}
          onClick={() => setMenuBarData({ ...menuBarData, activeMenu: menu })}
        >
          {menu}
        </div>
      ))}
    </div>
  );
};

const Display = ({ displayData, controlPanelData }) => {
  // Grid: 8 vertical units (Voltage), 10 horizontal units (Time)
  // We use SVG for rendering.
  // ViewBox: 0 0 10 8
  // Y-axis: 0 is top, 8 is bottom. Center is 4.

  const widthUnits = 10;
  const heightUnits = 8;

  // Helper to map data point to SVG coordinates
  const mapDataToPath = (voltageTimeData, channelSettings) => {
    if (!voltageTimeData || voltageTimeData.length === 0) return '';

    const { voltsPerUnit, offset } = channelSettings;
    // We only show data that fits in the current time window approximately?
    // Or we just map the time directly. 
    // Let's assume time starts at the first point's time or we just map 0-10 units relative to "now".
    // For this simulation, we'll map the last N seconds.
    // Actually, user said "Samples/Seconds that represents the points currently on the plot".
    // So voltageTimeData contains exactly what is on the plot.

    // Y-calculation:
    // Screen Center is Y=4.
    // +1V input with 1V/Unit should be at Y=3 (Up).
    // Y = 4 - (Voltage + Offset) / VoltsPerUnit

    // X-calculation:
    // Data is (time, voltage). We need to normalize time to 0-10 range.
    // If we assume data comes in correct window.
    if (voltageTimeData.length < 2) return '';

    const points = voltageTimeData.map(([t, v]) => {
      // For X, assuming t goes from 0 to 10 * timePerUnit
      const x = (t / controlPanelData.timePerUnit);
      const y = 4 - (v + offset) / voltsPerUnit;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="scope-display">
      <div className="grid-background" />
      <div className="center-crosshair" />

      <svg
        viewBox={`0 0 ${widthUnits} ${heightUnits}`}
        className="signal-layer"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      >
        {displayData.signalData.map((sig) => {
          const chSettings = controlPanelData.channels.find(ch => ch.id === sig.id);
          if (!chSettings || !chSettings.visible) return null;

          return (
            <path
              key={sig.id}
              d={mapDataToPath(sig.voltageTimeData, chSettings)}
              fill="none"
              stroke={chSettings.color}
              strokeWidth="0.05"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      <div className="signal-overlay">
        <div>Time/Div: {controlPanelData.timePerUnit}s</div>
        <div>Samples/Sec: {controlPanelData.samplesPerSecond}</div>
        {controlPanelData.channels.map(ch => ch.visible && (
          <div key={ch.id} style={{ color: ch.color }}>
            CH{ch.id + 1}: {ch.voltsPerUnit}V/Div
          </div>
        ))}
      </div>
    </div>
  );
};

const ControlPanel = ({ controlPanelData, onUpdate }) => {
  const updateChannel = (id, updates) => {
    const newChannels = controlPanelData.channels.map(ch =>
      ch.id === id ? { ...ch, ...updates } : ch
    );
    onUpdate({ ...controlPanelData, channels: newChannels });
  };

  const updateGlobal = (key, val) => {
    onUpdate({ ...controlPanelData, [key]: val });
  };

  return (
    <div className="control-panel">
      <div className="panel-section">
        <h3 className="panel-header">Global</h3>
        <div className="control-row">
          <label>Time/Div (s)</label>
          <input
            type="number"
            step="0.1"
            value={controlPanelData.timePerUnit}
            onChange={(e) => updateGlobal('timePerUnit', parseFloat(e.target.value))}
          />
        </div>
        <div className="control-row">
          <label>Samples/s</label>
          <input
            type="number"
            step="10"
            value={controlPanelData.samplesPerSecond}
            onChange={(e) => updateGlobal('samplesPerSecond', parseFloat(e.target.value))}
          />
        </div>
      </div>

      {controlPanelData.channels.map(ch => (
        <div key={ch.id} className="panel-section" style={{ borderLeft: `3px solid ${ch.color}` }}>
          <div className="ch-header">
            <h3 className="panel-header" style={{ color: ch.color }}>Channel {ch.id + 1}</h3>
            <button
              className={classNames('toggle-btn', { active: ch.visible })}
              onClick={() => updateChannel(ch.id, { visible: !ch.visible })}
            >
              {ch.visible ? 'ON' : 'OFF'}
            </button>
          </div>

          {ch.visible && (
            <div className="channel-controls">
              <div className="control-row">
                <label>Volts/Div</label>
                <input
                  type="number"
                  step="0.1"
                  value={ch.voltsPerUnit}
                  onChange={(e) => updateChannel(ch.id, { voltsPerUnit: parseFloat(e.target.value) })}
                />
              </div>
              <div className="control-row">
                <label>Offset (V)</label>
                <input
                  type="range"
                  min="-10" max="10" step="0.5"
                  value={ch.offset}
                  onChange={(e) => updateChannel(ch.id, { offset: parseFloat(e.target.value) })}
                />
              </div>
              <div className="control-row">
                <button
                  className={classNames('toggle-btn', { active: ch.acMode })}
                  onClick={() => updateChannel(ch.id, { acMode: !ch.acMode })}
                >
                  {ch.acMode ? 'AC' : 'DC'}
                </button>
                <button
                  className={classNames('toggle-btn', { active: ch.noiseFilter })}
                  onClick={() => updateChannel(ch.id, { noiseFilter: !ch.noiseFilter })}
                >
                  Filter
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- Main App ---

function App() {
  const [appData, setAppData] = useState(initialAppData);
  const timeRef = useRef(0);

  // Simulation Loop
  useEffect(() => {
    let animationFrameId;

    const renderLoop = () => {
      // Advance time
      // We want to generate data points based on Samples/Second.
      // But for a smooth 60fps animation, we might just generate a chunk of data.

      // Let's create a sliding window of data based on Grid Width (10 units) * TimePerUnit.
      const { timePerUnit, samplesPerSecond } = appData.controlPanelData;
      const totalTimeSpan = 10 * timePerUnit;
      const numPoints = Math.floor(totalTimeSpan * samplesPerSecond / 10); // Scale down points for perf if needed, but user asked for Samples/Sec to strictly represent points.

      // Actually, let's just generate 'numPoints' distributed over 0 to 10*timePerUnit for the visual frame.
      // To simulate scrolling, we shift the phase.

      timeRef.current += 0.02; // Arbitrary "real time" advancement

      const newSignals = appData.displayData.signalData.map(sig => {
        // Only generate data if channel is active (or always? "up to 4").
        // We'll generate for all to keep state valid, optimization later.

        const points = [];
        const chSettings = appData.controlPanelData.channels.find(c => c.id === sig.id);
        if (!chSettings || !chSettings.visible) {
          return { ...sig, voltageTimeData: [] };
        }

        const count = Math.min(2000, Math.floor(10 * timePerUnit * samplesPerSecond));
        // 10 units of time * S/s -> total samples visible.
        // Cap at 2000 for performance start.

        for (let i = 0; i < count; i++) {
          // t is relative logic time on screen (0 to 10 * div)
          // Actually X axis on SVG is 0-10.
          // mapped t should be 0 to 10*timePerUnit
          const relativeT = (i / count) * (10 * timePerUnit);

          // Simulation Logic
          let val = 0;
          const phase = timeRef.current * 5; // animation speed
          // Base frequency
          const freq = 1 + sig.id; // Different per channel

          if (sig.id === 0) { // Sine
            val = Math.sin(relativeT * freq + phase);
          } else if (sig.id === 1) { // Square
            val = Math.sin(relativeT * freq + phase) > 0 ? 1 : -1;
          } else if (sig.id === 2) { // Triangle
            val = Math.asin(Math.sin(relativeT * freq + phase));
          } else { // Noise or something
            val = (Math.random() - 0.5);
          }

          if (chSettings.noiseFilter) val *= 0.5; // Simple "filter" visual

          points.push([relativeT, val * 3]); // *3 to make it visible
        }

        return { ...sig, voltageTimeData: points };
      });

      setAppData(prev => ({
        ...prev,
        displayData: {
          ...prev.displayData,
          signalData: newSignals
        }
      }));

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [appData.controlPanelData]); // Re-create loop if fundamental params change

  // State setters
  const setMenuBarData = (newData) => {
    setAppData(prev => ({ ...prev, menuBarData: newData }));
  };

  const updateControlPanelData = (newData) => {
    setAppData(prev => ({ ...prev, controlPanelData: newData }));
  };

  return (
    <div className="app-container">
      <MenuBar
        menuBarData={appData.menuBarData}
        setMenuBarData={setMenuBarData}
      />
      <div className="main-workspace">
        <Display
          displayData={appData.displayData}
          controlPanelData={appData.controlPanelData}
        />
        <ControlPanel
          controlPanelData={appData.controlPanelData}
          onUpdate={updateControlPanelData}
        />
      </div>
    </div>
  );
}

export default App;
