import React, { useEffect, useState } from 'react';
import { HiX, HiDownload, HiDocument, HiDocumentText } from 'react-icons/hi';
import { BsFileEarmarkWord, BsFileEarmarkPdf } from 'react-icons/bs';
import './PreviewPanel.css';

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Get file extension from title
const getFileExt = (title) => {
    return title?.split('.').pop()?.toLowerCase() || '';
};

// Get friendly file type name
const getFileTypeName = (mimetype, title) => {
    const ext = getFileExt(title);

    if (mimetype.includes('pdf') || ext === 'pdf') return 'PDF Document';
    if (mimetype.includes('word') || ext === 'doc' || ext === 'docx') return 'Word Document';
    if (mimetype.includes('excel') || ext === 'xls' || ext === 'xlsx') return 'Excel Spreadsheet';
    if (mimetype.includes('presentation') || ext === 'ppt' || ext === 'pptx') return 'PowerPoint';
    if (ext === 'txt') return 'Text File';
    if (ext === 'md') return 'Markdown File';
    if (ext === 'html' || ext === 'htm') return 'HTML File';
    if (ext === 'json') return 'JSON File';
    if (ext === 'csv') return 'CSV File';
    if (ext === 'rtf') return 'Rich Text';

    return ext.toUpperCase() || 'Document';
};

export const PreviewPanel = ({ doc, onClose }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (doc) {
            requestAnimationFrame(() => setIsOpen(true));
        } else {
            setIsOpen(false);
        }
    }, [doc]);

    const handleBackdropClick = () => {
        onClose();
    };

    if (!doc) return null;

    const viewUrl = `${import.meta.env.VITE_SERVER_URL}/documents/${doc.id}/view`;
    const downloadUrl = `${import.meta.env.VITE_SERVER_URL}/documents/${doc.id}/download`;

    const ext = getFileExt(doc.title);
    const fileTypeName = getFileTypeName(doc.mimetype, doc.title);

    // Check file type for preview
    const isPdf = doc.mimetype.includes('pdf') || ext === 'pdf';
    const isHtml = doc.mimetype.includes('html') || ext === 'html' || ext === 'htm';
    const isText = doc.mimetype.includes('text') || ext === 'txt';
    const isMarkdown = ext === 'md';
    const isJson = ext === 'json';
    const isCsv = ext === 'csv';
    const isWord = doc.mimetype.includes('word') || ext === 'doc' || ext === 'docx';

    const renderPreview = () => {
        if (isPdf) {
            return (
                <embed
                    src={viewUrl}
                    type="application/pdf"
                    className="preview-embed"
                />
            );
        } else if (isHtml || isText || isMarkdown || isJson || isCsv) {
            // Text-based files can be displayed in iframe
            return (
                <iframe
                    src={viewUrl}
                    title="Document Preview"
                    className="preview-frame"
                />
            );
        } else if (isWord) {
            // Word documents cannot be previewed in browser
            return (
                <div className="preview-placeholder">
                    <BsFileEarmarkWord className="preview-icon-large word-icon" />
                    <p className="preview-message">Word documents cannot be previewed in browser</p>
                    <span className="preview-type">{fileTypeName}</span>
                    <p className="preview-hint">Download the file to view it</p>
                </div>
            );
        } else {
            return (
                <div className="preview-placeholder">
                    <HiDocument className="preview-icon-large" />
                    <p className="preview-message">Preview not available</p>
                    <span className="preview-type">{fileTypeName}</span>
                    <p className="preview-hint">Download to view this file</p>
                </div>
            );
        }
    };

    return (
        <>
            <div
                className={`preview-backdrop ${isOpen ? 'visible' : ''}`}
                onClick={handleBackdropClick}
            />
            <div className={`preview-panel ${isOpen ? 'open' : ''}`}>
                <div className="preview-header">
                    <h3 className="preview-title">Preview</h3>
                    <button className="btn-close" onClick={onClose}><HiX /></button>
                </div>

                <div className="preview-content">
                    <div className="preview-viewer">
                        {renderPreview()}
                    </div>

                    <div className="preview-info">
                        <div className="info-row">
                            <span className="info-label">Name</span>
                            <span className="info-value" title={doc.title}>{doc.title}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Type</span>
                            <span className="info-value">{fileTypeName}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Size</span>
                            <span className="info-value">{formatSize(doc.size)}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Date</span>
                            <span className="info-value">{formatDate(doc.uploadDate)}</span>
                        </div>
                    </div>

                    <a href={downloadUrl} className="btn-download-panel">
                        <HiDownload /> Download
                    </a>
                </div>
            </div>
        </>
    );
};
