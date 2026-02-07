import React from 'react';
import {
    HiSearch,
    HiUpload,
    HiSortAscending,
    HiSortDescending,
    HiViewGrid,
    HiViewList,
    HiDownload,
    HiTrash
} from 'react-icons/hi';
import logoImg from '../assets/logo-MDM.png';
import './Header.css';

export const Header = ({
    onSearch,
    sortOrder,
    onSortToggle,
    onUploadClick,
    viewMode,
    onViewToggle,
    sortBy,
    onSortChange,
    selectedCount,
    onDownloadSelected,
    onDeleteSelected
}) => {
    return (
        <header className="app-header">
            <div className="header-content">
                <div className="logo">
                    <img src={logoImg} alt="MDM Logo" className="logo-img" />
                    <span className="logo-text">MDM</span>
                </div>

                <div className="search-container">
                    <HiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="search-input"
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>

                <div className="actions">
                    {selectedCount > 0 && (
                        <>
                            <button className="btn-accent" onClick={onDownloadSelected}>
                                <HiDownload />
                                <span>DL ({selectedCount})</span>
                            </button>
                            <button className="btn-danger" onClick={onDeleteSelected}>
                                <HiTrash />
                                <span>Del ({selectedCount})</span>
                            </button>
                        </>
                    )}

                    <div className="sort-group">
                        <select
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value)}
                            className="sort-select"
                        >
                            <option value="date">Date</option>
                            <option value="size">Size</option>
                        </select>

                        <button className="btn-icon" onClick={onSortToggle} title="Toggle Sort">
                            {sortOrder === 'asc' ? <HiSortAscending /> : <HiSortDescending />}
                        </button>
                    </div>

                    <div className="view-toggle">
                        <button
                            className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => onViewToggle('grid')}
                            title="Grid"
                        >
                            <HiViewGrid />
                        </button>
                        <button
                            className={`btn-icon ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => onViewToggle('table')}
                            title="List"
                        >
                            <HiViewList />
                        </button>
                    </div>

                    <button className="btn-primary" onClick={onUploadClick}>
                        <HiUpload />
                        <span>Upload</span>
                    </button>
                </div>
            </div>
        </header>
    );
};
