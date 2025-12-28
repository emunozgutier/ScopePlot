import React from 'react';
import classNames from 'classnames';
import { useMenuBarStore } from '../stores/useMenuBarStore';
import { useFunctionGenStore } from '../stores/useFunctionGenStore';
import { runLoadTest1, runLoadTest2 } from './submodule1/loadTestHelpers';

const MenuBarContent = () => {
    const { menuBarData, setMenuBarData } = useMenuBarStore();
    const { openModal } = useFunctionGenStore();

    // Local state for submenu
    const [activeSubMenu, setActiveSubMenu] = React.useState(null);

    const handleMenuAction = (action) => {
        if (action === 'test1') {
            runLoadTest1();
            closeAllMenus();
        } else if (action === 'test2') {
            runLoadTest2();
            closeAllMenus();
        } else if (action === 'custom') {
            openModal();
            closeAllMenus();
        }
    };

    const closeAllMenus = () => {
        setMenuBarData({ ...menuBarData, activeMenu: null });
        setActiveSubMenu(null);
    };

    const menus = ['File', 'Math', 'Help'];

    return (
        <div className="menu-bar">
            {menus.map(menu => (
                <div
                    key={menu}
                    style={{ position: 'relative' }}
                    onMouseLeave={() => { if (menu !== 'File') return; /* Keep generic if needed, but for now File is special */ }}
                >
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
                                style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}
                                onMouseEnter={() => setActiveSubMenu('loadTest')}
                                onMouseLeave={() => setActiveSubMenu(null)} // This might close it too fast if moving to submenu
                            >
                                <span>Load Test...</span>
                                <span>▶</span>

                                {activeSubMenu === 'loadTest' && (
                                    <div
                                        style={{
                                            position: 'absolute', top: 0, left: '100%',
                                            background: '#333', border: '1px solid #555',
                                            zIndex: 101, width: '150px'
                                        }}
                                    >
                                        <div
                                            className="menu-item"
                                            onClick={(e) => { e.stopPropagation(); handleMenuAction('test1'); }}
                                        >
                                            Test 1
                                        </div>
                                        <div
                                            className="menu-item"
                                            onClick={(e) => { e.stopPropagation(); handleMenuAction('test2'); }}
                                        >
                                            Test 2
                                        </div>
                                        <div
                                            className="menu-item"
                                            onClick={(e) => { e.stopPropagation(); handleMenuAction('custom'); }}
                                        >
                                            Custom Test
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default MenuBarContent;
