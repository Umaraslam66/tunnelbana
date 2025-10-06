// @ts-ignore
import RecordRTC from 'recordrtc';
import html2canvas from 'html2canvas';

export class GIFRecorder {
  private recorder: any = null;
  private recording: boolean = false;
  private canvas: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private captureInterval: any = null;

  async startRecording(elementId: string) {
    if (this.recording) return;
    
    try {
      console.log('🎬 Starting video recording of map...');
      
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Map container element not found');
      }

      // Find the Leaflet map container (this is what we want to capture)
      const mapContainer = element.querySelector('.leaflet-container') as HTMLElement;
      if (!mapContainer) {
        throw new Error('Leaflet map container not found');
      }

      // Create a canvas matching the map size
      this.canvas = document.createElement('canvas');
      const rect = mapContainer.getBoundingClientRect();
      this.canvas.width = Math.floor(rect.width);
      this.canvas.height = Math.floor(rect.height);
      
      console.log(`📐 Canvas size: ${this.canvas.width}x${this.canvas.height}`);
      
      // Get canvas stream at 15 FPS (smoother than 30, less intensive)
      // @ts-ignore
      this.stream = this.canvas.captureStream(15);

      // Set up recorder
      this.recorder = new RecordRTC(this.stream, {
        type: 'video',
        mimeType: 'video/webm',
        videoBitsPerSecond: 2500000,
        frameRate: 15
      });

      // Start recording
      this.recorder.startRecording();
      this.recording = true;
      
      console.log('✅ Recorder started, beginning frame capture...');

      // Capture frames at 15 FPS
      const captureFrame = async () => {
        if (!this.recording || !this.canvas) return;
        
        try {
          const ctx = this.canvas.getContext('2d');
          if (!ctx) return;

          // Capture the map container
          const screenshot = await html2canvas(mapContainer, {
            backgroundColor: '#0f172a',
            scale: 1,
            logging: false,
            useCORS: true,
            allowTaint: true,
            width: this.canvas.width,
            height: this.canvas.height
          });
          
          // Draw to canvas
          ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          ctx.drawImage(screenshot, 0, 0, this.canvas.width, this.canvas.height);
        } catch (error) {
          console.error('Frame capture error:', error);
        }
      };

      // Start capturing at ~15 FPS (66ms interval)
      captureFrame(); // Capture first frame immediately
      this.captureInterval = setInterval(captureFrame, 66);
      
      console.log('✅ Recording started - capturing map at 15 FPS');
    } catch (error) {
      console.error('❌ Recording start failed:', error);
      this.recording = false;
      this.cleanup();
      alert(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async stopRecording(): Promise<Blob | null> {
    if (!this.recording || !this.recorder) {
      console.warn('No active recording to stop');
      return null;
    }
    
    console.log('⏹️ Stopping recording...');
    this.recording = false;
    
    // Stop capturing frames
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    return new Promise((resolve) => {
      setTimeout(() => {
        this.recorder.stopRecording(() => {
          const blob = this.recorder.getBlob();
          console.log(`✅ Recording stopped. Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
          
          this.cleanup();
          resolve(blob);
        });
      }, 200); // Give it time to finalize
    });
  }

  private cleanup() {
    // Stop stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // Clear interval
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    // Clear recorder
    this.recorder = null;
    this.canvas = null;
  }

  isRecording(): boolean {
    return this.recording;
  }

  getFrameCount(): number {
    return 0;
  }
}

