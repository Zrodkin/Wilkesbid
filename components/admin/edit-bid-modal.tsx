// components/admin/edit-bid-modal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuctionItemData {
  id: string
  title: string
  description?: string
  current_bid: number
  current_bidder?: {
    full_name: string
    email: string
  }
  starting_bid: number
}

interface EditBidModalProps {
  item: AuctionItemData
  onClose: () => void
}

export function EditBidModal({ item, onClose }: EditBidModalProps) {
  const [bidAmount, setBidAmount] = useState(item.current_bid.toString())
  const [bidderName, setBidderName] = useState(item.current_bidder?.full_name || "")
  const [bidderEmail, setBidderEmail] = useState(item.current_bidder?.email || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleUpdate = async () => {
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/update-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          currentBid: parseFloat(bidAmount),
          bidderName: bidderName.trim() || null,
          bidderEmail: bidderEmail.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update bid")
      }

      onClose()
    } catch (err) {
      setError("Failed to update bid. Please try again.")
      console.error("Edit bid error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset this bid to the starting amount?")) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/reset-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          startingBid: item.starting_bid,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reset bid")
      }

      onClose()
    } catch (err) {
      setError("Failed to reset bid. Please try again.")
      console.error("Reset bid error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-2 border-[#C9A961]/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#C9A961]">Edit Bid</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-neutral-400">Item</div>
            <div className="text-white font-medium">{item.title}</div>
            {item.description && (
              <div className="text-sm text-neutral-500">{item.description}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bidAmount" className="text-neutral-300">
              Bid Amount ($)
            </Label>
            <Input
              id="bidAmount"
              type="number"
              step="0.01"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white focus:border-[#C9A961] focus:ring-[#C9A961]/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bidderName" className="text-neutral-300">
              Bidder Name
            </Label>
            <Input
              id="bidderName"
              type="text"
              value={bidderName}
              onChange={(e) => setBidderName(e.target.value)}
              placeholder="Leave empty to reset"
              className="bg-neutral-800 border-neutral-700 text-white focus:border-[#C9A961] focus:ring-[#C9A961]/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bidderEmail" className="text-neutral-300">
              Bidder Email
            </Label>
            <Input
              id="bidderEmail"
              type="email"
              value={bidderEmail}
              onChange={(e) => setBidderEmail(e.target.value)}
              placeholder="Leave empty to reset"
              className="bg-neutral-800 border-neutral-700 text-white focus:border-[#C9A961] focus:ring-[#C9A961]/20"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 border-red-700 text-red-500 hover:bg-red-950 bg-transparent"
              disabled={isSubmitting}
            >
              Reset Bid
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-neutral-700 bg-transparent text-neutral-300 hover:bg-neutral-800"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              className="bg-[#C9A961] hover:bg-[#B89851] text-black font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}