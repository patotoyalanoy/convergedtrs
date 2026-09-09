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
      <div className="fixed inset-0 z-[100] max-w-lg mx-auto bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <p className="mb-4 text-red-400">{error}</p>
        <button onClick={onCancel} className="bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer">Go Back</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] max-w-lg mx-auto bg-black flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-white shrink-0 z-10">
        <button onClick={handleClose} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"><X size={26} /></button>
        <h2 className="font-bold text-base">Capture Photo Evidence</h2>
        <div className="w-10"></div>
      </div>

      {/* Viewfinder / Preview */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
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

      {/* Controls Container ALWAYS VISIBLE ABOVE BOTTOM NAV */}
      <div className="h-32 bg-black/95 pb-8 pt-4 flex items-center justify-around px-8 shrink-0 border-t border-neutral-800">
        {!previewUrl ? (
          <>
            <div className="w-12"></div>
            <button 
              onClick={handleCapture}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer shadow-lg"
            >
              <div className="w-12 h-12 bg-white rounded-full"></div>
            </button>
            <div className="w-12 text-white text-center">
              <Camera size={26} className="mx-auto opacity-60" />
            </div>
          </>
        ) : (
          <>
            <button onClick={handleRetake} className="flex flex-col items-center text-neutral-300 hover:text-white transition-colors cursor-pointer">
              <RotateCcw size={22} className="mb-1" />
              <span className="text-xs font-semibold">Retake</span>
            </button>
            <button onClick={handleConfirm} className="flex items-center gap-2 bg-primary hover:bg-primary-dark px-6 py-3.5 rounded-full text-white font-black shadow-lg transition-transform active:scale-95 cursor-pointer">
              <Check size={20} />
              Use Photo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
