import { useEffect, useRef, useState } from 'react';
import { CameraService } from '@/lib/camera/camera';
import { Camera, X, RotateCcw, Check, FlipHorizontal, RefreshCw } from 'lucide-react';

interface Props {
  onCapture: (photo: Blob, photoUrl: string) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      if (videoRef.current) {
        try {
          const s = await CameraService.startCamera(videoRef.current, facingMode);
          if (isMounted) {
            setStream(s);
            setError(null);
          }
        } catch (err) {
          if (isMounted) {
            setError('Camera permission denied or camera unavailable.');
          }
        }
      }
    }
    initCamera();

    return () => {
      isMounted = false;
      if (stream) {
        CameraService.stopCamera(stream);
      }
    };
  }, [facingMode]); // Re-run when switching camera!

  const toggleCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    // Auto-disable mirror for back camera, enable for front camera
    setIsMirrored(nextMode === 'user');
  };

  const toggleMirror = () => {
    setIsMirrored(prev => !prev);
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const blob = CameraService.capturePhoto(videoRef.current, isMirrored);
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
        <p className="mb-4 text-red-400 font-semibold">{error}</p>
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
        
        {/* Mirror & Camera Switch controls in header */}
        {!previewUrl && (
          <div className="flex items-center gap-1">
            <button 
              onClick={toggleMirror}
              className={`p-2 rounded-full transition-colors cursor-pointer ${isMirrored ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
              title={isMirrored ? "Mirror Mode ON" : "Mirror Mode OFF"}
            >
              <FlipHorizontal size={20} />
            </button>
            <button 
              onClick={toggleCamera}
              className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
              title="Switch Camera (Front/Back)"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        )}
        {previewUrl && <div className="w-10" />}
      </div>

      {/* Viewfinder / Preview */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        {!previewUrl ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
            className="w-full h-full object-cover transition-transform duration-200"
          />
        ) : (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        )}

        {/* Live Camera Badge */}
        {!previewUrl && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-white border border-white/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {facingMode === 'user' ? 'Front Camera' : 'Back Camera'} {isMirrored ? '(Mirrored)' : ''}
          </div>
        )}
      </div>

      {/* Controls Container ALWAYS VISIBLE */}
      <div className="h-32 bg-black/95 pb-8 pt-4 flex items-center justify-around px-8 shrink-0 border-t border-neutral-800">
        {!previewUrl ? (
          <>
            {/* Mirror Toggle button */}
            <button 
              onClick={toggleMirror} 
              className="flex flex-col items-center text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs font-semibold gap-1"
            >
              <FlipHorizontal size={22} className={isMirrored ? "text-primary" : ""} />
              <span>{isMirrored ? 'Mirrored' : 'Normal'}</span>
            </button>

            {/* Shutter Button */}
            <button 
              onClick={handleCapture}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer shadow-lg hover:border-primary"
            >
              <div className="w-12 h-12 bg-white rounded-full"></div>
            </button>

            {/* Switch Front/Back Cam */}
            <button 
              onClick={toggleCamera} 
              className="flex flex-col items-center text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs font-semibold gap-1"
            >
              <RefreshCw size={22} />
              <span>Flip Cam</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={handleRetake} className="flex flex-col items-center text-neutral-300 hover:text-white transition-colors cursor-pointer">
              <RotateCcw size={22} className="mb-1" />
              <span className="text-xs font-semibold">Retake</span>
            </button>
            <button onClick={handleConfirm} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-6 py-3.5 rounded-full text-white font-black shadow-lg transition-transform active:scale-95 cursor-pointer">
              <Check size={20} />
              Use Photo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
