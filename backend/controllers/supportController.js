const SupportTicket = require('../models/SupportTicket');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendImportantNotificationEmail } = require('../utils/email');
const { logActivity } = require('../utils/activity');
const { evaluateRefundPolicy, addRefundTimeline } = require('../utils/refund');

exports.getMySupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user.id })
      .populate('event', 'title date venue')
      .populate('booking', 'numberOfTickets totalPrice status paymentStatus refundStatus disputeStatus')
      .sort({ createdAt: -1 });

    res.json({ tickets });
  } catch (error) {
    console.error('Get my support tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createSupportTicket = async (req, res) => {
  try {
    const {
      booking,
      event,
      type = 'general',
      subject,
      message,
      priority = 'medium'
    } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    let linkedBooking = null;
    if (booking) {
      linkedBooking = await Booking.findById(booking).populate('event', 'title date time');
      if (!linkedBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      if (linkedBooking.user.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized for this booking' });
      }
    }

    const ticket = await SupportTicket.create({
      user: req.user.id,
      event: event || linkedBooking?.event?._id,
      booking: booking || undefined,
      type,
      subject,
      message,
      priority,
      createdBy: req.user.id
    });

    if (linkedBooking && type === 'refund_issue') {
      const policy = evaluateRefundPolicy(linkedBooking, linkedBooking.event);
      if (policy.canRefund) {
        linkedBooking.refundStatus = 'requested';
        linkedBooking.refundReason = message;
        linkedBooking.refundPolicy = policy;
        linkedBooking.refundAmount = policy.refundableAmount || 0;
        linkedBooking.refundRequestedAt = new Date();
        addRefundTimeline(linkedBooking, 'requested', 'Refund issue opened from support ticket.', {
          id: req.user.id,
          role: req.user.role || 'user',
          name: req.user.name
        });
      }
      await linkedBooking.save();
    }

    if (linkedBooking && type === 'payment_dispute') {
      linkedBooking.disputeStatus = 'open';
      await linkedBooking.save();
    }

    const admins = await User.find({ role: 'admin', isBlocked: false }).select('name email');
    await Notification.insertMany(admins.map((admin) => ({
      user: admin._id,
      title: 'New support ticket',
      message: `${req.user.name} opened: ${subject}`,
      type: 'system',
      link: '/admin?tab=support'
    })));

    admins.forEach((admin) => {
      sendImportantNotificationEmail(
        admin.email,
        admin.name,
        'New Evento support ticket',
        `${req.user.name} (${req.user.email}) opened a ${type} ticket: ${subject}`,
        '/admin?tab=support'
      )
        .then(result => {
          if (!result?.success) console.warn('Support ticket admin email failed:', result?.error || result?.message);
        })
        .catch(err => console.error('Support ticket admin email error:', err.message));
    });

    await logActivity({
      req,
      action: 'support.ticket_created',
      entity: 'SupportTicket',
      entityId: ticket._id,
      message: `${req.user.email} created support ticket: ${subject}`
    });

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('event', 'title date venue')
      .populate('booking', 'numberOfTickets totalPrice status paymentStatus refundStatus disputeStatus');

    res.status(201).json(populatedTicket);
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
