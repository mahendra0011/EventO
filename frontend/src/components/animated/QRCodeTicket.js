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

  const ticketId = booking?._id || `TICKET-${Date.now()}`;
  const shortTicketId = String(ticketId).slice(-12).toUpperCase();
  const ticketCategoryName = booking?.ticketCategoryName || 'General';
  const ticketCategoryId = booking?.ticketCategoryId;
  const ticketPrice = Number(booking?.ticketPrice || event?.price || 0);
  const totalPrice = Number(booking?.totalPrice || event?.price || 0);
  const attendeeName = user?.name || booking?.user?.name || 'Guest';

  const qrData = JSON.stringify({
    ticketId,
    eventId: event?._id,
    eventTitle: event?.title,
    userId: user?.id || user?._id || booking?.user?._id,
    userName: attendeeName,
    ticketCategoryId,
    ticketCategoryName,
    ticketPrice,
    numberOfTickets: booking?.numberOfTickets || 1,
    totalPrice,
    bookingDate: booking?.bookingDate || booking?.createdAt || new Date().toISOString(),
    status: booking?.status || 'confirmed'
  });

  const ticketStatus = booking?.status || 'confirmed';
  const ticketStatusLabel = {
    confirmed: 'Confirmed',
    pending: 'Pending',
    cancelled: 'Cancelled',
    rejected: 'Rejected'
  }[ticketStatus] || 'Pending';

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
    navigator.clipboard?.writeText(String(ticketId));
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
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 p-6 text-white">
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-16 -translate-y-16 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-12 translate-y-12 rounded-full bg-white/10" />

        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                <Ticket className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Evento E-Ticket</h3>
                <p className="text-sm text-primary-100">Digital Entry Pass</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur-sm"
            >
              {ticketStatusLabel}
            </motion.div>
          </div>

          <motion.h2
            className="mb-2 text-2xl font-bold"
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

      <div className="bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="flex flex-col items-center gap-6 lg:flex-row">
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 opacity-30 blur-xl" />
              <div className="relative rounded-lg border-2 border-primary-100 bg-white p-4 shadow-xl">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={qrData}
                  size={180}
                  level="H"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#1e293b"
                  imageSettings={{
                    src: '/favicon.ico',
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true
                  }}
                />
              </div>
            </div>

            <motion.p
              className="mt-3 text-center text-sm text-cocoa-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Scan at event entry
            </motion.p>
          </motion.div>

          <div className="w-full flex-grow">
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-lg bg-[#f3eee9] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase text-cocoa-400">Ticket ID</p>
                        <p className="font-mono text-lg font-bold text-cocoa-900">{shortTicketId}</p>
                      </div>
                      <motion.button
                        onClick={handleCopyTicketId}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="rounded-lg p-2 transition-colors hover:bg-primary-50"
                        title="Copy ticket ID"
                      >
                        {copied ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5 text-cocoa-500" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-[#fbf8f4] p-3">
                      <div className="mb-1 flex items-center gap-2 text-cocoa-500">
                        <User className="h-4 w-4" />
                        <span className="text-xs uppercase">Attendee</span>
                      </div>
                      <p className="font-semibold text-cocoa-900">{attendeeName}</p>
                    </div>
                    <div className="rounded-lg bg-[#fbf8f4] p-3">
                      <div className="mb-1 flex items-center gap-2 text-cocoa-500">
                        <Ticket className="h-4 w-4" />
                        <span className="text-xs uppercase">Tickets</span>
                      </div>
                      <p className="font-semibold text-cocoa-900">{booking?.numberOfTickets || 1}</p>
                    </div>
                    <div className="rounded-lg bg-[#fbf8f4] p-3">
                      <div className="mb-1 flex items-center gap-2 text-cocoa-500">
                        <Ticket className="h-4 w-4" />
                        <span className="text-xs uppercase">Category</span>
                      </div>
                      <p className="font-semibold text-cocoa-900">{ticketCategoryName}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-primary-100 bg-gradient-to-r from-primary-50 to-secondary-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-cocoa-500">Total Paid</span>
                        {ticketPrice > 0 && (
                          <p className="mt-1 text-sm font-semibold text-cocoa-500">
                            Rs. {ticketPrice.toLocaleString('en-IN')} per ticket
                          </p>
                        )}
                      </div>
                      <span className="text-2xl font-bold text-primary-600">
                        Rs. {totalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 flex gap-3">
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={handleDownloadQR}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
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

      <div className="border-t border-cocoa-100 bg-[#fbf8f4] px-6 py-4 text-cocoa-700">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500">
              <Ticket className="h-4 w-4" />
            </div>
            <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text font-bold text-transparent">
              Evento
            </span>
          </div>
          <p className="text-center text-sm text-cocoa-400">
            {ticketStatus === 'cancelled'
              ? 'This ticket has been cancelled and is no longer valid for entry.'
              : `Present this QR code at the venue for entry. Valid for ${booking?.numberOfTickets || 1} person(s).`}
          </p>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default QRCodeTicket;
