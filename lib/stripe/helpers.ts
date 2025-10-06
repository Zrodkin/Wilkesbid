// lib/stripe/helpers.ts

/**
 * Calculate Stripe processing fee
 * Formula: (amount * 2.9%) + $0.30
 * @param amount - Amount in dollars
 * @returns Fee in dollars (rounded to 2 decimals)
 */
export function calculateStripeFee(amount: number): number {
  const feePercentage = 0.029; // 2.9%
  const fixedFee = 0.30;
  
  const fee = (amount * feePercentage) + fixedFee;
  return Math.round(fee * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate total amount including optional processing fee
 * @param subtotal - Subtotal in dollars
 * @param includeFee - Whether to add processing fee
 * @returns Object with breakdown
 */
export function calculatePaymentTotal(subtotal: number, includeFee: boolean = true) {
  const processingFee = includeFee ? calculateStripeFee(subtotal) : 0;
  const total = subtotal + processingFee;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    processingFee: Math.round(processingFee * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Convert dollars to cents for Stripe
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 * @param cents - Amount in cents
 * @returns Amount in dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format currency for display
 * @param amount - Amount in dollars
 * @returns Formatted string (e.g., "$123.45")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Calculate installment breakdown
 * @param totalAmount - Total amount in dollars
 * @param months - Number of months
 * @param includeFee - Whether to include processing fee
 * @returns Installment details
 */
export function calculateInstallments(
  totalAmount: number,
  months: number,
  includeFee: boolean = true
) {
  const { total } = calculatePaymentTotal(totalAmount, includeFee);
  const monthlyAmount = total / months;
  
  return {
    monthlyAmount: Math.round(monthlyAmount * 100) / 100,
    totalMonths: months,
    totalAmount: total,
    firstPayment: Math.round(monthlyAmount * 100) / 100, // Could adjust for rounding
  };
}

/**
 * Validate Stripe account ID format
 * @param accountId - Stripe account ID
 * @returns Whether valid
 */
export function isValidStripeAccountId(accountId: string): boolean {
  return /^acct_[a-zA-Z0-9]{16,}$/.test(accountId);
}

/**
 * Generate payment metadata
 * @param itemIds - Array of auction item IDs
 * @param bidderEmail - Winner's email
 * @param auctionId - Auction ID
 * @returns Metadata object
 */
export function generatePaymentMetadata(
  itemIds: string[],
  bidderEmail: string,
  auctionId: string
) {
  return {
    auction_id: auctionId,
    item_ids: itemIds.join(','),
    bidder_email: bidderEmail,
    platform: 'bais-menachem-auction',
  };
}