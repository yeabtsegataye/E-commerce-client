import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader, BrowserCodeReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";
import "./BarcodeScannerModal.css";

function isNotFoundError(error) {
  if (!error) return false;
  return (
    error instanceof NotFoundException ||
    error?.name === "NotFoundException"
  );
}

/** Prefer rear / environment camera — labels vary by browser and OS. */
async function pickPreferredVideoDeviceId() {
  try {
    const devices = await BrowserCodeReader.listVideoInputDevices();
    if (!devices?.length) return undefined;
    const back = devices.find((d) =>
      /back|rear|environment|wide|world|камера|后置|後鏡頭/i.test(
        d.label || ""
      )
    );
    const chosen = back ?? devices[devices.length - 1];
    return chosen.deviceId;
  } catch {
    return undefined;
  }
}

function stopVideoTracks(videoEl) {
  const stream = videoEl?.srcObject;
  if (stream && typeof stream.getTracks === "function") {
    stream.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch {
        /* ignore */
      }
    });
  }
  if (videoEl) {
    try {
      videoEl.srcObject = null;
    } catch {
      /* ignore */
    }
  }
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.floor(w));
  c.height = Math.max(1, Math.floor(h));
  return c;
}

function rotateCanvas90(src) {
  const dst = makeCanvas(src.height, src.width);
  const ctx = dst.getContext("2d");
  if (!ctx) return null;
  ctx.translate(dst.width / 2, dst.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return dst;
}

function rotateCanvas180(src) {
  const dst = makeCanvas(src.width, src.height);
  const ctx = dst.getContext("2d");
  if (!ctx) return null;
  ctx.translate(dst.width / 2, dst.height / 2);
  ctx.rotate(Math.PI);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return dst;
}

function rotateCanvas270(src) {
  const dst = makeCanvas(src.height, src.width);
  const ctx = dst.getContext("2d");
  if (!ctx) return null;
  ctx.translate(dst.width / 2, dst.height / 2);
  ctx.rotate((3 * Math.PI) / 2);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return dst;
}

function preprocessCanvas(src, mode) {
  const dst = makeCanvas(src.width, src.height);
  const ctx = dst.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, dst.width, dst.height);
  const d = img.data;

  // Convert to luma once
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) | 0;
    d[i] = y;
    d[i + 1] = y;
    d[i + 2] = y;
  }

  if (mode === "invert") {
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
  } else if (mode === "threshold") {
    // Simple global threshold: decent for printed barcodes with high contrast
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += d[i];
    const t = sum / (d.length / 4);
    for (let i = 0; i < d.length; i += 4) {
      const v = d[i] > t ? 255 : 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
  } else if (mode === "contrast") {
    // Mild contrast boost (clamped)
    const factor = 1.35;
    for (let i = 0; i < d.length; i += 4) {
      const v = d[i];
      const nv = Math.max(0, Math.min(255, (v - 128) * factor + 128));
      d[i] = nv;
      d[i + 1] = nv;
      d[i + 2] = nv;
    }
  }

  ctx.putImageData(img, 0, 0);
  return dst;
}

function scaleCanvas(src, scale, maxDim = 2600) {
  const w = src.width;
  const h = src.height;
  if (!w || !h) return null;
  const sw = Math.min(Math.floor(w * scale), maxDim);
  const sh = Math.min(Math.floor(h * scale), maxDim);
  if (sw < 2 || sh < 2) return null;
  const dst = makeCanvas(sw, sh);
  const ctx = dst.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, sw, sh);
  return dst;
}

/** Draw several canvases from a video frame (full, crop, upscale) for harder reads. */
function buildCaptureFrames(video) {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (w < 2 || h < 2) return [];

  const out = [];
  const draw = (canvas, drawFn) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawFn(ctx, canvas);
    out.push(canvas);
  };

  const full = makeCanvas(w, h);
  draw(full, (ctx) => ctx.drawImage(video, 0, 0));

  const cw = Math.floor(w * 0.7);
  const ch = Math.floor(h * 0.7);
  const crop = makeCanvas(cw, ch);
  draw(crop, (ctx) =>
    ctx.drawImage(video, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, cw, ch)
  );

  const scale = makeCanvas(
    Math.min(Math.floor(w * 1.9), 2400),
    Math.min(Math.floor(h * 1.9), 2400)
  );
  draw(scale, (ctx, c) => ctx.drawImage(video, 0, 0, c.width, c.height));

  return out;
}

