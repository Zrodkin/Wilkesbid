// components/auction/payment-modal.tsx
'use client';

interface PaymentModalProps {
  item: {
    title: string;
    current_bid: number;
  };
  winner: {
    full_name: string;
    email: string;
  };
  onClose: () => void;
}

export function PaymentModal({ item, winner, onClose }: PaymentModalProps) {
  const paymentMethods = [
    {
      name: "Credit Card",
      url: "https://www.baismenachem.com/templates/donate_cdo/aid/4970020/jewish/Donate.htm",
    },
    {
      name: "PayPal",
      url: "https://www.paypal.com/paypalme/baismenachemydp",
    },
    {
      name: "CashApp",
      url: "https://cash.app/$BaisMenachemydp",
    },
    {
      name: "Venmo",
      url: "https://venmo.com/u/uriperlman",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#F5F3EF] w-[calc(100%-2rem)] sm:max-w-md mx-auto border-2 border-[#4A7C7E] rounded-xl p-6">
        <div className="mb-6">
          <h2 className="font-bold text-xl sm:text-2xl text-[#2C2416] text-center mb-4">
            Choose Payment Method
          </h2>
          <div className="text-center space-y-1">
            <p className="text-sm text-[#5C5347]">{item.title}</p>
            <p className="text-lg font-bold text-[#2C2416]">Winner: {winner.full_name}</p>
            <p className="text-2xl font-bold text-[#4A7C7E]">${item.current_bid.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {paymentMethods.map((method) => (
            <a
              key={method.name}
              href={method.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 shadow-md hover:shadow-lg border border-gray-200"
            >
              <span className="text-sm font-medium text-gray-800">{method.name}</span>
            </a>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 px-4 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}