// app/payment-success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

export default function PaymentSuccessPage() {
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set window dimensions for confetti
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      {showConfetti && windowDimensions.width > 0 && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={300}
          colors={['#C9A961', '#FFD700', '#FFA500', '#FFFFFF']}
        />
      )}

      <div className="max-w-md w-full">
        <div className="bg-neutral-900 border-2 border-green-700 rounded-2xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-green-900/30 border-2 border-green-700 rounded-full p-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-white mb-3">
            Payment Successful!
          </h1>
          <p className="text-neutral-400 mb-6">
            Thank you for your generous contribution to Bais Menachem Youth Development Program.
          </p>

          {/* Receipt Info */}
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-neutral-400 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Your payment has been processed successfully</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>A receipt has been sent to your email</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Your items are now marked as paid</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full px-6 py-3 bg-[#C9A961] hover:bg-[#B89851] text-black rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              Return to Auction
            </Link>
          </div>

          {/* Support Info */}
          <p className="mt-6 text-xs text-neutral-500">
            Questions? Contact us at{' '}
            <a href="tel:570-970-2480" className="text-[#C9A961] hover:underline">
              570-970-2480
            </a>
          </p>
        </div>

        {/* Organization Info */}
        <div className="mt-6 text-center text-sm text-neutral-500">
          <p>BAIS MENACHEM YOUTH DEVELOPMENT PROGRAM</p>
          <p className="mt-1">3333 Evergreen Ln, Canadensis, PA 18325</p>
        </div>
      </div>
    </div>
  );
}
