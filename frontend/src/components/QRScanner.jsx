import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

function QRScanner({ onScan }) {

    const scannerRef = useRef(null);
    const isScanningRef = useRef(false);

    useEffect(() => {

        let mounted = true;

        const startScanner = async () => {

            try {

                const scanner =
                    new Html5Qrcode("qr-reader");

                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },

                    {
                        fps: 10,
                        qrbox: {
                            width: 250,
                            height: 250
                        }
                    },

                    (decodedText) => {

                        if (!mounted) {
                            return;
                        }

                        console.log(
                            "QR scanned:",
                            decodedText
                        );

                        onScan(decodedText);

                        if (
                            scannerRef.current &&
                            isScanningRef.current
                        ) {

                            scannerRef.current
                                .stop()
                                .then(() => {
                                    isScanningRef.current = false;
                                })
                                .catch((error) => {
                                    console.error(
                                        "Scanner stop error:",
                                        error
                                    );
                                });
                        }

                    },

                    () => {
                        // QR scanning in progress
                    }
                );

                isScanningRef.current = true;

                console.log(
                    "QR Scanner started"
                );

            } catch (error) {

                console.error(
                    "QR Scanner start error:",
                    error
                );

            }
        };

        startScanner();

        return () => {

            mounted = false;

            if (
                scannerRef.current &&
                isScanningRef.current
            ) {

                scannerRef.current
                    .stop()
                    .then(() => {

                        isScanningRef.current =
                            false;

                    })
                    .catch((error) => {

                        console.error(
                            "QR Scanner cleanup error:",
                            error
                        );

                    });

            }

        };

    }, [onScan]);


    return (
        <div className="booking-panel">

            <div className="admin-section-header">

                <div>

                    <p className="page-label">
                        BOOKING VERIFICATION
                    </p>

                    <h2>
                        📱 Scan Booking QR
                    </h2>

                    <p>
                        Scan a user's booking QR code
                        to verify their reservation.
                    </p>

                </div>

            </div>

            <div className="qr-scanner-container">

                <div
                    id="qr-reader"
                    className="qr-reader"
                ></div>

                <p className="qr-scanner-help">
                    📱 Point the camera at a
                    booking QR code
                </p>

            </div>

        </div>
    );
}

export default QRScanner;