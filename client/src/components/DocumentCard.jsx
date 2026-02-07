import React from 'react';
import {
    HiDocument,
    HiDocumentText,
    HiDownload,
    HiTrash,
    HiClock,
    HiDatabase
} from 'react-icons/hi';
import {
    BsFileEarmarkPdf,
    BsFileEarmarkWord,
    BsFileEarmarkExcel,
    BsFileEarmarkPpt
} from 'react-icons/bs';
import './DocumentCard.css';

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
        day: 'numeric'
    });
};

const getIcon = (mimeType, filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();

    if (mimeType.includes('pdf') || ext === 'pdf') {
        return <BsFileEarmarkPdf className="doc-icon" />;
    }
    if (mimeType.includes('word') || ext === 'doc' || ext === 'docx') {
        return <BsFileEarmarkWord className="doc-icon" />;
    }
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || ext === 'xls' || ext === 'xlsx') {
        return <BsFileEarmarkExcel className="doc-icon" />;
    }
    if (mimeType.includes('presentation') || ext === 'ppt' || ext === 'pptx') {
        return <BsFileEarmarkPpt className="doc-icon" />;
    }
    if (mimeType.includes('text') || ext === 'txt' || ext === 'md') {
        return <HiDocumentText className="doc-icon" />;
    }
    return <HiDocument className="doc-icon" />;
};

export const DocumentCard = ({ doc, isSelected, onSelect, onPreview, onDelete }) => {
    const downloadUrl = `${import.meta.env.VITE_SERVER_URL}documents/${doc.id}/download`;

    const handleCheckboxClick = (e) => {
        e.stopPropagation();
        onSelect(doc.id);
    };

    const handleDownloadClick = (e) => {
        e.stopPropagation();
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete(doc.id);
    };

    return (
        <div className={`doc-card ${isSelected ? 'selected' : ''}`} onClick={onPreview}>
            <div className="card-overlay-select">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleCheckboxClick}
                    className="card-checkbox"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            <div className="doc-header">
                <div className="icon-wrapper">
                    {getIcon(doc.mimetype, doc.title)}
                </div>
            </div>

            <div className="doc-actions" onClick={(e) => e.stopPropagation()}>
                <a href={downloadUrl} className="action-btn download-btn" title="Download" onClick={handleDownloadClick}>
                    <HiDownload />
                </a>
                <button className="action-btn delete-btn" title="Delete" onClick={handleDeleteClick}>
                    <HiTrash />
                </button>
            </div>

            <div className="doc-info">
                <h3 className="doc-title" title={doc.title}>{doc.title}</h3>
                <div className="doc-meta">
                    <span className="meta-item">
                        <HiClock /> {formatDate(doc.uploadDate)}
                    </span>
                    <span className="meta-item">
                        <HiDatabase /> {formatSize(doc.size)}
                    </span>
                </div>
            </div>
        </div>
    );
};
