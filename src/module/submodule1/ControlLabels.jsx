import React from 'react';
import classNames from 'classnames';
import { useSignalStore } from '../../stores/useSignalStore';

const ControlLabels = () => {
    const { labelToolActive, setLabelToolActive } = useSignalStore();

    return (
        <div className="control-labels" style={{ marginTop: '10px' }}>
            <button
                className={classNames("btn-secondary", { "active": labelToolActive })}
                style={{
                    width: '100%',
                    padding: '6px',
                    backgroundColor: labelToolActive ? '#007acc' : '#333',
                    color: 'white',
                    border: '1px solid #555',
                    cursor: 'pointer'
                }}
                onClick={() => setLabelToolActive(!labelToolActive)}
            >
                {labelToolActive ? 'Label Tool Active' : 'Label Tool'}
            </button>
            {labelToolActive && (
                <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px', fontStyle: 'italic' }}>
                    Click on the signal to place a label.
                </div>
            )}
        </div>
    );
};

export default ControlLabels;
