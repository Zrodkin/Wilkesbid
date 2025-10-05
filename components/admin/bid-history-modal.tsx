// components/admin/bid-history-modal.tsx
"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Clock, User, DollarSign, CheckCircle2 } from "lucide-react"

interface BidHistoryEntry {
  id: string
  auction_item_id: string
  bid_amount: number
  bidder_name: string | null
  bidder_email: string | null
  created_at: string
}

interface BidHistoryModalProps {
  item: {
    id: string
    service: string
    honor: string
    current_bid: number
    current_bidder?: {
      full_name: string
      email: string
    } | null
  }
  onClose: () => void
}

export function BidHistoryModal({ item, onClose }: BidHistoryModalProps) {
  const [history, setHistory] = useState<BidHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("bid_history")
        .select("*")
        .eq("auction_item_id", item.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error("Failed to load bid history:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-2 border-[#C9A961]/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#C9A961]">
            Bid History
          </DialogTitle>
          <p className="text-neutral-400 text-sm mt-2">
            {item.service} - {item.honor}
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Current Bid */}
          <div className="bg-[#C9A961]/10 border border-[#C9A961]/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-[#C9A961]" />
              <span className="text-sm font-semibold text-[#C9A961]">Current Winning Bid</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-white font-medium">
                  {item.current_bidder?.full_name || "No bids yet"}
                </div>
                {item.current_bidder?.email && (
                  <div className="text-neutral-400 text-sm">{item.current_bidder.email}</div>
                )}
              </div>
              <div className="text-2xl font-bold text-[#C9A961]">
                ${item.current_bid.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Bid History */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">All Bids</h3>
            {loading ? (
              <div className="text-center py-8 text-neutral-400">Loading...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">No bid history yet</div>
            ) : (
              <div className="space-y-2">
                {history.map((bid, index) => (
                  <div
                    key={bid.id}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-neutral-400" />
                          <span className="text-white font-medium">
                            {bid.bidder_name || "Anonymous"}
                          </span>
                          {index === 0 && (
                            <span className="text-xs bg-[#C9A961] text-black px-2 py-0.5 rounded">
                              CURRENT
                            </span>
                          )}
                        </div>
                        {bid.bidder_email && (
                          <div className="text-sm text-neutral-400 ml-6">{bid.bidder_email}</div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-2 ml-6">
                          <Clock className="h-3 w-3" />
                          {new Date(bid.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-[#C9A961]" />
                        <span className="text-xl font-bold text-[#C9A961]">
                          {bid.bid_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-neutral-800 hover:bg-neutral-700 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}