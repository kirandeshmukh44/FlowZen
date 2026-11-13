import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2, Check, AlertCircle } from 'lucide-react';
import { uploadProfilePhoto, removeProfilePhoto } from '../../api/profile';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Portal from './Portal';

const ProfilePhotoUpload = ({ isOpen, onClose, currentPhotoUrl }) => {
  const { user, setUser } = useAuth();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setPreview(currentPhotoUrl || null);
      setFile(null);
      setError('');
    }
  }, [isOpen, currentPhotoUrl]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file size (5 MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5 MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only JPG, JPEG, PNG, and WEBP formats are allowed');
      return;
    }

    setFile(selectedFile);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a photo first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await uploadProfilePhoto(file);

      if (result.success) {
        // Update global user state
        setUser({
          ...user,
          profilePhoto: result.profilePhoto,
          avatar: result.profilePhoto?.url || null,
        });

        toast.success('Profile photo updated successfully!');
        onClose();
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to upload photo';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await removeProfilePhoto();

      if (result.success) {
        // Update global user state
        setUser({
          ...user,
          profilePhoto: { url: null, publicId: null },
          avatar: null,
        });

        toast.success('Profile photo removed successfully!');
        onClose();
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to remove photo';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onMouseDown={handleBackdrop}
      >
        <div className="w-full max-w-md surface-modal rounded-3xl p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[var(--text-main)]">
              Profile Photo
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-muted)] disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-[var(--accent-soft)] bg-[var(--accent-soft)]">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-accent text-4xl font-bold">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              {!loading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-accent text-white shadow-lg hover:opacity-90 transition-opacity"
                >
                  <Camera size={18} />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={loading}
            />

            <p className="text-xs text-[var(--text-muted)] mt-3 text-center">
              JPG, JPEG, PNG, WEBP (max 5 MB)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {file ? (
              <>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-accent text-white text-sm font-bold shadow-xs hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Save Photo</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(currentPhotoUrl || null);
                    setError('');
                  }}
                  disabled={loading}
                  className="w-full py-3 rounded-xl border border-[var(--border)] text-[var(--text-main)] text-sm font-semibold hover:bg-[var(--accent-soft)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-accent text-white text-sm font-bold shadow-xs hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Upload size={18} />
                  <span>Select Photo</span>
                </button>

                {currentPhotoUrl && (
                  <button
                    onClick={handleRemove}
                    disabled={loading}
                    className="w-full py-3 rounded-xl border border-rose-500/30 text-rose-500 text-sm font-semibold hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin inline mr-2" />
                        Removing...
                      </>
                    ) : (
                      'Remove Current Photo'
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ProfilePhotoUpload;
