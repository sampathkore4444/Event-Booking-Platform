import React from 'react';
import { X, Copy, CheckCircle, Smartphone, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrBase64: string;
  amount: number;
  currency: string;
  billNumber: string;
  merchantName: string;
  instructions: string;
}

const PaymentQRModal: React.FC<PaymentQRModalProps> = ({
  isOpen,
  onClose,
  qrBase64,
  amount,
  currency,
  billNumber,
  merchantName,
  instructions,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyBill = () => {
    navigator.clipboard.writeText(billNumber);
    setCopied(true);
    toast.success('Bill number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-display font-bold text-gray-900">
            Scan to Pay
          </h3>
          <p className="text-gray-500 text-sm mt-1">Cambodia QR (Bakong/KHQR)</p>
        </div>

        {/* QR Code */}
        {qrBase64 ? (
          <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 mb-4">
            <img
              src={`data:image/png;base64,${qrBase64}`}
              alt="Payment QR Code"
              className="w-full max-w-[240px] mx-auto"
            />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-8 mb-4 text-center">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              Install <code className="bg-gray-200 px-2 py-0.5 rounded text-xs">qrcode[pil]</code> and Pillow to generate QR codes.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              pip install qrcode[pil] Pillow
            </p>
          </div>
        )}

        {/* Payment Details */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Merchant</span>
            <span className="font-medium text-gray-900">{merchantName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold text-lg text-gray-900">
              {currency === 'USD' ? '$' : ''}{amount.toFixed(2)} {currency !== 'USD' ? currency : ''}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Reference</span>
            <button
              onClick={handleCopyBill}
              className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-medium"
            >
              {billNumber}
              {copied ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
          {instructions}
        </p>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="btn-primary w-full py-4"
        >
          I've Made the Payment
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">
          After payment, the organizer will confirm your booking manually.
          Your booking reference is <strong>{billNumber}</strong>.
        </p>
      </div>
    </div>
  );
};

export default PaymentQRModal;
