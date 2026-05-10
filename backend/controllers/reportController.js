const Event = require('../models/Event');
const EventReport = require('../models/EventReport');
const Notification = require('../models/Notification');
const {
  notifyAdmins,
  refundBookingsForEvent
} = require('../utils/trustSafety');
const { logActivity } = require('../utils/activity');

const REPORT_REVIEW_THRESHOLD = Number(process.env.EVENT_REPORT_REVIEW_THRESHOLD || 3);
const REPORT_SUSPEND_THRESHOLD = Number(process.env.EVENT_REPORT_SUSPEND_THRESHOLD || 10);

const buildReportSummary = async (eventId) => {
  const summary = await EventReport.aggregate([
    { $match: { event: eventId, status: { $ne: 'dismissed' } } },
    { $group: { _id: '$reason', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return summary.map((row) => ({ reason: row._id, count: row.count }));
};

exports.reportEvent = async (req, res) => {
  try {
    const { reason, message = '' } = req.body;
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer?._id?.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot report your own event' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Report reason is required' });
    }

    await EventReport.create({
      user: req.user.id,
      event: event._id,
      reason,
      message
    });

    const [reportCount, reportSummary] = await Promise.all([
      EventReport.countDocuments({ event: event._id, status: { $ne: 'dismissed' } }),
      buildReportSummary(event._id)
    ]);

    event.reportCount = reportCount;
    event.reportSummary = reportSummary;

    let autoSuspended = false;
    let refundResult = null;

    if (reportCount >= REPORT_REVIEW_THRESHOLD) {
      await notifyAdmins({
        title: 'Event report threshold reached',
        message: `"${event.title}" has ${reportCount} active report(s). Please review it.`,
        link: `/admin?tab=fraud`
      });
    }

    if (reportCount >= REPORT_SUSPEND_THRESHOLD && event.publishStatus !== 'suspended') {
      autoSuspended = true;
      event.isActive = false;
      event.publishStatus = 'suspended';
      event.moderationStatus = 'pending';
      event.suspendedAt = new Date();
      event.suspensionReason = `${reportCount} user reports`;
      event.moderationFlags = Array.from(new Set([...(event.moderationFlags || []), 'fake_event']));
      event.moderationNotes = `Auto-suspended after ${reportCount} user reports.`;

      refundResult = await refundBookingsForEvent(event._id, {
        req,
        reason: `Event "${event.title}" was auto-suspended after user reports`
      });

      if (event.organizer?._id) {
        await Notification.create({
          user: event.organizer._id,
          title: 'Event auto-suspended',
          message: `"${event.title}" was auto-suspended after repeated user reports. Admin review is required.`,
          type: 'security',
          link: '/host?tab=events'
        });
      }

      await notifyAdmins({
        title: 'Event auto-suspended',
        message: `"${event.title}" was auto-suspended after ${reportCount} reports. Refunds were triggered.`,
        link: `/admin?tab=fraud`
      });
    }

    await event.save();

    await logActivity({
      req,
      action: autoSuspended ? 'event.reported_auto_suspended' : 'event.reported',
      entity: 'Event',
      entityId: event._id,
      message: `${req.user.email} reported "${event.title}"`,
      metadata: { reason, reportCount, autoSuspended }
    });

    res.status(201).json({
      message: autoSuspended
        ? 'Report submitted. This event has been auto-suspended for admin review.'
        : 'Report submitted. Thank you for helping keep events safe.',
      reportCount,
      autoSuspended,
      refundResult
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reported this event' });
    }
    console.error('Report event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
