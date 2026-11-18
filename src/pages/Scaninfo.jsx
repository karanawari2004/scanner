import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import "./Scaninfo.css";

const API_URL =
  "https://riztix-backend.onrender.com/api/support/ticket-lookup";

function ScanInfo({ onLogout }) {
  const navigate = useNavigate();

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const processingRef = useRef(false);

  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =====================================
  // DATE FORMAT
  // =====================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // =====================================
  // TICKET LOOKUP API
  // =====================================

  const lookupTicket = async (qrCode, alreadyLocked = false) => {
    if (!qrCode || !qrCode.trim()) {
      setError("Invalid QR code. Please scan again.");
      processingRef.current = false;
      return;
    }

    if (!alreadyLocked && processingRef.current) return;

    processingRef.current = true;

    setLoading(true);
    setError("");
    setMessage("");
    setTicketData(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrCode: qrCode.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Ticket information not found."
        );
      }

      const data = result.data || result.ticketData || result;

      setTicketData(data);
      setMessage("Ticket information loaded successfully.");
    } catch (err) {
      console.error("Ticket lookup error:", err);
      setError(err.message || "Unable to fetch ticket information.");
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  // =====================================
  // STOP SCANNER
  // =====================================

  const stopScanner = async () => {
    const scanner = scannerRef.current;

    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }

        await scanner.clear();
      } catch (err) {
        console.log("Scanner cleanup:", err);
      }

      scannerRef.current = null;
    }

    setCameraActive(false);
  };

  // =====================================
  // START CAMERA
  // =====================================

  const startCamera = async () => {
    if (processingRef.current) return;

    setError("");
    setMessage("");
    setTicketData(null);
    setCameraActive(true);

    requestAnimationFrame(async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
            aspectRatio: 1,
          },
          async (decodedText) => {
            if (processingRef.current) return;

            processingRef.current = true;

            await stopScanner();

            await lookupTicket(decodedText, true);
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera error:", err);

        setError(
          "Unable to open camera. Please allow camera permission and try again."
        );

        await stopScanner();
      }
    });
  };

  // =====================================
  // UPLOAD QR IMAGE
  // =====================================

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (processingRef.current) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      event.target.value = "";
      return;
    }

    processingRef.current = true;

    setError("");
    setMessage("");
    setTicketData(null);
    setLoading(true);

    let imageScanner;

    try {
      imageScanner = new Html5Qrcode("qr-reader-upload");

      const decodedText = await imageScanner.scanFile(file, true);

      try {
        await imageScanner.clear();
      } catch (err) {
        console.log(err);
      }

      await lookupTicket(decodedText, true);
    } catch (err) {
      console.error("Image scanning error:", err);

      setError(
        "QR code not found. Please upload a clear QR image."
      );

      setLoading(false);
      processingRef.current = false;

      if (imageScanner) {
        try {
          await imageScanner.clear();
        } catch (clearError) {
          console.log(clearError);
        }
      }
    }

    event.target.value = "";
  };

  // =====================================
  // RESET
  // =====================================

  const resetTicket = () => {
    setTicketData(null);
    setError("");
    setMessage("");
    setLoading(false);
    processingRef.current = false;

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout = async () => {
    await stopScanner();

    if (onLogout) {
      onLogout();
    } else {
      navigate("/", { replace: true });
    }
  };

  // =====================================
  // CLEANUP
  // =====================================

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop().catch(() => {});
        }

        scanner.clear().catch(() => {});
      }
    };
  }, []);

  // =====================================
  // FULLSCREEN CAMERA
  // =====================================

  if (cameraActive) {
    return (
      <div className="scanner-fullscreen">

        <div className="scanner-top-bar">
          <h2>Scan Ticket QR</h2>

          <button
            className="scanner-back-btn"
            onClick={stopScanner}
          >
            ✕ Close
          </button>
        </div>

        <div className="scanner-content">
          <div id="qr-reader"></div>

          <p className="scanner-instruction">
            Position the ticket QR code inside the scanning box.
          </p>
        </div>

      </div>
    );
  }

  // =====================================
  // MAIN PAGE
  // =====================================

  return (
    <div className="scan-info-page">

      {/* HEADER */}

      <div className="scan-info-header">

        <div className="scan-header-title">
          <h1>Ticket Scanner</h1>
          <p>Scan and view ticket information</p>
        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

      {/* SCANNER CARD */}

      {!ticketData && (
        <div className="scanner-card">

          <div className="scanner-card-heading">
            <h2>Scan Ticket</h2>
            <p>
              Scan a ticket QR code or upload a QR image.
            </p>
          </div>

          <div className="scanner-actions">

            <button
              className="start-scan-btn"
              onClick={startCamera}
              disabled={loading}
            >
              <span>▦</span>
              Open Camera Scanner
            </button>

            <button
              className="upload-scan-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <span>↑</span>
              Upload QR Image
            </button>

          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImageUpload}
            hidden
          />

          <div
            id="qr-reader-upload"
            style={{ display: "none" }}
          />

          {loading && (
            <div className="loading-message">
              <div className="loading-spinner"></div>
              <p>Checking ticket information...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

        </div>
      )}

      {/* =====================================
          SINGLE TICKET INFORMATION CARD
      ===================================== */}

      {ticketData && (
        <div className="ticket-result-wrapper">

          <div className="ticket-main-card">

            {/* EVENT NAME */}

            <div className="ticket-card-header">

              <div className="event-icon">
                ♫
              </div>

              <div className="event-heading">

                <span>EVENT NAME</span>

                <h2>
                  {ticketData.event?.title || "N/A"}
                </h2>

              </div>

            </div>

            {/* SCAN STATUS */}

            <div className="ticket-status-section">

              <span className="detail-label">
                SCAN STATUS
              </span>

              <div
                className={`ticket-status ${
                  ticketData.scanned
                    ? "already-scanned"
                    : "not-scanned"
                }`}
              >
                <span className="status-dot"></span>

                {ticketData.scanned
                  ? "Already Scanned"
                  : "Not Scanned"}
              </div>

            </div>

            {/* SCAN TIME - ONLY IF SCANNED */}

            {ticketData.scanned && ticketData.scannedAt && (
              <div className="event-date-info">
                <div>
                  <span>SCAN TIME</span>

                  <strong>
                    {formatDate(ticketData.scannedAt)}
                  </strong>
                </div>
              </div>
            )}

            {/* TICKET AND USER INFORMATION */}

            <div className="event-date-info">

              <div>
                <span>USERNAME</span>

                <strong>
                  {ticketData.buyer?.name || "N/A"}
                </strong>
              </div>

              <div>
                <span>TICKET ID</span>

                <strong>
                  {ticketData.ticket?.ticketId || "N/A"}
                </strong>
              </div>

              <div>
                <span>USER EMAIL</span>

                <strong>
                  {ticketData.buyer?.email || "N/A"}
                </strong>
              </div>

              <div>
                <span>EVENT DATE</span>

                <strong>
                  {formatDate(ticketData.event?.startDateTime)}
                </strong>
              </div>

            </div>

          </div>

          {/* SCAN ANOTHER TICKET */}

          <button
            className="scan-another-btn"
            onClick={resetTicket}
          >
            ↻ Scan Another Ticket
          </button>

        </div>
      )}

    </div>
  );
}

export default ScanInfo;