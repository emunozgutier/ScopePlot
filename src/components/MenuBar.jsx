import React from 'react';
import classNames from 'classnames';

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

export default MenuBar;
