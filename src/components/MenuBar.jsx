import React from 'react';
import classNames from 'classnames';
import { useMenuBarStore } from '../stores/useMenuBarStore';

const MenuBar = ({ onMenuAction }) => { // onMenuAction might still be useful for things not in store, or we can move it
    const { menuBarData, setMenuBarData } = useMenuBarStore();

    // We can also handling onMenuAction via store or keep it as prop if it triggers App-level events not yet in store.
    // The original App passes 'handleMenuAction'. 'loadTest' opens the modal.
    // The modal state is now in useFunctionGenStore.
    // So we can handle it directly or via store.

    // Let's implement local handling for 'loadTest' by importing the FunctionGen store if needed, 
    // or just assume onMenuAction is still passed for now to minimize breakage until App is done?
    // User asked to manage "all that data".
    // 'loadTest' action opens the modal. That's data (isOpen).

    // Let's import useFunctionGenStore here to handle 'loadTest'
    // but we can't conditionally import.

    // Retaining onMenuAction prop for now to avoid breaking purely on this file change, 
    // BUT App.jsx will be refactored to NOT pass it. 
    // So I should implement the logic here.

    return (
        <MenuBarContent />
    );
};

// Start fresh for cleaner replacement
import { useFunctionGenStore } from '../stores/useFunctionGenStore';

const MenuBarContent = () => {
    const { menuBarData, setMenuBarData } = useMenuBarStore();
    const { openModal } = useFunctionGenStore();

    const handleMenuAction = (action) => {
        if (action === 'loadTest') {
            openModal();
        }
    };

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
                                onClick={() => { handleMenuAction('loadTest'); setMenuBarData({ ...menuBarData, activeMenu: null }); }}
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

export default MenuBarContent;
