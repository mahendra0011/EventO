import React from 'react';
import { CheckCircle, Clock, RefreshCw, XCircle } from 'lucide-react';

const statusStyles = {
  requested: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  processed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const statusIcons = {
  requested: Clock,
  approved: CheckCircle,
  processing: RefreshCw,
  processed: CheckCircle,
  rejected: XCircle
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const RefundTimeline = ({ booking, compact = false }) => {
  const timeline = booking?.refundTimeline || [];
  const hasRefund = booking?.refundStatus && booking.refundStatus !== 'none';

  if (!hasRefund && timeline.length === 0 && !booking?.refundPolicy?.status) return null;

  return (
    <div className={`rounded-lg border border-cocoa-100 bg-[#fbf8f4] ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-cocoa-900">Refund timeline</p>
          {booking?.refundPolicy?.label && (
            <p className="text-xs font-semibold text-cocoa-500">
              {booking.refundPolicy.label} / Rs. {Number(booking.refundAmount || booking.refundPolicy.refundableAmount || 0).toLocaleString('en-IN')}
            </p>
          )}
        </div>
        {hasRefund && (
          <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[booking.refundStatus] || statusStyles.requested}`}>
            {booking.refundStatus}
          </span>
        )}
      </div>

      {booking?.refundPolicy?.reason && (
        <p className="mt-3 text-xs font-semibold text-cocoa-500">{booking.refundPolicy.reason}</p>
      )}

      {timeline.length > 0 && (
        <div className="mt-3 space-y-2">
          {timeline.map((item, index) => {
            const Icon = statusIcons[item.status] || Clock;
            return (
              <div key={`${item.status}-${item.at || index}`} className="flex gap-3">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${statusStyles[item.status] || statusStyles.requested}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold capitalize text-cocoa-900">{item.status}</p>
                  {item.message && <p className="text-xs font-semibold text-cocoa-500">{item.message}</p>}
                  <p className="text-xs text-cocoa-400">{formatDateTime(item.at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RefundTimeline;
