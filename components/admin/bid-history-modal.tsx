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
    title: string
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
  const [restoring, setRestoring] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadHistory()
  }, [item.id])

  const loadHistory = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("bid_history")
      .select("*")
      .eq("auction_item_id", item.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading bid history:", error)
    }

    if (!error && data) {
      setHistory(data)
    }
    setLoading(false)
  }

  const handleRestore = async (entry: BidHistoryEntry) => {
    setRestoring(entry.id)
    try {
      const response = await fetch("/api/admin/restore-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          bidAmount: entry.bid_amount,
          bidderName: entry.bidder_name,
          bidderEmail: entry.bidder_email,
          timestamp: entry.created_at,
        }),
      })

      if (response.ok) {
        onClose()
      }
    } catch (error) {
      console.error("Error restoring bid:", error)
    } finally {
      setRestoring(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const isCurrentBid = (entry: BidHistoryEntry) => {
    return (
      entry.bid_amount === item.current_bid && 
      entry.bidder_name === item.current_bidder?.full_name
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-2 border-[#C9A961]/30 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#C9A961]">
            Bid History - {item.title}
          </DialogTitle>
          <p className="text-sm text-neutral-400 mt-1">View and restore to any previous bid</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-neutral-400">Loading history...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-neutral-400">No bid history available</div>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => {
                const isCurrent = isCurrentBid(entry)
                return (
                  <div
                    key={entry.id}
                    className={`border rounded-lg p-4 transition-all ${
                      isCurrent
                        ? "border-[#C9A961] bg-[#C9A961]/10"
                        : "border-neutral-800 bg-neutral-800/30 hover:bg-neutral-800/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-[#C9A961]" />
                          <span className="text-lg font-bold text-white">
                            ${entry.bid_amount.toLocaleString()}
                          </span>
                          {isCurrent && (
                            <span className="flex items-center gap-1 text-xs bg-[#C9A961] text-black px-2 py-0.5 rounded-full font-medium">
                              <CheckCircle2 className="h-3 w-3" />
                              Current
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-neutral-400">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span>{entry.bidder_name || "Anonymous"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatDate(entry.created_at)}</span>
                          </div>
                        </div>

                        {entry.bidder_email && (
                          <div className="text-xs text-neutral-500">
                            {entry.bidder_email}
                          </div>
                        )}
                      </div>

                      {!isCurrent && (
                        <Button
                          size="sm"
                          onClick={() => handleRestore(entry)}
                          disabled={restoring === entry.id}
                          className="bg-neutral-700 hover:bg-neutral-600 text-white shrink-0"
                        >
                          {restoring === entry.id ? "Restoring..." : "Restore"}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-neutral-800">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-neutral-700 text-neutral-300 bg-transparent hover:bg-neutral-800"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}