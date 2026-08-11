'use client';

import { useState } from 'react';
import { UploadCloud, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';

export default function CatalogSyncPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleExport = async () => {
    try {
      const response = await api.get('/catalog-sync/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'library-catalog.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      alert('Failed to export catalog');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/catalog-sync/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult({ type: 'success', msg: res.data.message });
      setFile(null);
    } catch (err: any) {
      setResult({ type: 'error', msg: err.response?.data?.message || 'Import failed' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">Catalog Sync</h1>
        <p className="opacity-60 mt-1">Bulk import new books or export the entire catalog database via CSV.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card surface="light" className="p-8 text-center border-dashed border-2">
          <UploadCloud size={48} className="mx-auto mb-4 text-indigo-500 opacity-80" />
          <h2 className="font-bold text-lg mb-2">Import from CSV</h2>
          <p className="text-sm opacity-60 mb-6 px-4">Upload a CSV containing Title, Author, Genre, ISBN, and Quantity to bulk-generate book records and barcodes.</p>
          
          <input 
            type="file" 
            accept=".csv" 
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-4"
          />
          
          <button 
            disabled={!file || isUploading}
            onClick={handleImport}
            className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isUploading ? 'Processing...' : 'Upload & Sync'}
          </button>
        </Card>

        <Card surface="light" className="p-8 text-center border-dashed border-2">
          <Download size={48} className="mx-auto mb-4 text-emerald-500 opacity-80" />
          <h2 className="font-bold text-lg mb-2">Export to CSV</h2>
          <p className="text-sm opacity-60 mb-6 px-4">Download a raw dump of the entire books table for auditing, backup, or offline viewing in Excel.</p>
          
          <button 
            onClick={handleExport}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg mt-auto transition-colors"
          >
            Download Export
          </button>
        </Card>
      </div>

      {result && (
        <div className={`p-4 rounded-lg flex items-start gap-3 border ${result.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {result.type === 'success' ? <CheckCircle className="shrink-0" /> : <AlertCircle className="shrink-0" />}
          <div>
            <h3 className="font-bold">{result.type === 'success' ? 'Import Successful' : 'Import Failed'}</h3>
            <p className="text-sm mt-1">{result.msg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
