import React, { useState } from 'react';
import { Upload, Tag, AlertTriangle } from 'lucide-react';
import { offersApi } from '../services/api';

const OfferManager: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
            setError(null);
            setSuccess(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        setIsUploading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await offersApi.seedOffers(file);
            if (result.success) {
                setSuccess('Offers seeded successfully!');
                setFile(null);
            } else {
                setError(result.error || 'Failed to seed offers.');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100">
            <h2 className="text-lg font-serif font-medium text-brand-900 mb-4">Manage Offers</h2>
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="offer-file-upload"
                    />
                    <label
                        htmlFor="offer-file-upload"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-50 border-2 border-dashed border-brand-200 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-100 hover:border-brand-300 transition cursor-pointer"
                    >
                        <Upload size={16} />
                        <span>{file ? file.name : 'Choose a JSON file'}</span>
                    </label>
                </div>
                <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="px-6 py-2 bg-brand-900 text-white rounded-lg font-medium hover:bg-brand-800 transition disabled:opacity-50"
                >
                    {isUploading ? 'Uploading...' : 'Upload'}
                </button>
            </div>
            {error && (
                <div className="mt-4 flex items-center gap-2 text-red-600">
                    <AlertTriangle size={16} />
                    <span className="text-sm">{error}</span>
                </div>
            )}
            {success && (
                <div className="mt-4 flex items-center gap-2 text-green-600">
                    <Tag size={16} />
                    <span className="text-sm">{success}</span>
                </div>
            )}
        </div>
    );
};

export default OfferManager;
