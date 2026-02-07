import React from 'react';
import './DocumentGrid.css';
import { DocumentCard } from './DocumentCard';

export const DocumentGrid = ({ documents, selectedIds, onSelect, onPreview, onDelete }) => {
    return (
        <div className="doc-grid">
            {documents.map((doc) => (
                <div key={doc.id} className="grid-item">
                    <DocumentCard
                        doc={doc}
                        isSelected={selectedIds.includes(doc.id)}
                        onSelect={onSelect}
                        onPreview={() => onPreview(doc)}
                        onDelete={onDelete}
                    />
                </div>
            ))}
        </div>
    );
};
