import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import "./Scaninfo.css";

function ScanInfo() {
  const navigate = useNavigate();

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const processingRef = useRef(false);

  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Ticket Lookup API
  const lookupTicket = async (decodedText) => {
    if (!decodedText?.trim()) {
      setError("QR code could not be read.");
      return;
    }

    if (decodedText.length > 4000) {
      setError("QR code is too long.");
      return;
    }

    if (processingRef.current) return;

    processingRef.current = true;
    setLoading(true);
    setError("");
    setMessage("");
    setTicketData(null);

    try {
      const response = await fetch(
        "https://riztix-backend.onrender.com/api/support/ticket-lookup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            qrCode: decodedText.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Ticket lookup failed.");
      }

      setTicketData(result.data);
      setMessage("Ticket found successfully.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  // Stop Camera
  const stopScanner = async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      setCameraActive(false);
      return;
    }

    try {
      await scanner.stop();
    } catch {}

    try {
      scanner.clear();
    } catch {}

    scannerRef.current = null;
    setCameraActive(false);
  };

  // Start Camera Scanner
  const startCamera = async () => {
    setError("");
    setMessage("");
    setTicketData(null);

    if (scannerRef.current) {
      await stopScanner();
    }

    try {
      const scanner = new Html5Qrcode("qr-reader");

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (processingRef.current) return;

          await stopScanner();
          await lookupTicket(decodedText);
        },
        () => {}
      );

      setCameraActive(true);
    } catch (err) {
      scannerRef.current = null;
      setCameraActive(false);
      setError(err.message || "Unable to access camera.");
    }
  };

  // Upload and Decode QR Image
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");
    setTicketData(null);

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Please upload only PNG or JPG images.");
      event.target.value = "";
      return;
    }

    try {
      setLoading(true);

      if (scannerRef.current) {
        await stopScanner();
      }

      const scanner = new Html5Qrcode("qr-reader");

      scannerRef.current = scanner;

      const decodedText = await scanner.scanFile(file, false);

      scanner.clear();
      scannerRef.current = null;

      await lookupTicket(decodedText);
    } catch (err) {
      setError(err.message || "Unable to decode QR code.");
      setLoading(false);
    } finally {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {}

        scannerRef.current = null;
      }

      event.target.value = "";
    }
  };

  // Format Date
  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Reset
  const resetTicket = () => {
    setTicketData(null);
    setError("");
    setMessage("");
  };

  // Logout
  const handleLogout = async () => {
    await stopScanner();
    navigate("/", { replace: true });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner) {
        scanner.stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, []);

  return (
    <div className="scan-info-page">
      <div className="scan-info-container">

        <div className="scan-info-header">
          <div>
            <h2>RizzScan</h2>
            <p>Ticket Information Dashboard</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* QR Scanner */}
        <div className="scan-lookup-card">
          <h3>Ticket QR Scanner</h3>

          <p>Scan a ticket using your camera or upload a QR image.</p>

          <div className="scanner-actions">
            <button
              className="camera-btn"
              onClick={startCamera}
              disabled={loading || cameraActive}
            >
              Start Camera Scan
            </button>

            <button
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Upload QR Image
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleImageUpload}
              hidden
            />

            {cameraActive && (
              <button
                className="stop-camera-btn"
                onClick={stopScanner}
              >
                Stop Camera
              </button>
            )}
          </div>

          <div id="qr-reader" className="qr-reader" />

          {loading && (
            <p className="loading-message">
              Checking ticket information...
            </p>
          )}

          {error && (
            <p className="error-message">{error}</p>
          )}

          {message && (
            <p className="success-message">{message}</p>
          )}
        </div>

        {/* Ticket Details */}
        {ticketData && (
          <div className="details-card">
            <h3>Ticket Information</h3>

            <div className="ticket-status-grid">

              <div className="status-tile">
                <span>Buyer Name</span>
                <h3>{ticketData.buyer?.name || "N/A"}</h3>
              </div>

              <div className="status-tile">
                <span>Phone</span>
                <h3>{ticketData.buyer?.phone || "N/A"}</h3>
              </div>

              <div className="status-tile">
                <span>Email</span>
                <h3>{ticketData.buyer?.email || "N/A"}</h3>
              </div>

              <div className="status-tile">
                <span>Event Name</span>
                <h3>{ticketData.event?.title || "N/A"}</h3>
              </div>

              <div className="status-tile">
                <span>Ticket ID</span>
                <h3>{ticketData.ticket?.ticketId || "N/A"}</h3>
              </div>

              <div className="status-tile">
                <span>Booking Reference</span>
                <h3>{ticketData.ticket?.bookingRef || "N/A"}</h3>
              </div>

              <div className="status-tile">
                <span>Ticket Type</span>
                <h3>{ticketData.ticket?.ticketType || "N/A"}</h3>
              </div>

              <div className="status-tile">
                <span>Order Status</span>
                <h3>{ticketData.ticket?.orderStatus || "N/A"}</h3>
              </div>

              <div className="status-tile">
                <span>Amount</span>
                <h3>
                  {ticketData.ticket?.currency || "INR"}{" "}
                  {ticketData.ticket?.amount ?? "N/A"}
                </h3>
              </div>

              <div className="status-tile">
                <span>Event Start</span>
                <h3>{formatDate(ticketData.event?.startDateTime)}</h3>
              </div>

              <div className="status-tile">
                <span>Event End</span>
                <h3>{formatDate(ticketData.event?.endDateTime)}</h3>
              </div>

              <div className="status-tile">
                <span>Ticket Status</span>
                <h3
                  className={
                    ticketData.scanned
                      ? "already-scanned"
                      : "not-scanned"
                  }
                >
                  {ticketData.scanned
                    ? "Already Scanned"
                    : "Not Scanned Yet"}
                </h3>
              </div>

            </div>

            {/* Scan Details */}
            {ticketData.scanned && (
              <div className="scan-details">
                <h3>Scan Details</h3>

                <p>
                  <strong>Scanned At:</strong>{" "}
                  {formatDate(ticketData.scannedAt)}
                </p>

                <p>
                  <strong>Gate ID:</strong>{" "}
                  {ticketData.scannedGateId || "N/A"}
                </p>

                <p>
                  <strong>Device ID:</strong>{" "}
                  {ticketData.scannedDeviceId || "N/A"}
                </p>
              </div>
            )}

            <button
              className="camera-btn"
              onClick={resetTicket}
            >
              Scan Another Ticket
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default ScanInfo;