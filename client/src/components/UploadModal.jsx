import React, { useState } from 'react';
import axios from 'axios';
import { FiUploadCloud, FiX, FiFile, FiTrash2 } from 'react-icons/fi';
import './UploadModal.css';

export const UploadModal = ({ isOpen, onClose, onSuccess }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            // Filter out images based on mime type if user selects them despite 'accept'
            const validFiles = selectedFiles.filter(f => !f.type.startsWith('image/'));
            if (validFiles.length < selectedFiles.length) {
                setError('Some files were ignored because images are not allowed.');
            } else {
                setError(null);
            }
            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        if (files.length === 1) setError(null); // Clear error if last file removed
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            setError("Please select at least one file.");
            return;
        }

        setUploading(true);
        setProgress(0);
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        try {
            await axios.post(`${import.meta.env.VITE_SERVER_URL}/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percent);
                }
            });
            // Small delay to show 100%
            setTimeout(() => {
                onSuccess();
                onClose();
                setFiles([]);
                setProgress(0);
                setUploading(false);
            }, 500);
        } catch (err) {
            setError('Upload failed. Please check your connection and try again.');
            console.error(err);
            setUploading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass">
                <div className="modal-header">
                    <h3>Upload Documents</h3>
                    <button className="close-btn" onClick={onClose} disabled={uploading}>
                        <FiX />
                    </button>
                </div>

                <div className="upload-body">
                    <div className={`drop-zone ${files.length > 0 ? 'has-files' : ''}`}>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            id="file-upload"
                            className="file-input"
                            disabled={uploading}
                            accept=".pdf,.doc,.docx,.txt,.html,.htm,.xls,.xlsx,.ppt,.pptx,.rtf,.csv,.md,.json"
                        />
                        <label htmlFor="file-upload" className="upload-label">
                            <FiUploadCloud className="upload-icon-large" />
                            <span className="upload-text">Click to browse files</span>
                            <span className="upload-subtext">PDF, DOC, HTML, TXT, etc. (No Images)</span>
                        </label>
                    </div>

                    {files.length > 0 && (
                        <div className="file-preview-table-container">
                            <table className="file-preview-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Size</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map((f, i) => (
                                        <tr key={i}>
                                            <td className="file-name-cell" title={f.name}>
                                                <FiFile className="file-icon-small" /> {f.name}
                                            </td>
                                            <td>{(f.size / 1024).toFixed(1)} KB</td>
                                            <td>
                                                <button className="remove-btn" onClick={() => removeFile(i)} disabled={uploading}>
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    {uploading && (
                        <div className="upload-progress">
                            <div className="progress-info">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary" disabled={uploading}>Cancel</button>
                    <button onClick={handleUpload} disabled={uploading || files.length === 0} className="btn-primary">
                        {uploading ? 'Processing...' : 'Upload Files'}
                    </button>
                </div>
            </div>
        </div>
    );
};
