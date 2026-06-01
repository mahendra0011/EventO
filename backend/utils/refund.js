const REFUND_STATUSES = ['none', 'requested', 'approved', 'processing', 'processed', 'rejected'];

const roundMoney = (value) => Math.max(0, Math.round(Number(value || 0) * 100) / 100);

const parseEventDateTime = (event) => {
  if (!event?.date) return null;

  const eventDate = new Date(event.date);
  if (Number.isNaN(eventDate.getTime())) return null;

  const timeText = String(event.time || '').trim();
  const match = timeText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);

  if (match) {
    let hours = Number(match[1]);
    const minutes = Number(match[2] || 0);
    const meridiem = match[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    eventDate.setHours(hours, minutes, 0, 0);
  } else {
    eventDate.setHours(0, 0, 0, 0);
  }

  return eventDate;
};

const evaluateRefundPolicy = (booking, event, now = new Date()) => {
  const eventStart = parseEventDateTime(event);
  const totalPrice = roundMoney(booking?.totalPrice);
  const checkedIn = booking?.checkInStatus === 'checked_in' || Boolean(booking?.checkedInAt);

  if (checkedIn) {
    return {
      status: 'blocked',
      label: 'Blocked',
      canCancel: false,
      canRefund: false,
      refundPercent: 0,
      refundableAmount: 0,
      hoursBeforeEvent: null,
      reason: 'Ticket is already checked in, so cancellation and refund are blocked.',
      evaluatedAt: now
    };
  }

  if (eventStart && eventStart <= now) {
    return {
      status: 'blocked',
      label: 'Blocked',
      canCancel: false,
      canRefund: false,
      refundPercent: 0,
      refundableAmount: 0,
      hoursBeforeEvent: 0,
      reason: 'Event has already started, so cancellation and refund are blocked.',
      evaluatedAt: now
    };
  }

  const hoursBeforeEvent = eventStart
    ? Math.max(0, (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60))
    : null;

  if (!totalPrice || booking?.paymentStatus !== 'completed') {
    return {
      status: 'none',
      label: 'No paid refund',
      canCancel: true,
      canRefund: false,
      refundPercent: 0,
      refundableAmount: 0,
      hoursBeforeEvent,
      reason: 'No completed paid amount is available for refund.',
      evaluatedAt: now
    };
  }

  if (hoursBeforeEvent === null || hoursBeforeEvent >= 48) {
    return {
      status: 'full',
      label: 'Full refund',
      canCancel: true,
      canRefund: true,
      refundPercent: 100,
      refundableAmount: totalPrice,
      hoursBeforeEvent,
      reason: 'Cancellation is 48 hours or more before event start.',
      evaluatedAt: now
    };
  }

  if (hoursBeforeEvent >= 24) {
    return {
      status: 'partial',
      label: 'Partial refund',
      canCancel: true,
      canRefund: true,
      refundPercent: 50,
      refundableAmount: roundMoney(totalPrice * 0.5),
      hoursBeforeEvent,
      reason: 'Cancellation is 24 to 48 hours before event start.',
      evaluatedAt: now
    };
  }

  return {
    status: 'none',
    label: 'No refund',
    canCancel: true,
    canRefund: false,
    refundPercent: 0,
    refundableAmount: 0,
    hoursBeforeEvent,
    reason: 'Cancellation is less than 24 hours before event start.',
    evaluatedAt: now
  };
};

const normalizeRefundDestination = (input = {}, requireDestination = true) => {
  const payoutMethod = input.payoutMethod === 'upi' || input.upiId ? 'upi' : 'bank';
  const accountHolderName = String(input.accountHolderName || '').trim();
  const accountNumber = String(input.accountNumber || '').replace(/\s+/g, '').trim();
  const ifsc = String(input.ifsc || '').trim().toUpperCase();
  const bankName = String(input.bankName || '').trim();
  const upiId = String(input.upiId || '').trim();

  if (!requireDestination) {
    return undefined;
  }

  if (payoutMethod === 'upi') {
    if (!upiId || !/^[\w.-]+@[\w.-]+$/.test(upiId)) {
      const error = new Error('Valid UPI ID is required for refund payout');
      error.statusCode = 400;
      throw error;
    }

    return {
      payoutMethod,
      upiId
    };
  }

  if (!accountHolderName || !accountNumber || !ifsc) {
    const error = new Error('Account holder name, account number, and IFSC are required for bank refund');
    error.statusCode = 400;
    throw error;
  }

  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    const error = new Error('Valid IFSC code is required for bank refund');
    error.statusCode = 400;
    throw error;
  }

  return {
    payoutMethod,
    accountHolderName,
    accountNumber,
    ifsc,
    bankName
  };
};

const buildRefundTimelineEntry = (status, message, actor = {}) => ({
  status,
  message,
  at: new Date(),
  actorRole: actor.role || 'system',
  actorId: actor.id,
  actorName: actor.name
});

const addRefundTimeline = (booking, status, message, actor) => {
  booking.refundTimeline = [
    ...(booking.refundTimeline || []),
    buildRefundTimelineEntry(status, message, actor)
  ];
};

const processRefundPayment = async (booking) => {
  const amount = roundMoney(booking?.refundAmount || booking?.refundPolicy?.refundableAmount);

  if (!amount) {
    const error = new Error('Refund amount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  if (process.env.REFUND_GATEWAY_URL) {
    if (typeof fetch !== 'function') {
      throw new Error('Refund gateway is configured but fetch is not available in this runtime');
    }

    const response = await fetch(process.env.REFUND_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.REFUND_GATEWAY_KEY ? { Authorization: `Bearer ${process.env.REFUND_GATEWAY_KEY}` } : {})
      },
      body: JSON.stringify({
        bookingId: booking._id,
        amount,
        currency: 'INR',
        reason: booking.refundReason,
        payoutMethod: booking.refundBankDetails?.payoutMethod,
        refundDestination: booking.refundBankDetails
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || 'Refund gateway rejected the refund');
      error.statusCode = response.status || 502;
      throw error;
    }

    return {
      success: true,
      reference: data.refundId || data.reference || data.id || `gateway-${booking._id}-${Date.now()}`,
      gatewayResponse: data
    };
  }

  return {
    success: true,
    reference: `manual-${booking._id}-${Date.now()}`,
    gatewayResponse: { mode: 'manual_fallback' }
  };
};

module.exports = {
  REFUND_STATUSES,
  evaluateRefundPolicy,
  normalizeRefundDestination,
  addRefundTimeline,
  buildRefundTimelineEntry,
  parseEventDateTime,
  processRefundPayment,
  roundMoney
};
