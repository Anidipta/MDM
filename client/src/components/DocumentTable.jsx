import React from 'react';
import { HiDownload, HiTrash } from 'react-icons/hi';
import {
    BsFileEarmarkPdf,
    BsFileEarmarkWord,
    BsFileEarmarkExcel,
    BsFileEarmarkPpt,
    BsFileEarmarkText,
    BsFileEarmark
} from 'react-icons/bs';
import './DocumentTable.css';

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
    });
};

const getIcon = (mimeType, filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();

    if (mimeType.includes('pdf') || ext === 'pdf') {
        return <BsFileEarmarkPdf className="doc-icon-small" />;
    }
    if (mimeType.includes('word') || ext === 'doc' || ext === 'docx') {
        return <BsFileEarmarkWord className="doc-icon-small" />;
    }
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || ext === 'xls' || ext === 'xlsx') {
        return <BsFileEarmarkExcel className="doc-icon-small" />;
    }
    if (mimeType.includes('presentation') || ext === 'ppt' || ext === 'pptx') {
        return <BsFileEarmarkPpt className="doc-icon-small" />;
    }
    if (mimeType.includes('text') || ext === 'txt' || ext === 'md') {
        return <BsFileEarmarkText className="doc-icon-small" />;
    }
    return <BsFileEarmark className="doc-icon-small" />;
};

export const DocumentTable = ({ documents, selectedIds, onSelect, onPreview, onDelete }) => {
    const handleRowClick = (doc) => {
        onPreview(doc);
    };

    const handleCheckboxChange = (e, id) => {
        e.stopPropagation();
        onSelect(id);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            onSelect(documents.map(d => d.id));
        } else {
            onSelect([]);
        }
    };

    const handleDownloadClick = (e) => {
        e.stopPropagation();
    };

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        onDelete(id);
    };

    const isAllSelected = documents.length > 0 && selectedIds.length === documents.length;

    return (
        <div className="doc-table-wrapper">
            <div className="doc-table-container">
                <table className="doc-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th>Name</th>
                            <th style={{ width: '120px' }}>Date</th>
                            <th style={{ width: '90px' }}>Size</th>
                            <th style={{ width: '85px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map((doc) => (
                            <tr key={doc.id} onClick={() => handleRowClick(doc)}>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(doc.id)}
                                        onChange={(e) => handleCheckboxChange(e, doc.id)}
                                    />
                                </td>
                                <td>
                                    <div className="doc-cell-name">
                                        {getIcon(doc.mimetype, doc.title)}
                                        <span className="doc-name-text" title={doc.title}>{doc.title}</span>
                                    </div>
                                </td>
                                <td>{formatDate(doc.uploadDate)}</td>
                                <td>{formatSize(doc.size)}</td>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <div className="action-cell">
                                        <a
                                            href={`${import.meta.env.VITE_SERVER_URL}/documents/${doc.id}/download`}
                                            className="table-btn btn-download"
                                            title="Download"
                                            onClick={handleDownloadClick}
                                        >
                                            <HiDownload />
                                        </a>
                                        <button
                                            className="table-btn btn-delete"
                                            title="Delete"
                                            onClick={(e) => handleDeleteClick(e, doc.id)}
                                        >
                                            <HiTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
