import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle, XCircle, AlertCircle, Ticket, User, Calendar, MapPin } from 'lucide-react';
import AnimatedButton from './AnimatedButton';
import AnimatedCard from './AnimatedCard';
import GradientText from './GradientText';

const QRCodeScanner = ({ 
  onScanSuccess,
  className = '' 
}) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      try {
        const data = detectedCodes[0].rawValue;
        const parsedData = JSON.parse(data);
        
        setScanResult({
          success: true,
          data: parsedData,
          timestamp: new Date().toISOString()
        });
        
        setScanning(false);
        
        if (onScanSuccess) {
          onScanSuccess(parsedData);
        }
      } catch (err) {
        setError('Invalid QR code format');
        setScanResult({
          success: false,
          error: 'Invalid QR code format'
        });
      }
    }
  };

  const handleError = (error) => {
    console.error('QR Scanner Error:', error);
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
  };

  return (
    <AnimatedCard className={`overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">QR Code Scanner</h3>
            <p className="text-primary-100 text-sm">Scan ticket for event entry</p>
          </div>
        </div>
      </div>

      {/* Scanner Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {!scanning && !scanResult && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8"
            >
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Ticket className="h-12 w-12 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Scan</h4>
              <p className="text-gray-600 mb-6">
                Click the button below to start scanning QR codes
              </p>
              <AnimatedButton
                variant="primary"
                size="lg"
                onClick={() => setScanning(true)}
              >
                <Camera className="h-5 w-5 mr-2" />
                Start Scanning
              </AnimatedButton>
            </motion.div>
          )}

          {scanning && !scanResult && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <div className="relative aspect-square max-w-md mx-auto overflow-hidden rounded-2xl border-4 border-primary-200 shadow-xl">
                <Scanner
                  onScan={handleScan}
                  onError={handleError}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: { width: '100%', height: '100%', objectFit: 'cover' }
                  }}
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-primary-500/50 rounded-2xl"></div>
                  <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-48 h-48 border-4 border-primary-500 rounded-2xl"></div>
                  </motion.div>
                </div>
              </div>

              <div className="text-center">
                <motion.p
                  className="text-gray-600"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  📱 Point camera at QR code
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
                  {/* Success State */}
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4"
                    >
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </motion.div>
                    <h4 className="text-2xl font-bold text-green-600 mb-2">
                      <GradientText gradient="from-green-500 to-emerald-500">
                        Valid Ticket!
                      </GradientText>
                    </h4>
                    <p className="text-gray-600">Entry approved</p>
                  </div>

                  {/* Ticket Details */}
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Event</p>
                        <p className="font-semibold text-gray-900">{scanResult.data.eventTitle}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Attendee</p>
                        <p className="font-semibold text-gray-900">{scanResult.data.userName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Tickets</p>
                        <p className="font-semibold text-gray-900">{scanResult.data.numberOfTickets}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Ticket ID</p>
                        <p className="font-mono font-semibold text-gray-900">
                          {scanResult.data.ticketId?.slice(-12).toUpperCase()}
                        </p>
                      </div>
                    </div>
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
                  {/* Error State */}
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4"
                    >
                      <XCircle className="h-12 w-12 text-red-600" />
                    </motion.div>
                    <h4 className="text-2xl font-bold text-red-600 mb-2">
                      <GradientText gradient="from-red-500 to-orange-500">
                        Invalid Ticket
                      </GradientText>
                    </h4>
                    <p className="text-gray-600">{scanResult.error || 'Unable to verify ticket'}</p>
                  </div>

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

      {/* Footer */}
      <div className="bg-gray-900 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Ticket className="h-4 w-4" />
            </div>
            <span className="font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Evento
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Event Entry System
          </p>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default QRCodeScanner;
