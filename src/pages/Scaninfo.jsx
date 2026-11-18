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
  const [scannerFullscreen, setScannerFullscreen] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  

  const lookupTicket = async (qrCode, alreadyLocked = false) => {
    const value = qrCode?.trim();

    if (!value) {
      setError("Invalid QR code. Please scan again.");
      return;
    }

    if (value.length > 4000) {
      setError("Invalid QR code.");
      return;
    }

    if (processingRef.current && !alreadyLocked) return;

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
          qrCode: value,
        }),
      });

      const result = await response.json();

      console.log("QR Code:", value);
      console.log("API Status:", response.status);
      console.log("API Response:", result);

      if (!response.ok || !result?.success || !result?.data) {
        let errorMessage =
          result?.message || "Unable to find ticket.";

        if (response.status === 400) {
          errorMessage = "QR could not be read. Please scan again.";
        } else if (response.status === 404) {
          errorMessage = "Ticket not found.";
        } else if (response.status === 422) {
          errorMessage = "Invalid QR code format.";
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }

        throw new Error(errorMessage);
      }

      setTicketData(result.data);
      setMessage("Ticket information found successfully.");

    } catch (err) {
      console.error("Ticket Lookup Error:", err);

      setError(
        err.message || "Something went wrong. Please try again."
      );

    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  

  const stopScanner = async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      setCameraActive(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.error("Camera stop error:", err);
    }

    try {
      scanner.clear();
    } catch {}

    scannerRef.current = null;
    setCameraActive(false);
  };

  

  const startCamera = async () => {
    if (loading || processingRef.current || cameraActive) return;

    setError("");
    setMessage("");
    setTicketData(null);

    setScannerFullscreen(true);

    try {
      await new Promise((resolve) =>
        requestAnimationFrame(resolve)
      );

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

          setScannerFullscreen(false);

          await lookupTicket(decodedText, true);
        },
        () => {}
      );

      setCameraActive(true);

    } catch (err) {
      console.error("Camera Error:", err);

      scannerRef.current = null;

      setCameraActive(false);
      setScannerFullscreen(false);

      setError(
        err.message || "Unable to access camera."
      );
    }
  };

  

  const closeScanner = async () => {
    await stopScanner();
    setScannerFullscreen(false);
  };

  

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (processingRef.current) {
      event.target.value = "";
      return;
    }

    setError("");
    setMessage("");
    setTicketData(null);
    setScannerFullscreen(false);

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Please upload only PNG or JPG images.");
      event.target.value = "";
      return;
    }

    processingRef.current = true;
    setLoading(true);

    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const scanner = new Html5Qrcode("qr-reader");

      scannerRef.current = scanner;

      const decodedText = await scanner.scanFile(file, false);

      try {
        scanner.clear();
      } catch {}

      scannerRef.current = null;

      setLoading(false);

      await lookupTicket(decodedText, true);

    } catch (err) {
      console.error("QR Image Error:", err);

      setError(
        err.message || "Unable to read QR code from this image."
      );

      setLoading(false);
      processingRef.current = false;

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

  

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  

  const resetTicket = () => {
    setTicketData(null);
    setError("");
    setMessage("");
  };

  

  const handleLogout = async () => {
    await stopScanner();

    if (onLogout) {
      onLogout();
    } else {
      sessionStorage.removeItem("rizzscan_authenticated");
    }

    navigate("/", {
      replace: true,
    });
  };

  

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner) {
        const cleanup = async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }

            scanner.clear();
          } catch {}
        };

        cleanup();
      }
    };
  }, []);

  

  return (
    <div
      className={
        scannerFullscreen
          ? "scan-info-page scanner-fullscreen"
          : "scan-info-page"
      }
    >
      <div className="scan-info-container">

      

        <div className="scan-info-header">
          <div>
            <h2>RizzScan</h2>
            <p>Ticket Information Dashboard</p>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        

        {!ticketData && (
          <div className="scan-lookup-card">

            <h3>Ticket QR Scanner</h3>

            <p>
              Scan a ticket QR code using your camera
              or upload a QR image to view ticket information.
            </p>

            

            <div className="scanner-actions">

              <button
                className="camera-btn"
                onClick={startCamera}
                disabled={loading || cameraActive}
              >
                {cameraActive
                  ? "Camera Active"
                  : "Start Camera Scan"}
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

              {scannerFullscreen && (
                <button
                  className="stop-camera-btn"
                  onClick={closeScanner}
                >
                  Close Scanner
                </button>
              )}

            </div>

          

            <div
              id="qr-reader"
              className="qr-reader"
            />

        

            {loading && (
              <p className="loading-message">
                Checking ticket information...
              </p>
            )}

        

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

        

            {message && (
              <p className="success-message">
                {message}
              </p>
            )}

          </div>
        )}

        

        {ticketData && (
          <div className="details-card">

            <div className="details-card-header">

              <h3>Ticket Information</h3>

              <span
                className={`ticket-status ${
                  ticketData.scanned
                    ? "already-scanned"
                    : "not-scanned"
                }`}
              >
                {ticketData.scanned
                  ? "Already Scanned"
                  : "Not Scanned Yet"}
              </span>

            </div>

            <div className="ticket-details-list">

        

              <div className="ticket-detail-row">
                <span>Event Name</span>
                <strong>
                  {ticketData.event?.title || "N/A"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>Event ID</span>
                <strong>
                  {ticketData.event?.eventId || "N/A"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>Event Date</span>
                <strong>
                  {formatDate(ticketData.event?.startDateTime)}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>Event End Date</span>
                <strong>
                  {formatDate(ticketData.event?.endDateTime)}
                </strong>
              </div>

              

              <div className="ticket-detail-row">
                <span>Scan Status</span>
                <strong>
                  {ticketData.scanned
                    ? "Already Scanned"
                    : "Not Scanned Yet"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>Entry Status</span>
                <strong>
                  {ticketData.entryStatus || "N/A"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>Scan Time</span>
                <strong>
                  {ticketData.scanned
                    ? formatDate(ticketData.scannedAt)
                    : "N/A"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>Scanned Gate ID</span>
                <strong>
                  {ticketData.scannedGateId || "N/A"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>Scanned Device ID</span>
                <strong>
                  {ticketData.scannedDeviceId || "N/A"}
                </strong>
              </div>

          

              <div className="ticket-detail-row">
                <span>Ticket ID</span>
                <strong>
                  {ticketData.ticket?.ticketId || "N/A"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>Booking Reference</span>
                <strong>
                  {ticketData.ticket?.bookingRef || "N/A"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>Ticket Type</span>
                <strong>
                  {ticketData.ticket?.ticketType || "N/A"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>Order Status</span>
                <strong>
                  {ticketData.ticket?.orderStatus || "N/A"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>Ticket Amount</span>
                <strong>
                  {ticketData.ticket?.currency || "INR"}{" "}
                  {ticketData.ticket?.amount ?? "N/A"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>Purchase Date</span>
                <strong>
                  {formatDate(ticketData.ticket?.purchasedAt)}
                </strong>
              </div>

              

              <div className="ticket-detail-row">
                <span>User Name</span>
                <strong>
                  {ticketData.buyer?.name || "N/A"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>User Email</span>
                <strong>
                  {ticketData.buyer?.email || "N/A"}
                </strong>
              </div>

              <div className="ticket-detail-row">
                <span>User Phone</span>
                <strong>
                  {ticketData.buyer?.phone || "N/A"}
                </strong>
              </div>

            </div>

          

            <button
              className="camera-btn scan-another-btn"
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