import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { AcademicDocument } from '../../types';
import { fetchUserDocuments } from '../../services/workplaceService';
import {
  FolderArchive,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File,
  Search,
  Filter,
  Trash2,
  Download,
  Star,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Grid,
  List,
  Edit2,
  Eye,
  Plus,
  ExternalLink,
} from 'lucide-react';

export const DocumentLibraryView: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSort, setSelectedSort] = useState<string>('newest');
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterImportant, setFilterImportant] = useState(false);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<AcademicDocument['category']>('Lecture Notes');
  const [uploadUnit, setUploadUnit] = useState('');
  const [uploadSemester, setUploadSemester] = useState('Fall 2026');
  const [uploadYear, setUploadYear] = useState('2026/2027');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<AcademicDocument | null>(null);

  // Fetch documents for the student workspace from Firestore
  const fetchDocuments = async () => {
    const activeUid = currentUser?.uid || userProfile?.uid;
    if (!activeUid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setActionError(null);
    try {
      const docs = await fetchUserDocuments(activeUid);
      setDocuments(docs);
    } catch (err: any) {
      console.error('Error fetching academic documents:', err);
      setActionError('Failed to load documents. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [userProfile?.uid, currentUser?.uid]);

  // Handle Document Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    const activeUid = currentUser?.uid || userProfile?.uid;
    if (!activeUid) {
      setActionError('You must be signed in to upload documents.');
      return;
    }

    if (!uploadTitle.trim()) {
      setActionError('Document title is required.');
      return;
    }

    if (!selectedFile) {
      setActionError('Please select a document file to upload.');
      return;
    }

    // Validate size (max 25MB)
    if (selectedFile.size > 25 * 1024 * 1024) {
      setActionError('File size exceeds 25MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Processing and storing academic document...');
    setUploadProgress(40);
    setActionError(null);

    try {
      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const storagePath = `users/${activeUid}/documents/${docId}/${safeFileName}`;

      // Convert small file to Data URL for reliable in-browser storage & direct preview/download
      const reader = new FileReader();
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      setUploadProgress(80);
      setUploadStatus('Saving metadata to academic database...');

      const newDocData: Omit<AcademicDocument, 'documentId'> = {
        ownerId: activeUid,
        title: uploadTitle.trim(),
        originalFileName: selectedFile.name,
        storagePath,
        fileType: selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE',
        mimeType: selectedFile.type || 'application/octet-stream',
        fileSize: selectedFile.size,
        unitName: uploadUnit.trim() || 'General Studies',
        category: uploadCategory,
        semester: uploadSemester,
        academicYear: uploadYear,
        description: uploadDescription.trim(),
        tags: uploadTags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        isFavorite: false,
        isImportant: false,
        downloadUrl: fileDataUrl, // Data URI for direct preview and real browser download
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'documents'), newDocData);

      setUploadProgress(100);
      setUploadStatus('Completed!');

      // Append locally
      setDocuments((prev) => [
        {
          ...newDocData,
          documentId: docRef.id,
        },
        ...prev,
      ]);

      // Reset form
      setTimeout(() => {
        setShowUploadModal(false);
        setIsUploading(false);
        setUploadProgress(null);
        setUploadStatus(null);
        setUploadTitle('');
        setSelectedFile(null);
        setUploadDescription('');
        setUploadTags('');
      }, 500);
    } catch (err: any) {
      console.error('Error saving document:', err);
      setActionError('Failed to upload document. ' + (err.message || ''));
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Toggle Favorite
  const toggleFavorite = async (docItem: AcademicDocument) => {
    try {
      const newFav = !docItem.isFavorite;
      const ref = doc(db, 'documents', docItem.documentId);
      await updateDoc(ref, { isFavorite: newFav, updatedAt: new Date().toISOString() });
      setDocuments((prev) =>
        prev.map((d) => (d.documentId === docItem.documentId ? { ...d, isFavorite: newFav } : d))
      );
    } catch (e) {
      console.error('Error updating favorite:', e);
    }
  };

  // Toggle Important
  const toggleImportant = async (docItem: AcademicDocument) => {
    try {
      const newImp = !docItem.isImportant;
      const ref = doc(db, 'documents', docItem.documentId);
      await updateDoc(ref, { isImportant: newImp, updatedAt: new Date().toISOString() });
      setDocuments((prev) =>
        prev.map((d) => (d.documentId === docItem.documentId ? { ...d, isImportant: newImp } : d))
      );
    } catch (e) {
      console.error('Error updating important:', e);
    }
  };

  // Delete document
  const handleDeleteDoc = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this academic document?')) return;
    try {
      await deleteDoc(doc(db, 'documents', docId));
      setDocuments((prev) => prev.filter((d) => d.documentId !== docId));
      if (previewDoc?.documentId === docId) {
        setPreviewDoc(null);
      }
    } catch (e) {
      console.error('Error deleting document:', e);
      setActionError('Failed to delete document. Ensure you have ownership permissions.');
    }
  };

  // Filtered & Sorted documents
  const filteredDocs = documents
    .filter((docItem) => {
      const matchesSearch =
        docItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        docItem.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (docItem.unitName && docItem.unitName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        docItem.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'ALL' || docItem.category === selectedCategory;
      const matchesFav = !filterFavorite || docItem.isFavorite;
      const matchesImp = !filterImportant || docItem.isImportant;

      return matchesSearch && matchesCat && matchesFav && matchesImp;
    })
    .sort((a, b) => {
      if (selectedSort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (selectedSort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (selectedSort === 'titleAsc') {
        return a.title.localeCompare(b.title);
      }
      if (selectedSort === 'titleDesc') {
        return b.title.localeCompare(a.title);
      }
      if (selectedSort === 'largest') {
        return b.fileSize - a.fileSize;
      }
      if (selectedSort === 'smallest') {
        return a.fileSize - b.fileSize;
      }
      return 0;
    });

  const getFileIcon = (fileType: string) => {
    switch (fileType.toUpperCase()) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-rose-400" />;
      case 'DOC':
      case 'DOCX':
        return <FileText className="w-5 h-5 text-sky-400" />;
      case 'XLS':
      case 'XLSX':
      case 'CSV':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'JPG':
      case 'JPEG':
      case 'PNG':
      case 'WEBP':
        return <ImageIcon className="w-5 h-5 text-amber-400" />;
      default:
        return <File className="w-5 h-5 text-cyan-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Academic Documents</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
            My Academic Library
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Store, organize, and access your lecture notes, assignments, and research materials in one private academic repository.
          </p>
        </div>

        <button
          id="btn-upload-document-modal"
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-semibold text-sm shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all cursor-pointer shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>+ Upload Document</span>
        </button>
      </div>

      {/* Error Banner */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="documents-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, course, tag or filename..."
            className="w-full glass-input text-xs sm:text-sm rounded-xl pl-9 pr-4 py-2 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <select
            id="documents-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="glass-input text-xs rounded-xl px-3 py-2 text-white bg-[#020617]"
          >
            <option value="ALL">All Categories</option>
            <option value="Lecture Notes">Lecture Notes</option>
            <option value="Assignments">Assignments</option>
            <option value="Revision">Revision</option>
            <option value="Past Papers">Past Papers</option>
            <option value="Textbooks">Textbooks</option>
            <option value="Research">Research</option>
            <option value="Class Materials">Class Materials</option>
            <option value="Personal Notes">Personal Notes</option>
            <option value="Presentations">Presentations</option>
            <option value="Other">Other</option>
          </select>

          {/* Sort Filter */}
          <select
            id="documents-sort-select"
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="glass-input text-xs rounded-xl px-3 py-2 text-white bg-[#020617]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="titleAsc">Title A–Z</option>
            <option value="titleDesc">Title Z–A</option>
            <option value="largest">Largest Size</option>
            <option value="smallest">Smallest Size</option>
          </select>

          {/* Favorites & Important toggles */}
          <button
            id="toggle-filter-favorite"
            type="button"
            onClick={() => setFilterFavorite(!filterFavorite)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              filterFavorite
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'glass-input text-slate-400 hover:text-white'
            }`}
            title="Filter Favorites"
          >
            <Star className="w-4 h-4 fill-current" />
          </button>

          <button
            id="toggle-filter-important"
            type="button"
            onClick={() => setFilterImportant(!filterImportant)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              filterImportant
                ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                : 'glass-input text-slate-400 hover:text-white'
            }`}
            title="Filter Important"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>

          {/* View Toggle */}
          <div className="flex rounded-xl border border-white/10 p-0.5 bg-slate-950/60">
            <button
              id="view-mode-grid"
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              id="view-mode-list"
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-sm text-slate-300">Loading your private academic documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        /* Empty State */
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-white/10 max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <FolderArchive className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-heading">
              Your Academic Library is Empty
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
              Upload your lecture notes, assignments, revision materials, and research documents here.
            </p>
          </div>
          <button
            id="btn-upload-first-document"
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            + Upload Your First Document
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((docItem) => (
            <div
              key={docItem.documentId}
              id={`doc-card-${docItem.documentId}`}
              className="glass-card rounded-2xl p-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center shrink-0">
                      {getFileIcon(docItem.fileType)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {docItem.title}
                      </h4>
                      <p className="text-[11px] text-cyan-400 font-mono">
                        {docItem.unitName || 'Academic Unit'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(docItem)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        docItem.isFavorite ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={docItem.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleImportant(docItem)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        docItem.isImportant ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={docItem.isImportant ? 'Mark Unimportant' : 'Mark Important'}
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-300">
                    {docItem.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-300 uppercase font-mono">
                    {docItem.fileType}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] text-slate-400 font-mono">
                    {formatFileSize(docItem.fileSize)}
                  </span>
                </div>

                {docItem.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {docItem.description}
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[10px]">
                  {new Date(docItem.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-1.5">
                  {docItem.downloadUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(docItem)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {docItem.downloadUrl && (
                    <a
                      href={docItem.downloadUrl}
                      download={docItem.originalFileName}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(docItem.documentId)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Unit / Course</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredDocs.map((docItem) => (
                  <tr
                    key={docItem.documentId}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                          {getFileIcon(docItem.fileType)}
                        </div>
                        <div>
                          <span className="font-semibold text-white block group-hover:text-cyan-300">
                            {docItem.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {docItem.originalFileName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-cyan-400 font-mono">
                      {docItem.unitName || 'General'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px]">
                        {docItem.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {formatFileSize(docItem.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400">
                      {new Date(docItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(docItem)}
                          className={`p-1.5 rounded-lg ${
                            docItem.isFavorite ? 'text-amber-400' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                        {docItem.downloadUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(docItem)}
                            className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {docItem.downloadUrl && (
                          <a
                            href={docItem.downloadUrl}
                            download={docItem.originalFileName}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(docItem.documentId)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div
          id="upload-document-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => !isUploading && setShowUploadModal(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-xl p-6 border border-white/10 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center space-x-2.5">
                <UploadCloud className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white font-heading">
                  Upload Academic Document
                </h3>
              </div>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  disabled={isUploading}
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Advanced Calculus Lecture 4 Notes"
                  className="w-full glass-input text-white text-sm rounded-xl px-3.5 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Course / Unit Name
                  </label>
                  <input
                    type="text"
                    disabled={isUploading}
                    value={uploadUnit}
                    onChange={(e) => setUploadUnit(e.target.value)}
                    placeholder="e.g. CS 301 or MATH 204"
                    className="w-full glass-input text-white text-sm rounded-xl px-3.5 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={uploadCategory}
                    disabled={isUploading}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full glass-input text-white text-sm rounded-xl px-3.5 py-2 bg-[#020617]"
                  >
                    <option value="Lecture Notes">Lecture Notes</option>
                    <option value="Assignments">Assignments</option>
                    <option value="Revision">Revision</option>
                    <option value="Past Papers">Past Papers</option>
                    <option value="Textbooks">Textbooks</option>
                    <option value="Research">Research</option>
                    <option value="Class Materials">Class Materials</option>
                    <option value="Personal Notes">Personal Notes</option>
                    <option value="Presentations">Presentations</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Drag & Drop File Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Select File * (PDF, DOC, PPT, XLS, PNG, CSV max 25MB)
                </label>
                <div className="border-2 border-dashed border-white/20 hover:border-cyan-400/60 rounded-xl p-4 text-center cursor-pointer relative bg-slate-900/40 transition-colors">
                  <input
                    type="file"
                    required
                    disabled={isUploading}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        if (!uploadTitle) {
                          setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                        }
                      }
                    }}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp,.csv"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-2 text-cyan-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold">{selectedFile.name}</span>
                      <span className="text-slate-400">({formatFileSize(selectedFile.size)})</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-300">Click or drag file here to upload</p>
                      <p className="text-[10px] text-slate-500">Supported: PDF, Word, Excel, Slides, Images</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  disabled={isUploading}
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g. midterm, formulas, week3"
                  className="w-full glass-input text-white text-sm rounded-xl px-3.5 py-2"
                />
              </div>

              {/* Progress Bar */}
              {isUploading && uploadProgress !== null && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{uploadStatus}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-sky-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex justify-end space-x-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl glass-input text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 font-semibold text-xs shadow-lg transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Confirm Upload</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div
          id="preview-document-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col p-6 border border-white/10 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-heading truncate">
                  {previewDoc.title}
                </h3>
                <p className="text-xs text-cyan-400 font-mono">
                  {previewDoc.originalFileName} • {formatFileSize(previewDoc.fileSize)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {previewDoc.downloadUrl && (
                  <a
                    href={previewDoc.downloadUrl}
                    download={previewDoc.originalFileName}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/30"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-white text-base px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl bg-slate-950/80 p-2 flex items-center justify-center min-h-[350px]">
              {previewDoc.mimeType.startsWith('image/') && previewDoc.downloadUrl ? (
                <img
                  src={previewDoc.downloadUrl}
                  alt={previewDoc.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : previewDoc.fileType === 'PDF' && previewDoc.downloadUrl ? (
                <iframe
                  src={previewDoc.downloadUrl}
                  title={previewDoc.title}
                  className="w-full h-[60vh] rounded-lg border border-white/10"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <File className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-sm font-medium text-slate-300">
                    Preview unavailable for this file format ({previewDoc.fileType}).
                  </p>
                  <p className="text-xs text-slate-500">
                    Please use the download button above to access the complete academic file.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