function tryDecodeCanvasVariants(reader, base) {
  const queue = [];

  const push = (c) => {
    if (c && c.width >= 2 && c.height >= 2) queue.push(c);
  };

  // Base + scaled
  push(base);
  push(scaleCanvas(base, 1.35));
  push(scaleCanvas(base, 1.75));

  // Preprocess passes
  push(preprocessCanvas(base, "contrast"));
  push(preprocessCanvas(base, "invert"));
  push(preprocessCanvas(base, "threshold"));

  // Rotations (many images are rotated / mirrored)
  const r90 = rotateCanvas90(base);
  const r180 = rotateCanvas180(base);
  const r270 = rotateCanvas270(base);
  push(r90);
  push(r180);
  push(r270);
  if (r90) {
    push(preprocessCanvas(r90, "contrast"));
    push(preprocessCanvas(r90, "threshold"));
  }
  if (r270) {
    push(preprocessCanvas(r270, "contrast"));
    push(preprocessCanvas(r270, "threshold"));
  }

  for (const canvas of queue) {
    try {
      const result = reader.decodeFromCanvas(canvas);
      const text = result.getText()?.trim();
      if (text) return text;
    } catch (e) {
      if (!isNotFoundError(e) && !(e?.name === "NotFoundException")) {
        // ignore and continue through variants
      }
    }
  }
  return null;
}

function tryDecodeCanvases(reader, canvases) {
  for (const base of canvases) {
    const text = tryDecodeCanvasVariants(reader, base);
    if (text) return text;
  }
  return null;
}

/**
 * Preview + capture → decode (recommended on weak cameras), optional live scan, file upload.
 */
