
import React, { useEffect, useRef } from 'react';
import { analyzeRealTimeFrame } from '../utils/audioAnalyzer';
import { RealTimeMetrics } from '../types';

interface VisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
  simulate?: boolean;
  onMetricsUpdate?: (metrics: RealTimeMetrics) => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ stream, isRecording, simulate = false, onMetricsUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Cleanup previous context if exists
    if (audioContextRef.current) {
      if (sourceRef.current) sourceRef.current.disconnect();
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array;
    let timeArray: Float32Array;

    if (!simulate && stream) {
      // Real Audio Mode
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512; 
        analyser.smoothingTimeConstant = 0.5;
        
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        analyserRef.current = analyser;
        sourceRef.current = source;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        timeArray = new Float32Array(analyser.fftSize);
      } catch (err) {
        console.error("Audio Context Error", err);
      }
    } else if (simulate) {
      // Simulation Mode Arrays
      dataArray = new Uint8Array(256);
      timeArray = new Float32Array(512);
    }

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      frameCountRef.current++;

      // Check if we are "recording" (real or simulated)
      if (isRecording) {
        if (!simulate && analyser) {
          analyser.getByteFrequencyData(dataArray);
          analyser.getFloatTimeDomainData(timeArray);
          
          // Throttled Analysis (every 5 frames ~ 12 times/sec)
          if (onMetricsUpdate && frameCountRef.current % 5 === 0) {
             const metrics = analyzeRealTimeFrame(timeArray, dataArray, audioContextRef.current?.sampleRate || 44100);
             onMetricsUpdate(metrics);
          }

        } else if (simulate) {
           // Generate fake visualization data
           for (let i = 0; i < dataArray.length; i++) {
             dataArray[i] = Math.max(0, dataArray[i] * 0.9 + (Math.random() * 50 - 25));
             if (Math.random() > 0.9) dataArray[i] = Math.random() * 200; 
           }
           
           // Generate fake metrics
           if (onMetricsUpdate && frameCountRef.current % 10 === 0) {
             const fakeVol = Math.floor(Math.random() * 60 + 20);
             const fakePitch = Math.floor(Math.random() * 100 + 100);
             onMetricsUpdate({
                 volume: fakeVol,
                 pitch: fakePitch,
                 pitchLabel: 'محاكاة',
                 tone: Math.floor(Math.random() * 80 + 20)
             });
           }
        }
      } else {
        // Silence
        dataArray?.fill(0);
        if (onMetricsUpdate && frameCountRef.current % 20 === 0) {
             onMetricsUpdate({ volume: 0, pitch: 0, pitchLabel: '--', tone: 0 });
        }
      }

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Background Line
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = '#333';
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, canvas.height / 2);
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();

      // Draw Frequency Bars
      const bufferLength = dataArray ? dataArray.length : 0;
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2; // Scale down
        
        // Gradient color based on height (volume)
        const gradient = canvasCtx.createLinearGradient(0, canvas.height/2 - barHeight, 0, canvas.height/2 + barHeight);
        gradient.addColorStop(0, '#87CEEB'); // Ice
        gradient.addColorStop(0.5, '#D4AF37'); // Gold
        gradient.addColorStop(1, '#87CEEB'); // Ice

        canvasCtx.fillStyle = gradient;
        
        // Draw mirrored bars
        canvasCtx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, [stream, isRecording, simulate]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full h-full rounded-xl"
    />
  );
};

export default Visualizer;