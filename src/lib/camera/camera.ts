export class CameraService {
  static async startCamera(videoElement: HTMLVideoElement, facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    try {
      // Stop existing tracks if any stream is already attached
      if (videoElement.srcObject) {
        const existingStream = videoElement.srcObject as MediaStream;
        existingStream.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: facingMode } },
        audio: false 
      });
      videoElement.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("Error accessing camera: ", err);
      throw new Error('Camera permission denied or unavailable');
    }
  }

  static capturePhoto(videoElement: HTMLVideoElement, isMirrored: boolean = false): Blob | null {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return this.dataURItoBlob(dataUrl);
  }

  private static dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  static stopCamera(stream: MediaStream) {
    stream.getTracks().forEach(track => track.stop());
  }
}
