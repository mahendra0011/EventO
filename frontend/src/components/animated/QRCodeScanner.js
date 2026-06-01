import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle, XCircle, Ticket, User, Calendar } from 'lucide-react';
import AnimatedButton from './AnimatedButton';
import AnimatedCard from './AnimatedCard';
import GradientText from './GradientText';

const QRCodeScanner = ({
  onScanSuccess,
  onValidateTicket,
  className = ''
}) => {
  const [scanning, setScanning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const buildDisplayData = (qrPayload = {}, validationPayload = {}) => {
    const ticket = validationPayload.ticket || validationPayload.booking || {};

    return {
      ...qrPayload,
      ...ticket,
      eventTitle: ticket.event?.title || qrPayload.eventTitle,
      userName: ticket.attendee?.name || qrPayload.userName,
      numberOfTickets: ticket.numberOfTickets || qrPayload.numberOfTickets,
      ticketCategoryName: ticket.ticketCategoryName || qrPayload.ticketCategoryName || 'General',
      checkedInAt: ticket.checkedInAt,
      ticketId: ticket.ticketId || ticket.bookingId || qrPayload.ticketId
    };
  };

  const handleScan = async (detectedCodes) => {
    if (validating || scanResult || !detectedCodes?.length) return;

    let parsedData;

    try {
      parsedData = JSON.parse(detectedCodes[0].rawValue);
      setScanning(false);
      setValidating(true);

      if (onValidateTicket) {
        const validation = await onValidateTicket(parsedData);

        setScanResult({
          success: validation?.entryApproved !== false,
          data: buildDisplayData(parsedData, validation),
          message: validation?.message || 'Ticket validated. Entry approved.',
          timestamp: new Date().toISOString()
        });

        if (onScanSuccess) {
          onScanSuccess(parsedData, validation);
        }
      } else {
        setScanResult({
          success: true,
          data: parsedData,
          message: 'Ticket scanned.',
          timestamp: new Date().toISOString()
        });

        if (onScanSuccess) {
          onScanSuccess(parsedData);
        }
      }
    } catch (err) {
      const message = err instanceof SyntaxError
        ? 'Invalid QR code format'
        : err.response?.data?.message || err.message || 'Unable to verify ticket';

      setError(message);
      setScanning(false);
      setScanResult({
        success: false,
        error: message,
        alreadyCheckedIn: Boolean(err.response?.data?.alreadyCheckedIn),
        data: parsedData ? buildDisplayData(parsedData, err.response?.data) : null
      });
    } finally {
      setValidating(false);
    }
  };

  const handleCameraError = (err) => {
    console.error('QR Scanner Error:', err);
    setError('Camera access denied or not available');
    setScanResult({
      success: false,
      error: 'Camera access denied or not available'
    });
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setScanning(false);
    setValidating(false);
  };

  return (
    <AnimatedCard className={`overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">QR Code Scanner</h3>
            <p className="text-sm text-primary-100">Validate tickets for event entry</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {!scanning && !scanResult && !validating && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-8 text-center"
            >
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#f3eee9]">
                <Ticket className="h-12 w-12 text-cocoa-300" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-cocoa-900">Ready to Scan</h4>
              <p className="mb-6 text-cocoa-500">Scan attendee tickets at the entry gate.</p>
              <AnimatedButton
                variant="primary"
                size="lg"
                onClick={() => setScanning(true)}
              >
                <Camera className="mr-2 h-5 w-5" />
                Start Scanning
              </AnimatedButton>
            </motion.div>
          )}

          {scanning && !scanResult && !validating && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-lg border-4 border-primary-200 shadow-xl">
                <Scanner
                  onScan={handleScan}
                  onError={handleCameraError}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: { width: '100%', height: '100%', objectFit: 'cover' }
                  }}
                />

                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-0 rounded-lg border-2 border-primary-500/50" />
                  <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="h-48 w-48 rounded-lg border-4 border-primary-500" />
                  </motion.div>
                </div>
              </div>

              <div className="text-center">
                <motion.p
                  className="text-cocoa-500"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Point camera at QR code
                </motion.p>
                <AnimatedButton
                  variant="outline"
                  size="sm"
                  onClick={() => setScanning(false)}
                  className="mt-4"
                >
                  Cancel
                </AnimatedButton>
              </div>
            </motion.div>
          )}

          {validating && !scanResult && (
            <motion.div
              key="validating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-10 text-center"
            >
              <motion.div
                className="mx-auto mb-5 h-16 w-16 rounded-full border-4 border-primary-100 border-t-primary-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <h4 className="text-lg font-semibold text-cocoa-900">Validating Ticket</h4>
              <p className="mt-2 text-sm text-cocoa-500">Checking booking status and entry history.</p>
            </motion.div>
          )}

          {scanResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {scanResult.success ? (
                <>
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
                    >
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </motion.div>
                    <h4 className="mb-2 text-2xl font-bold text-green-600">
                      <GradientText gradient="from-green-500 to-emerald-500">
                        Valid Ticket
                      </GradientText>
                    </h4>
                    <p className="text-cocoa-500">Entry approved</p>
                    {scanResult.message && (
                      <p className="mt-1 text-sm text-cocoa-400">{scanResult.message}</p>
                    )}
                  </div>

                  <div className="space-y-4 rounded-lg bg-[#fbf8f4] p-6">
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-xs uppercase text-cocoa-400">Event</p>
                        <p className="font-semibold text-cocoa-900">{scanResult.data.eventTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-xs uppercase text-cocoa-400">Attendee</p>
                        <p className="font-semibold text-cocoa-900">{scanResult.data.userName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-xs uppercase text-cocoa-400">Tickets</p>
                        <p className="font-semibold text-cocoa-900">
                          {scanResult.data.numberOfTickets} {scanResult.data.ticketCategoryName ? `- ${scanResult.data.ticketCategoryName}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-xs uppercase text-cocoa-400">Ticket ID</p>
                        <p className="font-mono font-semibold text-cocoa-900">
                          {scanResult.data.ticketId?.slice(-12).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {scanResult.data.checkedInAt && (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary-600" />
                        <div>
                          <p className="text-xs uppercase text-cocoa-400">Checked In</p>
                          <p className="font-semibold text-cocoa-900">
                            {new Date(scanResult.data.checkedInAt).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <AnimatedButton
                    variant="primary"
                    size="lg"
                    onClick={resetScanner}
                    className="w-full"
                  >
                    Scan Another Ticket
                  </AnimatedButton>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100"
                    >
                      <XCircle className="h-12 w-12 text-red-600" />
                    </motion.div>
                    <h4 className="mb-2 text-2xl font-bold text-red-600">
                      <GradientText gradient="from-red-500 to-orange-500">
                        {scanResult.alreadyCheckedIn ? 'Already Checked In' : 'Invalid Ticket'}
                      </GradientText>
                    </h4>
                    <p className="text-cocoa-500">{scanResult.error || error || 'Unable to verify ticket'}</p>
                  </div>

                  {scanResult.data && (
                    <div className="rounded-lg bg-[#fbf8f4] p-5 text-sm text-cocoa-600">
                      <div className="flex items-center justify-between gap-4">
                        <span>Ticket</span>
                        <span className="font-mono font-bold text-cocoa-900">
                          {scanResult.data.ticketId?.slice(-12).toUpperCase()}
                        </span>
                      </div>
                      {scanResult.data.eventTitle && (
                        <div className="mt-2 flex items-center justify-between gap-4">
                          <span>Event</span>
                          <span className="font-bold text-cocoa-900">{scanResult.data.eventTitle}</span>
                        </div>
                      )}
                      {scanResult.data.userName && (
                        <div className="mt-2 flex items-center justify-between gap-4">
                          <span>Attendee</span>
                          <span className="font-bold text-cocoa-900">{scanResult.data.userName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <AnimatedButton
                    variant="primary"
                    size="lg"
                    onClick={resetScanner}
                    className="w-full"
                  >
                    Try Again
                  </AnimatedButton>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-cocoa-100 bg-[#fbf8f4] px-6 py-4 text-cocoa-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500">
              <Ticket className="h-4 w-4" />
            </div>
            <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text font-bold text-transparent">
              Evento
            </span>
          </div>
          <p className="text-sm text-cocoa-400">Event Entry System</p>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default QRCodeScanner;
