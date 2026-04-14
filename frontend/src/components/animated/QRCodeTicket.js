import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, Check, Ticket, Calendar, MapPin, Clock, User } from 'lucide-react';
import AnimatedButton from './AnimatedButton';
import AnimatedCard from './AnimatedCard';

const QRCodeTicket = ({ 
  booking, 
  event, 
  user,
  className = '' 
}) => {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  // Generate unique ticket ID
  const ticketId = booking?._id || `TICKET-${Date.now()}`;
  
  // QR code data -包含所有必要信息
  const qrData = JSON.stringify({
    ticketId: ticketId,
    eventId: event?._id,
    eventTitle: event?.title,
    userId: user?.id,
    userName: user?.name,
    numberOfTickets: booking?.numberOfTickets || 1,
    totalPrice: booking?.totalPrice || event?.price,
    bookingDate: booking?.createdAt || new Date().toISOString(),
    status: booking?.status || 'confirmed'
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCopyTicketId = () => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `evento-ticket-${ticketId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <AnimatedCard className={`overflow-hidden ${className}`} delay={0.2}>
      {/* Ticket Header */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 p-6 text-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Ticket className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Evento E-Ticket</h3>
                <p className="text-primary-100 text-sm">Digital Entry Pass</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm"
            >
              {booking?.status === 'confirmed' ? '✓ Confirmed' : 'Pending'}
            </motion.div>
          </div>

          <motion.h2 
            className="text-2xl font-bold mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {event?.title || 'Event Ticket'}
          </motion.h2>
          
          <motion.div 
            className="flex flex-wrap gap-4 text-sm text-primary-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event?.date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{event?.time}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{event?.venue}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* QR Code */}
          <motion.div 
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur-xl opacity-30"></div>
              <div className="relative bg-white p-4 rounded-2xl shadow-xl border-2 border-primary-100">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={qrData}
                  size={180}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#1e293b"
                  imageSettings={{
                    src: '/favicon.ico',
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              </div>
            </div>
            
            {/* Scan Instruction */}
            <motion.p 
              className="text-center text-sm text-gray-500 mt-3"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              📱 Scan at event entry
            </motion.p>
          </motion.div>

          {/* Ticket Details */}
          <div className="flex-grow w-full">
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Ticket ID */}
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Ticket ID</p>
                        <p className="font-mono font-bold text-gray-900 text-lg">{ticketId.slice(-12).toUpperCase()}</p>
                      </div>
                      <motion.button
                        onClick={handleCopyTicketId}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5 text-gray-600" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Attendee Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <User className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wide">Attendee</span>
                      </div>
                      <p className="font-semibold text-gray-900">{user?.name || 'Guest'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Ticket className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wide">Tickets</span>
                      </div>
                      <p className="font-semibold text-gray-900">{booking?.numberOfTickets || 1}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4 border border-primary-100">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Paid</span>
                      <span className="text-2xl font-bold text-primary-600">
                        ₹{(booking?.totalPrice || event?.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={handleDownloadQR}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </AnimatedButton>
              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="flex-1"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Footer */}
      <div className="bg-gray-900 px-6 py-4 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Ticket className="h-4 w-4" />
            </div>
            <span className="font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Evento
            </span>
          </div>
          <p className="text-gray-400 text-sm text-center">
            Present this QR code at the venue for entry • Valid for {booking?.numberOfTickets || 1} person(s)
          </p>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default QRCodeTicket;
