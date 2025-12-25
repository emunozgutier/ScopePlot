import { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import './App.css';

// --- Data Structures ---

const DEFAULT_SIGNAL_DATA = {
  id: 0,
  defaultZeroData: true,
  voltageTimeData: [], // Array of [time, voltage]
  OriginalVoltageTimeData: [] // Loaded/Generated static data
};

const initialAppData = {
  menuBarData: {
    activeMenu: null // 'File', 'Math', 'Help'
  },
  FunctionGenSignalData: {
    isOpen: false,
    enabled: false,
    amplitude: 5,
    frequency: 1,
    shape: 'sine', // 'sine', 'line', 'square', 'triangle'
    targetChannelId: 0,
    duration: 1,     // Time in seconds
    sampleRate: 100  // Samples per second
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

const LoadTestModal = ({ data, onSave, onClose }) => {
  const [localData, setLocalData] = useState({ ...data, periods: data.duration * data.frequency, samplesPerPeriod: data.sampleRate / data.frequency });

  // Sync derived state when data opens
  useEffect(() => {
    setLocalData({
      ...data,
      periods: data.duration * data.frequency,
      samplesPerPeriod: data.sampleRate / data.frequency
    });
  }, [data.isOpen]);

  const handleChange = (field, value) => {
    const newData = { ...localData, [field]: value };

    // Dependent Logic
    if (field === 'frequency') {
      // Update Periods and SPP based on new Freq (keeping Duration and Rate const? Or keeping Periods const?)
      // Usually if Freq changes:
      // If we keep Duration constant -> Periods changes.
      // If we keep Rate constant -> SPP changes.
      newData.periods = newData.duration * value;
      newData.samplesPerPeriod = newData.sampleRate / value;
    }

    // Time <-> Periods
    if (field === 'duration') {
      newData.periods = value * newData.frequency;
    } else if (field === 'periods') {
      newData.duration = value / (newData.frequency || 1);
    }

    // Rate <-> SPP
    if (field === 'sampleRate') {
      newData.samplesPerPeriod = value / (newData.frequency || 1);
    } else if (field === 'samplesPerPeriod') {
      newData.sampleRate = value * newData.frequency;
    }

    setLocalData(newData);
  };

  if (!data.isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Function Generator Load Test</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-row">
          <label>
            <input
              type="checkbox"
              checked={localData.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
            /> Enable Signal
          </label>
        </div>

        <div className="modal-row">
          <label>Target Channel</label>
          <select
            value={localData.targetChannelId}
            onChange={(e) => handleChange('targetChannelId', parseInt(e.target.value))}
          >
            {[0, 1, 2, 3].map(id => <option key={id} value={id}>Channel {id + 1}</option>)}
          </select>
        </div>

        <div className="modal-row">
          <label>Shape</label>
          <select
            value={localData.shape}
            onChange={(e) => handleChange('shape', e.target.value)}
          >
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="triangle">Triangle</option>
          </select>
        </div>

        <div className="modal-row">
          <label>Frequency (Hz)</label>
          <input
            type="number" step="0.1"
            value={localData.frequency}
            onChange={(e) => handleChange('frequency', parseFloat(e.target.value))}
          />
        </div>

        <div className="modal-row">
          <label>Amplitude (V)</label>
          <input
            type="number" step="0.1"
            value={localData.amplitude}
            onChange={(e) => handleChange('amplitude', parseFloat(e.target.value))}
          />
        </div>

        <div className="dual-input-row">
          <div className="dual-input-group">
            <label>Duration (s)</label>
            <input
              type="number" step="0.1"
              value={localData.duration}
              onChange={(e) => handleChange('duration', parseFloat(e.target.value))}
            />
          </div>
          <div className="dual-input-group">
            <label>Periods</label>
            <input
              type="number" step="0.1"
              value={localData.periods.toFixed(2)}
              onChange={(e) => handleChange('periods', parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="dual-input-row">
          <div className="dual-input-group">
            <label>Sample Rate (Hz)</label>
            <input
              type="number" step="10"
              value={localData.sampleRate}
              onChange={(e) => handleChange('sampleRate', parseFloat(e.target.value))}
            />
          </div>
          <div className="dual-input-group">
            <label>Samples/Period</label>
            <input
              type="number" step="1"
              value={localData.samplesPerPeriod.toFixed(2)}
              onChange={(e) => handleChange('samplesPerPeriod', parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(localData)}>Apply / Load</button>
        </div>
      </div>
    </div>
  );
};

// --- Submodules ---

const MenuBar = ({ menuBarData, setMenuBarData, onMenuAction }) => {
  const menus = ['File', 'Math', 'Help'];

  return (
    <div className="menu-bar">
      {menus.map(menu => (
        <div key={menu} style={{ position: 'relative' }}>
          <div
            className={classNames('menu-item', { active: menuBarData.activeMenu === menu })}
            onClick={() => setMenuBarData({ ...menuBarData, activeMenu: menuBarData.activeMenu === menu ? null : menu })}
          >
            {menu}
          </div>
          {menu === 'File' && menuBarData.activeMenu === 'File' && (
            <div
              style={{
                position: 'absolute', top: '100%', left: 0,
                background: '#333', border: '1px solid #555',
                zIndex: 100, width: '150px'
              }}
            >
              <div
                className="menu-item"
                onClick={() => { onMenuAction('loadTest'); setMenuBarData({ ...menuBarData, activeMenu: null }); }}
              >
                Load Test...
              </div>
            </div>
          )}
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

    if (voltageTimeData.length < 2) return '';

    const points = voltageTimeData.map(([t, v]) => {
      // For X, assuming t goes from 0 to 10 * timePerUnit
      // But if we are in "Load Test" mode, we might have static data that spans e.g. 1 second.
      // And timePerUnit might be 0.1s.
      // So we map real time 't' to screen X.

      const x = (t / controlPanelData.timePerUnit);
      const y = 4 - (v + offset) / voltsPerUnit;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  // ... rest of Display is similar but we need to ensure mapDataToPath is robust


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

  // Helper to generate signal buffer
  const generateSignalBuffer = (config) => {
    const { duration, sampleRate, frequency, shape, amplitude } = config;
    const count = Math.floor(duration * sampleRate);
    const points = [];

    for (let i = 0; i < count; i++) {
      const t = i / sampleRate;
      const phase = 0; // Static start
      const omega = 2 * Math.PI * frequency;
      let val = 0;

      if (shape === 'sine') {
        val = Math.sin(omega * t + phase);
      } else if (shape === 'square') {
        val = Math.sin(omega * t + phase) > 0 ? 1 : -1;
      } else if (shape === 'triangle') {
        // Triangle wave approximation
        val = (2 / Math.PI) * Math.asin(Math.sin(omega * t + phase));
      }

      points.push([t, val * amplitude]);
    }
    return points;
  };

  const handleSaveGenerator = (newData) => {
    // Save config and Generate Data
    const newAppData = { ...appData };
    newAppData.FunctionGenSignalData = { ...newData, isOpen: false }; // Close modal

    if (newData.enabled) {
      // Generate Buffer
      const buffer = generateSignalBuffer(newData);
      const targetCh = newData.targetChannelId;

      // Update Signal Data with Original
      newAppData.displayData.signalData = newAppData.displayData.signalData.map(sig => {
        if (sig.id === targetCh) {
          return {
            ...sig,
            OriginalVoltageTimeData: buffer,
            voltageTimeData: buffer // Display immediately
          };
        }
        return sig;
      });

      // Ensure Channel is visible
      const channelConfig = newAppData.controlPanelData.channels.find(c => c.id === targetCh);
      if (!channelConfig.visible) {
        newAppData.controlPanelData.channels = newAppData.controlPanelData.channels.map(c =>
          c.id === targetCh ? { ...c, visible: true } : c
        );
      }
    }

    setAppData(newAppData);
  };

  // Simulation Loop
  useEffect(() => {
    let animationFrameId;

    const renderLoop = () => {
      const { timePerUnit, samplesPerSecond } = appData.controlPanelData;

      // If we simply want to ANIMATE, we update timeRef.
      // But for loaded static signals, we might NOT want to animate them shift?
      // Or maybe we do? A scope triggers...
      // User said "Load Test", implying a static load.
      // If OriginalVoltageTimeData is setup, we just keep it?
      // BUT existing logic in Display maps `t` / timePerUnit.
      // If we don't shift `t` in the data, it stays static on screen (relative to 0).
      // So if we don't touch `OriginalVoltageTimeData`, it stays static.

      // We only need to simulate channels that DO NOT have OriginalVoltageTimeData (or if generator is disabled for them?)
      // Current sim logic generates fresh points every frame.

      timeRef.current += 0.02;

      setAppData(prev => {
        const newSignals = prev.displayData.signalData.map(sig => {
          // If we have loaded data, just return it (or subset?)
          // For now, return full buffer. Display handles clipping via viewport? 
          // SVG will draw everything. If buffer is huge, might be slow.
          // But for "Load Test" usually it's limited duration.

          if (sig.OriginalVoltageTimeData && sig.OriginalVoltageTimeData.length > 0) {
            return sig; // Don't re-simulate
          }

          // Normal Simulation Logic (Fallback)
          const points = [];
          const chSettings = prev.controlPanelData.channels.find(c => c.id === sig.id);
          if (!chSettings || !chSettings.visible) {
            return { ...sig, voltageTimeData: [] };
          }

          const count = Math.min(2000, Math.floor(10 * timePerUnit * samplesPerSecond));

          for (let i = 0; i < count; i++) {
            const relativeT = (i / count) * (10 * timePerUnit);
            let val = 0;
            const phase = timeRef.current * 5;
            const freq = 1 + sig.id;

            if (sig.id === 0) {
              val = Math.sin(relativeT * freq + phase);
            } else if (sig.id === 1) {
              val = Math.sin(relativeT * freq + phase) > 0 ? 1 : -1;
            } else if (sig.id === 2) {
              val = Math.asin(Math.sin(relativeT * freq + phase));
            } else {
              val = (Math.random() - 0.5);
            }
            if (chSettings.noiseFilter) val *= 0.5;
            points.push([relativeT, val * 3]);
          }
          return { ...sig, voltageTimeData: points };
        });

        // Optimization: Only update if changed? 
        // Logic above always creates new array for simulated ones.
        return {
          ...prev,
          displayData: {
            ...prev.displayData,
            signalData: newSignals
          }
        };
      });

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [appData.controlPanelData.samplesPerSecond, appData.controlPanelData.timePerUnit]);
  // Dependency note: if we didn't include other deps, closure might be stale, 
  // but we use functional update form `setAppData(prev => ...)` so we are safe on state.
  // We strictly need to restart loop if `samplesPerSecond` changes to init correct count logic if we relied on external constants.

  // State setters
  const setMenuBarData = (newData) => {
    setAppData(prev => ({ ...prev, menuBarData: newData }));
  };

  const updateControlPanelData = (newData) => {
    setAppData(prev => ({ ...prev, controlPanelData: newData }));
  };

  const handleMenuAction = (action) => {
    if (action === 'loadTest') {
      setAppData(prev => ({
        ...prev,
        FunctionGenSignalData: { ...prev.FunctionGenSignalData, isOpen: true }
      }));
    }
  };

  return (
    <div className="app-container">
      <MenuBar
        menuBarData={appData.menuBarData}
        setMenuBarData={setMenuBarData}
        onMenuAction={handleMenuAction}
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
      <LoadTestModal
        data={appData.FunctionGenSignalData}
        onSave={handleSaveGenerator}
        onClose={() => setAppData(prev => ({ ...prev, FunctionGenSignalData: { ...prev.FunctionGenSignalData, isOpen: false } }))}
      />
    </div>
  );
}

export default App;
