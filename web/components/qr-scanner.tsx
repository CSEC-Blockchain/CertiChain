"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { decodeQrFromFile, decodeQrFromImageData } from "@/lib/qr";

type QrScannerProps = {
  onDecoded: (rawText: string) => void;
};

export function QrScanner({ onDecoded }: QrScannerProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanningFile, setScanningFile] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    if (!cameraOpen || !streamRef.current || !videoRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {});

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let rafId = 0;
    let active = true;

    const tick = () => {
      if (!active || !streamRef.current) return;
      if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA && ctx) {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const decoded = decodeQrFromImageData(imageData);
          if (decoded) {
            stopCamera();
            setScanError(null);
            onDecoded(decoded);
            return;
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, [cameraOpen, onDecoded, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  async function startCamera() {
    setScanError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setScanError("Camera unavailable in this browser. Try uploading a QR image instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      stopCamera();
      setScanError("Could not access the camera. Allow permission or upload a QR image.");
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    stopCamera();
    setScanError(null);
    setScanningFile(true);
    try {
      const decoded = await decodeQrFromFile(file);
      if (!decoded) {
        setScanError(
          "No QR code found in that image. Download the PNG from Issue, or paste the verify link instead.",
        );
        return;
      }
      stopCamera();
      onDecoded(decoded);
    } catch {
      setScanError("Could not read that image file.");
    } finally {
      setScanningFile(false);
    }
  }

  return (
    <div className="qr-scanner">
      <div className="qr-scanner-actions">
        {cameraOpen ? (
          <button type="button" className="btn-ghost btn-sm" onClick={stopCamera}>
            Stop camera
          </button>
        ) : (
          <button type="button" className="btn-ghost btn-sm" onClick={startCamera}>
            Scan QR
          </button>
        )}
        <button
          type="button"
          className="btn-ghost btn-sm"
          disabled={scanningFile}
          onClick={() => fileInputRef.current?.click()}
        >
          {scanningFile ? "Reading…" : "Upload QR"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Upload QR code image"
        />
      </div>

      {cameraOpen && (
        <div className="qr-video-frame">
          <video ref={videoRef} playsInline muted className="qr-video" />
          <p className="panel-note">Point your camera at a CertiChain QR code…</p>
        </div>
      )}

      {scanError && (
        <p role="alert" className="status-error">
          {scanError}
        </p>
      )}
    </div>
  );
}