function BarcodeScannerModal({ onClose, onScan }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);
  const previewVideoElRef = useRef(null);
  const closingRef = useRef(false);
  const doneRef = useRef(false);
  const fileInputRef = useRef(null);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  onScanRef.current = onScan;
  onCloseRef.current = onClose;

  const [scanMode, setScanMode] = useState("preview"); // "preview" | "live"
  const [videoReady, setVideoReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const readerStill = useMemo(() => {
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    // Common formats; still broad enough but avoids some false paths.
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.ITF,
      BarcodeFormat.CODABAR,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.PDF_417,
      BarcodeFormat.AZTEC,
    ]);
    return new BrowserMultiFormatReader(hints, {});
  }, []);

  const stopActiveScanOnly = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      /* ignore */
    }
    controlsRef.current = null;
    stopVideoTracks(videoRef.current);
  }, []);

  const releasePreviewStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
      streamRef.current = null;
    }
    stopVideoTracks(videoRef.current);
  }, []);

  const releaseCamera = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      /* ignore */
    }
    controlsRef.current = null;
    readerRef.current = null;
    releasePreviewStream();
    try {
      BrowserCodeReader.releaseAllStreams();
    } catch {
      /* ignore */
    }
  }, [releasePreviewStream]);

  const finishWithCode = useCallback(
    (text) => {
      if (!text || closingRef.current) return;
      closingRef.current = true;
      doneRef.current = true;
      releaseCamera();
      onScanRef.current(text);
      onCloseRef.current();
      closingRef.current = false;
    },
    [releaseCamera]
  );

  const stopAndNotifyClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    doneRef.current = true;
    releaseCamera();
    onCloseRef.current();
    closingRef.current = false;
  }, [releaseCamera]);

  // Preview-only camera (no continuous decode)
  useEffect(() => {
    if (scanMode !== "preview") return;
    let cancelled = false;
    previewVideoElRef.current = null;
    setVideoReady(false);

    (async () => {
      try {
        const deviceId = await pickPreferredVideoDeviceId();
        const constraints = deviceId
          ? { video: { deviceId: { exact: deviceId } } }
          : {
              video: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
            };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          previewVideoElRef.current = v;
          v.srcObject = stream;
          v.onloadedmetadata = () => {
            if (!cancelled) setVideoReady(true);
          };
          await v.play().catch(() => {});
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          window.alert(
            "Could not open the camera. Allow permission. On a phone, open the site using your PC's IP (not localhost)."
          );
          onCloseRef.current();
        }
      }
    })();

    return () => {
      cancelled = true;
      setVideoReady(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            /* ignore */
          }
        });
        streamRef.current = null;
      }
      const el = previewVideoElRef.current;
      previewVideoElRef.current = null;
      if (el) {
        el.onloadedmetadata = null;
        el.srcObject = null;
      }
    };
  }, [scanMode]);

  // Live continuous decode (separate stream managed by ZXing)
  useEffect(() => {
    if (scanMode !== "live") return;
    doneRef.current = false;
    setVideoReady(false);

    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 30,
      delayBetweenScanSuccess: 280,
      tryPlayVideoTimeout: 20000,
    });
    readerRef.current = reader;

    let cancelled = false;

    const makeCallback = () => (result, error, scanControls) => {
      if (cancelled || doneRef.current) return;
      if (error && !isNotFoundError(error)) return;
      if (result) {
        const text = result.getText()?.trim();
        if (!text) return;
        doneRef.current = true;
        try {
          scanControls.stop();
        } catch {
          /* ignore */
        }
        releaseCamera();
        onScanRef.current(text);
        onCloseRef.current();
      }
    };

    const start = async () => {
      const video = videoRef.current;
      if (!video || cancelled) return;
      const callback = makeCallback();

      const constraintSets = [
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        { video: { facingMode: "environment" } },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: true },
      ];

      const tryAttach = async (label, fn) => {
        if (cancelled) return false;
        try {
          stopActiveScanOnly();
          const controls = await fn();
          if (cancelled) {
            try {
              controls.stop();
            } catch {
              /* ignore */
            }
            return false;
          }
          controlsRef.current = controls;
          return true;
        } catch (e) {
          console.warn(`[barcode] ${label}`, e);
          stopActiveScanOnly();
          return false;
        }
      };

      const deviceId = await pickPreferredVideoDeviceId();
      if (
        deviceId &&
        (await tryAttach("decodeFromVideoDevice(deviceId)", () =>
          reader.decodeFromVideoDevice(deviceId, video, callback)
        ))
      ) {
        return;
      }

      for (const constraints of constraintSets) {
        if (cancelled) return;
        if (
          await tryAttach("decodeFromConstraints", () =>
            reader.decodeFromConstraints(constraints, video, callback)
          )
        ) {
          return;
        }
      }

      if (cancelled) return;

      if (
        await tryAttach("decodeFromVideoDevice(default)", () =>
          reader.decodeFromVideoDevice(undefined, video, callback)
        )
      ) {
        return;
      }

      if (cancelled) return;
      window.alert("Could not start live scanning. Try photo capture instead.");
      setScanMode("preview");
    };

    const t = window.setTimeout(() => void start(), 120);

    return () => {
      cancelled = true;
      clearTimeout(t);
      doneRef.current = true;
      releaseCamera();
    };
  }, [scanMode, releaseCamera, stopActiveScanOnly]);

  const handleCaptureDecode = useCallback(() => {
    const video = videoRef.current;
    if (!video || busy) return;
    if (!videoReady || video.videoWidth < 2) {
      window.alert("Wait until the camera preview is visible, then try again.");
      return;
    }
    setBusy(true);
    try {
      const canvases = buildCaptureFrames(video);
      const text = tryDecodeCanvases(readerStill, canvases);
      if (text) {
        finishWithCode(text);
        return;
      }
      window.alert(
        "Could not read the code from this photo. Move closer, add light, or try “Live scan” / “Choose from gallery”."
      );
    } finally {
      setBusy(false);
    }
  }, [busy, videoReady, readerStill, finishWithCode]);

  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || busy) return;
      setBusy(true);
      try {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.decoding = "async";
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Image load failed"));
        });
        URL.revokeObjectURL(url);

        // Draw to canvases and run the same multi-pass decode as camera capture
        const base = makeCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
        const ctx = base.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0);
        const text = tryDecodeCanvases(readerStill, [base]);
        if (text) {
          finishWithCode(text);
          return;
        }
        window.alert("No barcode found in that image.");
      } catch {
        window.alert("Could not read a code from that image.");
      } finally {
        setBusy(false);
      }
    },
    [busy, readerStill, finishWithCode]
  );

  const goToLive = useCallback(() => {
    setScanMode("live");
  }, []);

  const backToPreview = useCallback(() => {
    stopActiveScanOnly();
    readerRef.current = null;
    try {
      BrowserCodeReader.releaseAllStreams();
    } catch {
      /* ignore */
    }
    setScanMode("preview");
  }, [stopActiveScanOnly]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      stopAndNotifyClose();
    }
  };

  return (
    <div
      className="barcode-scanner-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Scan barcode"
      onClick={handleOverlayClick}
    >
      <div className="barcode-scanner-panel">
        <div className="barcode-scanner-header">
          <h3>Scan barcode or QR</h3>
          <button
            type="button"
            className="barcode-scanner-close"
            onClick={stopAndNotifyClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="barcode-scanner-hint">
          {scanMode === "preview" ? (
            <>
              <strong>Photo mode (recommended):</strong> aim at the code, then
              tap <strong>Capture &amp; read</strong>. Or use live scanning /
              gallery below.
            </>
          ) : (
            <>
              <strong>Live mode:</strong> hold steady — the code is read
              automatically.{" "}
              <button
                type="button"
                className="barcode-scanner-link"
                onClick={backToPreview}
              >
                Back to photo mode
              </button>
            </>
          )}
        </p>
        <div className="barcode-scanner-video-wrap">
          <video
            ref={videoRef}
            className="barcode-scanner-video"
            playsInline
            muted
            autoPlay
          />
          <div className="barcode-scanner-reticle" aria-hidden="true">
            <div className="barcode-scan-box">
              <div className="barcode-scan-line" />
            </div>
          </div>
          {busy && (
            <div className="barcode-scanner-busy" aria-busy="true">
              Reading…
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="barcode-scanner-file-input"
          onChange={handleFileChange}
        />
        <div className="barcode-scanner-footer barcode-scanner-footer-actions">
          {scanMode === "preview" && (
            <>
              <button
                type="button"
                className="barcode-scanner-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                Gallery
              </button>
              <button
                type="button"
                className="barcode-scanner-secondary"
                onClick={goToLive}
                disabled={busy}
              >
                Live scan
              </button>
              <button
                type="button"
                className="barcode-scanner-capture"
                onClick={handleCaptureDecode}
                disabled={busy || !videoReady}
              >
                {busy ? "…" : "Capture & read"}
              </button>
            </>
          )}
          <button
            type="button"
            className="barcode-scanner-cancel"
            onClick={stopAndNotifyClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BarcodeScannerModal;
