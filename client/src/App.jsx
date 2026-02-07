import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from './components/Header';
import { DocumentGrid } from './components/DocumentGrid';
import { DocumentTable } from './components/DocumentTable';
import { UploadModal } from './components/UploadModal';
import { PreviewPanel } from './components/PreviewPanel';
import './index.css';

const API_URL = `${import.meta.env.VITE_SERVER_URL}/documents`;

function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [sortBy, setSortBy] = useState('date');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, [page, sortOrder, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchDocuments();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: { q: searchQuery, sortOrder, sortBy, page, pageSize: 10 }
      });
      setDocuments(response.data.documents);
      const total = response.data.total;
      const size = response.data.pageSize;
      setTotalPages(Math.ceil(total / size) || 1);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSelect = (idOrIds) => {
    if (Array.isArray(idOrIds)) {
      setSelectedDocIds(idOrIds);
    } else {
      setSelectedDocIds(prev => {
        if (prev.includes(idOrIds)) {
          return prev.filter(id => id !== idOrIds);
        } else {
          return [...prev, idOrIds];
        }
      });
    }
  };

  const handleDownloadSelected = async () => {
    try {
      if (selectedDocIds.length === 0) return;

      if (selectedDocIds.length === 1) {
        window.location.href = `${import.meta.env.VITE_SERVER_URL}/documents/${selectedDocIds[0]}/download`;
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/documents/download-zip`,
        { docIds: selectedDocIds },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'documents.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Bulk download failed", error);
    }
  };

  // Single delete
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_SERVER_URL}/documents/${id}`);
      setSelectedDocIds(prev => prev.filter(i => i !== id));
      fetchDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Bulk delete
  const handleDeleteSelected = async () => {
    if (selectedDocIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedDocIds.length} documents?`)) return;

    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/documents/delete-bulk`, {
        docIds: selectedDocIds
      });
      setSelectedDocIds([]);
      fetchDocuments();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  return (
    <div className="app">
      <Header
        onSearch={setSearchQuery}
        sortOrder={sortOrder}
        onSortToggle={handleSortToggle}
        onUploadClick={() => setIsUploadModalOpen(true)}
        viewMode={viewMode}
        onViewToggle={setViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedCount={selectedDocIds.length}
        onDownloadSelected={handleDownloadSelected}
        onDeleteSelected={handleDeleteSelected}
      />

      <main className="main-content">
        {loading ? (
          <div className="grid-loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="grid-empty">
            <h3>No docs found</h3>
            <p>Upload a file to start.</p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <DocumentGrid
              documents={documents}
              selectedIds={selectedDocIds}
              onSelect={handleSelect}
              onPreview={setPreviewDoc}
              onDelete={handleDelete}
            />
          ) : (
            <DocumentTable
              documents={documents}
              selectedIds={selectedDocIds}
              onSelect={handleSelect}
              onPreview={setPreviewDoc}
              onDelete={handleDelete}
            />
          )
        )}

        {totalPages > 1 && !loading && documents.length > 0 && (
          <div className="pagination">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Prev
            </button>
            <span className="page-info">{page}/{totalPages}</span>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        )}
      </main>

      <PreviewPanel doc={previewDoc} onClose={() => setPreviewDoc(null)} />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          fetchDocuments();
          setPage(1);
        }}
      />
    </div>
  );
}

export default App;
