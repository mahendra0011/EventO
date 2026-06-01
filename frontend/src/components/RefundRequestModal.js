import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, CreditCard, Landmark, Loader2, Smartphone, X } from 'lucide-react';
import api from '../utils/api';

const emptyForm = {
  reason: '',
  payoutMethod: 'bank',
  accountHolderName: '',
  accountNumber: '',
  ifsc: '',
  bankName: '',
  upiId: ''
};

const RefundRequestModal = ({ booking, onClose, onSubmitted }) => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [policyData, setPolicyData] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);

  const willNeedRefundDestination = Boolean(policyData?.requiresRefundDestination);
  const policy = policyData?.policy;

  useEffect(() => {
    if (!booking?._id) return;

    setForm(emptyForm);
    setPolicyLoading(true);
    api.get(`/bookings/${booking._id}/refund-policy`)
      .then((res) => setPolicyData(res.data))
      .catch((error) => {
        setPolicyData(null);
        toast.error(error.response?.data?.message || 'Could not load refund policy');
      })
      .finally(() => setPolicyLoading(false));
  }, [booking?._id]);

  if (!booking) return null;

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.reason.trim()) {
      toast.error('Cancellation reason is required');
      return;
    }

    const refundBankDetails = willNeedRefundDestination
      ? form.payoutMethod === 'upi'
        ? { payoutMethod: 'upi', upiId: form.upiId.trim() }
        : {
            payoutMethod: 'bank',
            accountHolderName: form.accountHolderName.trim(),
            accountNumber: form.accountNumber.trim(),
            ifsc: form.ifsc.trim(),
            bankName: form.bankName.trim()
          }
      : undefined;

    setSubmitting(true);
    try {
      const res = await api.put(`/bookings/${booking._id}/cancel`, {
        reason: form.reason.trim(),
        refundBankDetails
      });
      onSubmitted(res.data);
      toast.success(res.data?.refundStatus === 'requested'
        ? 'Booking cancelled. Refund request submitted.'
        : 'Booking cancelled successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase text-primary-600">Cancel ticket</p>
            <h2 className="mt-1 text-xl font-extrabold text-cocoa-900">{booking.event?.title || 'Event booking'}</h2>
            <p className="mt-1 text-sm font-semibold text-cocoa-500">
              {booking.numberOfTickets} ticket(s) / Rs. {Number(booking.totalPrice || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-[#f3eee9]" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-extrabold text-amber-900">Cancellation policy</p>
              {policyLoading ? (
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking policy
                </p>
              ) : policy ? (
                <div className="mt-1 space-y-1 text-sm font-semibold text-amber-800">
                  <p>{policy.label}: Rs. {Number(policy.refundableAmount || 0).toLocaleString('en-IN')}</p>
                  <p>{policy.reason}</p>
                </div>
              ) : (
                <p className="mt-1 text-sm font-semibold text-amber-800">Policy will be checked when you submit.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Cancellation reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => updateField('reason', e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Tell us why you are cancelling"
              required
            />
          </div>

          {willNeedRefundDestination && (
            <div className="rounded-lg border border-cocoa-100 p-4">
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateField('payoutMethod', 'bank')}
                  className={`rounded-lg border px-4 py-2 text-sm font-bold ${form.payoutMethod === 'bank' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-cocoa-100 text-cocoa-600'}`}
                >
                  <Landmark className="mr-2 inline h-4 w-4" />
                  Bank account
                </button>
                <button
                  type="button"
                  onClick={() => updateField('payoutMethod', 'upi')}
                  className={`rounded-lg border px-4 py-2 text-sm font-bold ${form.payoutMethod === 'upi' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-cocoa-100 text-cocoa-600'}`}
                >
                  <Smartphone className="mr-2 inline h-4 w-4" />
                  UPI
                </button>
              </div>

              {form.payoutMethod === 'bank' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Account holder name</label>
                    <input value={form.accountHolderName} onChange={(e) => updateField('accountHolderName', e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Account number</label>
                    <input value={form.accountNumber} onChange={(e) => updateField('accountNumber', e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">IFSC</label>
                    <input value={form.ifsc} onChange={(e) => updateField('ifsc', e.target.value.toUpperCase())} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Bank name</label>
                    <input value={form.bankName} onChange={(e) => updateField('bankName', e.target.value)} className="input-field" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="label">UPI ID</label>
                  <input value={form.upiId} onChange={(e) => updateField('upiId', e.target.value)} className="input-field" placeholder="name@bank" required />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-outline" disabled={submitting}>
            Close
          </button>
          <button type="submit" className="btn-danger" disabled={submitting || policyLoading || policy?.canCancel === false}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cancelling
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Cancel ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RefundRequestModal;
