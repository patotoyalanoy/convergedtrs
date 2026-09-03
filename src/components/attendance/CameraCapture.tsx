import { useEffect, useRef, useState } from 'react';
import { CameraService } from '@/lib/camera/camera';
import { Camera, X, RotateCcw, Check } from 'lucide-react';

interface Props {
  onCapture: (photo: Blob, photoUrl: string) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initCamera() {
      if (videoRef.current) {
        try {
          const s = await CameraService.startCamera(videoRef.current);
          setStream(s);
        } catch (err) {
          setError('Camera permission denied. Please enable camera access.');
        }
      }
    }
    initCamera();

    return () => {
      if (stream) {
        CameraService.stopCamera(stream);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = () => {
    if (!videoRef.current) return;
    const blob = CameraService.capturePhoto(videoRef.current);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setPreviewBlob(blob);
      setPreviewUrl(url);
    }
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
  };

  const handleConfirm = () => {
    if (previewBlob && previewUrl) {
      if (stream) CameraService.stopCamera(stream);
      onCapture(previewBlob, previewUrl);
    }
  };

  const handleClose = () => {
    if (stream) CameraService.stopCamera(stream);
    onCancel();
  };

  if (error) {
    return (
      <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <p className="mb-4 text-red-400">{error}</p>
        <button onClick={onCancel} className="bg-white text-black px-6 py-2 rounded-lg font-semibold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-white">
        <button onClick={handleClose} className="p-2"><X size={28} /></button>
        <h2 className="font-semibold text-lg">Capture Photo</h2>
        <div className="w-11"></div> {/* Spacer for centering */}
      </div>

      {/* Viewfinder / Preview */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {!previewUrl ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Controls */}
      <div className="h-32 bg-black pb-8 flex items-center justify-around px-8">
        {!previewUrl ? (
          <>
            <div className="w-12"></div>
            <button 
              onClick={handleCapture}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-white rounded-full"></div>
            </button>
            <div className="w-12 text-white">
              <Camera size={28} className="mx-auto opacity-50" />
            </div>
          </>
        ) : (
          <>
            <button onClick={handleRetake} className="flex flex-col items-center text-white">
              <RotateCcw size={24} className="mb-1" />
              <span className="text-xs">Retake</span>
            </button>
            <button onClick={handleConfirm} className="flex items-center gap-2 bg-primary px-6 py-3 rounded-full text-white font-bold">
              <Check size={20} />
              Use Photo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
