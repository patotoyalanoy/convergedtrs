export class CameraService {
  static async startCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      videoElement.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("Error accessing camera: ", err);
      throw new Error('Camera permission denied or unavailable');
    }
  }

  static capturePhoto(videoElement: HTMLVideoElement): Blob | null {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    let blobData: Blob | null = null;
    // Synchronous data URL fallback, but ideally use toBlob for better performance
    const dataUrl = canvas.toDataURL('image/jpeg/gif/webp/jpg/', 0.8);
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
