'use client';

import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, AlertCircle, User, Tag, BookOpen, FileCheck, FolderOpen } from 'lucide-react';
import { uploadBook } from '../lib/bookStorage';

interface FileUploadProps {
  onUploadSuccess?: () => void;
  onUploadComplete?: () => void;
  onClose?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess, onUploadComplete, onClose }) => {
  const { user } = useAuth();
  const theme = user?.profile?.preferences?.theme || 'light';
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  // Book type options for dropdown
  const typeOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'special', label: 'Special' },
    { value: 'private', label: 'Private' }
  ];
  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    category: '',
    subcategory: '',
    paramparaCategory: '',
    acharyaName: '',
    description: '',
    tags: '',
    language: 'english',
    type: ''
  });

  const categoryOptions = {
    'Vaisnava Literature': ['Parampara', 'Acharya'],
    'Sruti': ['Rig Veda', 'Sama Veda', 'Yajur Veda', 'Atharva Veda'],
    'Smriti': ['Upavedas', 'Vedangas', 'Sad Darsanas', 'Puranas', 'Itihasas', 'Tantras', 'Agamas'],
    'Classical Literature': ['Sanskrit', 'Regional'],
  } as const;

  const bookCategories = Object.keys(categoryOptions);
  const paramparaOptions = [
    'Sri Sampradaya',
    'Brahma Sampradaya',
    'Rudra Sampradaya',
    'Kumara Sampradaya'
  ];
  const acharyaOptions = [
    'Śrīla Mādhvācārya',
    'Śrīla Ramanuja Acharya',
    'Śrīla Vishnuswami',
    'Śrīla Nimbarka',
    'Śrīla Svarūpa Dāmodara',
    'Śrīla Rūpa Gosvāmī',
    'Śrīla Sanātana Gosvāmī',
    'Śrīla Raghunātha dāsa Gosvāmī',
    'Śrīla Jīva Gosvāmī',
    'Śrīla Gopāla Bhaṭṭa Gosvāmī',
    'Śrīla Raghunātha Bhaṭṭa Gosvāmī',
    'Śrīla Kṛṣṇadāsa Kavirāja Gosvāmī',
    'Śrīla Narottama dāsa Ṭhākura',
    'Śrīla Vṛndāvana dāsa Ṭhākura',
    'Śrīla Viśvanātha Cakravartī Ṭhākura',
    'Śrīla Baladeva Vidyābhūṣaṇa',
    'Śrīla Bhaktivinoda Ṭhākura',
    'Śrīla Gaurakiśora dāsa Bābājī',
    'Śrīla Bhaktisiddhānta Sarasvatī Ṭhākura',
    'Śrīla A.C. Bhaktivedanta Swami Prabhupāda'
  ];

  const availableSubcategories = metadata.category
    ? categoryOptions[metadata.category as keyof typeof categoryOptions] || []
    : [];
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    const allowedTypes = ['.pdf', '.docx', '.epub'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('कृपया केवल PDF, DOCX, या EPUB फाइल अपलोड करें / Please upload only PDF, DOCX, or EPUB files');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File too large. Please select a file smaller than 50MB');
      return;
    }

    setCurrentFile(file);
    setMetadata({
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      author: '',
      category: '',
      subcategory: '',
      paramparaCategory: '',
      acharyaName: '',
      description: '',
      tags: '',
      language: 'english', // Default to lowercase to match backend
      type: ''
    });
    setShowMetadataForm(true);
  };

  const handleMetadataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentFile) return;
    
    setIsProcessing(true);
    setError('');

    try {
      // Validate required fields for backend
      if (!metadata.title.trim()) {
        throw new Error('Title is required');
      }
      if (!metadata.author.trim()) {
        throw new Error('Author is required');
      }
      if (!metadata.category) {
        throw new Error('Category is required');
      }
      if (!metadata.subcategory) {
        throw new Error('Subcategory is required');
      }
      if (metadata.subcategory === 'Parampara' && !metadata.paramparaCategory) {
        throw new Error('Parampara category is required');
      }
      if (metadata.subcategory === 'Acharya' && !metadata.acharyaName) {
        throw new Error('Acharya is required');
      }
      if (!metadata.language) {
        throw new Error('Language is required');
      }

      const parsedTags = metadata.tags
        ? metadata.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      const mergedTags = metadata.subcategory
        ? [
            metadata.subcategory,
            ...(metadata.paramparaCategory ? [metadata.paramparaCategory] : []),
            ...(metadata.acharyaName ? [metadata.acharyaName] : []),
            ...parsedTags,
          ]
        : parsedTags;

      const selectedSubSubcategory = metadata.paramparaCategory || metadata.acharyaName || '';
      
      await uploadBook(currentFile, {
        title: metadata.title.trim(),
        author: metadata.author.trim(),
        category: metadata.category,
        subcategory: metadata.subcategory,
        subSubcategory: selectedSubSubcategory || undefined,
        language: metadata.language.toLowerCase(),
        description: metadata.description.trim() || undefined,
        tags: mergedTags.length ? mergedTags : undefined,
        type: metadata.type || 'normal'
      });

      // Call both callbacks if they exist
      onUploadSuccess?.();
      onUploadComplete?.();
      
      setShowMetadataForm(false);
      setCurrentFile(null);
      setMetadata({ title: '', author: '', category: '', subcategory: '', paramparaCategory: '', acharyaName: '', description: '', tags: '', language: 'english', type: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!isProcessing && !showMetadataForm) {
      fileInputRef.current?.click();
    }
  };

  if (showMetadataForm) {
    return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{ background: theme === 'dark' ? 'rgba(20,20,20,0.85)' : 'rgba(0,0,0,0.12)' }}
        >
          <div
            className="rounded-lg shadow-lg p-8 border-l-4 w-full max-w-5xl relative max-h-[90vh] overflow-y-auto"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--accent)',
              color: 'var(--text)'
            }}
          >
          {onClose && (
            <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700">&times;</button>
          )}
          <div className="flex items-center space-x-3 mb-6">
            <FileCheck className="w-8 h-8" style={{color: 'var(--icon)'}} />
            <div>
              <h3 className="text-xl font-bold" style={{color: 'var(--text)'}}>
                Document Processed Successfully!
              </h3>
              <p className="text-sm opacity-75">Add book details to your library</p>
            </div>
          </div>

          <form onSubmit={handleMetadataSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text)'}}>
                <BookOpen className="inline w-4 h-4 mr-2" style={{ color: 'var(--icon)' }} />
                Book Title *
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--input)',
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }}
                placeholder="Enter the book title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text)'}}>
                <User className="inline w-4 h-4 mr-2" style={{ color: 'var(--icon)' }} />
                Author *
              </label>
              <input
                type="text"
                value={metadata.author}
                onChange={(e) => setMetadata(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--input)',
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }}
                placeholder="e.g., Vyasa, Valmiki, Srila Prabhupada"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text)'}}>
                <FolderOpen className="inline w-4 h-4 mr-2" style={{ color: 'var(--icon)' }} />
                Category *
              </label>
              <select
                value={metadata.category}
                onChange={(e) => setMetadata(prev => ({ ...prev, category: e.target.value, subcategory: '', paramparaCategory: '', acharyaName: '' }))}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 category-dropdown"
                style={{
                  background: 'var(--card)',
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }}
                required
              >
                <option value="">Select a category...</option>
                {bookCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text)'}}>
                <FolderOpen className="inline w-4 h-4 mr-2" style={{ color: 'var(--icon)' }} />
                Subcategory *
              </label>
              <select
                value={metadata.subcategory}
                onChange={(e) => setMetadata(prev => ({ ...prev, subcategory: e.target.value, paramparaCategory: '', acharyaName: '' }))}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--card)',
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }}
                disabled={!metadata.category}
                required
              >
                <option value="">{metadata.category ? 'Select a subcategory...' : 'Select category first...'}</option>
                {availableSubcategories.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            </div>

            {metadata.subcategory === 'Parampara' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text)'}}>
                  <FolderOpen className="inline w-4 h-4 mr-2" style={{ color: 'var(--icon)' }} />
                  Parampara Category *
                </label>
                <select
                  value={metadata.paramparaCategory}
                  onChange={(e) => setMetadata(prev => ({ ...prev, paramparaCategory: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--card)',
                    color: 'var(--text)',
                    borderColor: 'var(--border)'
                  }}
                  required
                >
                  <option value="">Select Parampara category...</option>
                  {paramparaOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {metadata.subcategory === 'Acharya' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text)'}}>
                  <FolderOpen className="inline w-4 h-4 mr-2" style={{ color: 'var(--icon)' }} />
                  Acharya *
                </label>
                <select
                  value={metadata.acharyaName}
                  onChange={(e) => setMetadata(prev => ({ ...prev, acharyaName: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--card)',
                    color: 'var(--text)',
                    borderColor: 'var(--border)'
                  }}
                  required
                >
                  <option value="">Select Acharya...</option>
                  {acharyaOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text)'}}>
                Description (Optional)
              </label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 h-20"
                style={{
                  background: 'var(--input)',
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }}
                placeholder="Brief description of the text..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text)'}}>
                <Tag className="inline w-4 h-4 mr-2" style={{ color: 'var(--icon)' }} />
                Categories/Tags (Optional)
              </label>
              <input
                type="text"
                value={metadata.tags}
                onChange={(e) => setMetadata(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--input)',
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }}
                placeholder="e.g., Vedas, Puranas, Philosophy, Yoga (separate with commas)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text)'}}>
                Language *
              </label>
              <select
                value={metadata.language}
                onChange={(e) => setMetadata(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--input)',
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }}
                required
              >
                <option value="">Select a language...</option>
                <option value="english">English</option>
                <option value="telugu">Telugu</option>
                <option value="sanskrit">Sanskrit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text)'}}>
                Type *
              </label>
              <select
                value={metadata.type}
                onChange={(e) => setMetadata(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--card)',
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }}
                required
              >
                <option value="">Select type...</option>
                {typeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4 md:col-span-2">
              <button
                type="submit"
                className="flex-1 py-3 px-6 rounded-lg font-medium transition-colors"
                style={{background: 'var(--accent)', color: 'var(--text)'}}
              >
                Save to Library & Start Reading
              </button>
              <button
                type="button"
                onClick={() => setShowMetadataForm(false)}
                className="px-6 py-3 border rounded-lg transition-colors"
                style={{background: 'var(--input)', color: 'var(--text)', borderColor: 'var(--border)'}}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ background: theme === 'dark' ? 'rgba(20,20,20,0.85)' : 'rgba(0,0,0,0.12)' }}
    >
      <div
        className="rounded-lg shadow-lg w-full max-w-2xl p-8 relative"
        style={{ background: 'var(--card)', color: 'var(--text)' }}
      >
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700">&times;</button>
        )}
        <div
          className={`upload-area rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${isDragOver ? 'border-solid scale-105' : 'border-dashed'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={handleClick}
          style={{
            background: 'var(--input)',
            color: 'var(--text)',
            borderColor: 'var(--border)'
          }}
        >
          <input
            type="file"
            accept=".docx"
            onChange={handleFileInputChange}
            ref={fileInputRef}
            className="hidden"
            disabled={isProcessing}
          />
          <div className="flex flex-col items-center space-y-4">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500"></div>
            ) : (
              <FileText className="w-16 h-16" style={{color: 'var(--icon)'}} />
            )}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold" style={{color: 'var(--text)'}}>
                {isProcessing ? 'प्रसंस्करण / Processing...' : 'पुस्तक अपलोड करें / Upload Book'}
              </h3>
              <p className="text-sm opacity-75">
                {isProcessing 
                  ? 'आपकी पुस्तक को पुस्तकालय के लिए तैयार किया जा रहा है...'
                  : 'Word document (.docx) को यहाँ खींचें या क्लिक करें'
                }
              </p>
            </div>
            {!isProcessing && (
              <div className="flex items-center space-x-2 px-6 py-3 rounded-lg border transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                <Upload className="w-4 h-4" style={{ color: 'var(--icon)' }} />
                <span className="text-sm font-medium">Choose File</span>
              </div>
            )}
          </div>
        </div>
        {error && (
          <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--error-bg)', borderColor: 'var(--error-border)', color: 'var(--error-text)' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--icon)' }} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        <div className="mt-8 p-6 rounded-lg" style={{background: 'var(--input)', color: 'var(--text)'}}>
          <h4 className="font-semibold mb-3">
            समर्थित प्रारूप / Supported Formats:
          </h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li>• Microsoft Word (.docx) documents</li>
            <li>• Vedic scriptures and spiritual texts</li>
            <li>• Sanskrit texts with or without translations</li>
            <li>• Religious and philosophical literature</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;