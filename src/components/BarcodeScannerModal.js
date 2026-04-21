import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader, BrowserCodeReader } from "@zxing/browser";
import { DecodeHintType, NotFoundException } from "@zxing/library";
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

  const full = document.createElement("canvas");
  full.width = w;
  full.height = h;
  draw(full, (ctx) => ctx.drawImage(video, 0, 0));

  const cw = Math.floor(w * 0.65);
  const ch = Math.floor(h * 0.65);
  const crop = document.createElement("canvas");
  crop.width = cw;
  crop.height = ch;
  draw(crop, (ctx) =>
    ctx.drawImage(video, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, cw, ch)
  );

  const scale = document.createElement("canvas");
  const sw = Math.min(Math.floor(w * 1.75), 2400);
  const sh = Math.min(Math.floor(h * 1.75), 2400);
  scale.width = sw;
  scale.height = sh;
  draw(scale, (ctx) => ctx.drawImage(video, 0, 0, sw, sh));

  return out;
}

function tryDecodeCanvases(reader, canvases) {
  for (const canvas of canvases) {
    try {
      const result = reader.decodeFromCanvas(canvas);
      const text = result.getText()?.trim();
      if (text) return text;
    } catch (e) {
      if (!isNotFoundError(e) && !(e?.name === "NotFoundException")) {
        /* try next */
      }
    }
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
      const url = URL.createObjectURL(file);
      try {
        const result = await readerStill.decodeFromImageUrl(url);
        const text = result.getText()?.trim();
        if (text) {
          finishWithCode(text);
          return;
        }
        window.alert("No barcode found in that image.");
      } catch {
        window.alert("Could not read a code from that image.");
      } finally {
        URL.revokeObjectURL(url);
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
