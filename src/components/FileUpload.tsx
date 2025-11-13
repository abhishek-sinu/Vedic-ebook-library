'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, User, Tag, BookOpen, FileCheck } from 'lucide-react';
import { uploadBook, formatFileSize } from '../lib/bookStorage';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    description: '',
    tags: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('कृपया केवल .docx फाइल अपलोड करें / Please upload only .docx files');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File too large. Please select a file smaller than 50MB');
      return;
    }

    setCurrentFile(file);
    setMetadata({
      title: file.name.replace('.docx', ''),
      author: '',
      description: '',
      tags: ''
    });
    setShowMetadataForm(true);
  };

  const handleMetadataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentFile) return;
    
    setIsProcessing(true);
    setError('');

    try {
      await uploadBook(currentFile, {
        title: metadata.title || currentFile.name.replace('.docx', ''),
        author: metadata.author || undefined,
        description: metadata.description || undefined,
        tags: metadata.tags ? metadata.tags.split(',').map(tag => tag.trim()) : undefined
      });

      onUploadSuccess();
      
      setShowMetadataForm(false);
      setCurrentFile(null);
      setMetadata({ title: '', author: '', description: '', tags: '' });
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
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-orange-400">
          <div className="flex items-center space-x-3 mb-6">
            <FileCheck className="w-8 h-8" style={{color: 'var(--saffron)'}} />
            <div>
              <h3 className="text-xl font-bold" style={{color: 'var(--deep-blue)'}}>
                Document Processed Successfully!
              </h3>
              <p className="text-sm opacity-75">Add book details to your library</p>
            </div>
          </div>

          <form onSubmit={handleMetadataSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--deep-blue)'}}>
                <BookOpen className="inline w-4 h-4 mr-2" />
                Book Title *
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Enter the book title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--deep-blue)'}}>
                <User className="inline w-4 h-4 mr-2" />
                Author (Optional)
              </label>
              <input
                type="text"
                value={metadata.author}
                onChange={(e) => setMetadata(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="e.g., Vyasa, Valmiki, Unknown"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--deep-blue)'}}>
                Description (Optional)
              </label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 h-20"
                placeholder="Brief description of the text..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--deep-blue)'}}>
                <Tag className="inline w-4 h-4 mr-2" />
                Categories/Tags (Optional)
              </label>
              <input
                type="text"
                value={metadata.tags}
                onChange={(e) => setMetadata(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="e.g., Vedas, Puranas, Philosophy, Yoga (separate with commas)"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 py-3 px-6 rounded-lg text-white font-medium transition-colors"
                style={{background: 'var(--saffron)'}}
              >
                Save to Library & Start Reading
              </button>
              <button
                type="button"
                onClick={() => setShowMetadataForm(false)}
                className="px-6 py-3 border border-orange-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
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
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          upload-area rounded-lg p-12 text-center cursor-pointer transition-all duration-300
          ${isDragOver ? 'border-solid scale-105' : 'border-dashed'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={handleClick}
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
            <FileText className="w-16 h-16" style={{color: 'var(--saffron)'}} />
          )}
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold" style={{color: 'var(--deep-blue)'}}>
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
            <div className="flex items-center space-x-2 px-6 py-3 rounded-lg border border-orange-300 hover:border-orange-400 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Choose File</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-8 p-6 rounded-lg" style={{background: 'var(--cream)'}}>
        <h4 className="font-semibold mb-3" style={{color: 'var(--deep-blue)'}}>
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
  );
};

export default FileUpload;