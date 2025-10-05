// components/admin/edit-bid-modal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface AuctionItemData {
  id: string
  service: string
  honor: string
  description?: string
  current_bid: number
  starting_bid: number
  minimum_increment: number
  current_bidder?: {
    full_name: string
    email: string
  }
}

interface EditBidModalProps {
  item: AuctionItemData
  onClose: () => void
  services?: string[]
}

export function EditBidModal({ item, onClose, services = [] }: EditBidModalProps) {
  const [showItemDetails, setShowItemDetails] = useState(false)
  
  // Bid editing state
  const [bidAmount, setBidAmount] = useState(item.current_bid.toString())
  const [bidderName, setBidderName] = useState(item.current_bidder?.full_name || "")
  const [bidderEmail, setBidderEmail] = useState(item.current_bidder?.email || "")
  
  // Item details editing state
  const [service, setService] = useState(item.service)
  const [honor, setHonor] = useState(item.honor)
  const [description, setDescription] = useState(item.description || "")
  const [startingBid, setStartingBid] = useState(item.starting_bid)
  const [minimumIncrement, setMinimumIncrement] = useState(item.minimum_increment)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleUpdateBid = async () => {
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

      toast.success("Bid updated successfully")
      onClose()
    } catch (err) {
      setError("Failed to update bid. Please try again.")
      console.error("Edit bid error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

 const handleUpdateItemDetails = async () => {
    if (!service || !honor) {
      setError("Service and honor are required")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/auction-items/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          service,
          honor,
          description: description || null,
          startingBid,
          minimumIncrement,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update item details")
      }

      toast.success("Item details updated successfully")
      onClose()
    } catch (err) {
      setError("Failed to update item details. Please try again.")
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

      toast.success("Bid reset successfully")
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
      <DialogContent className="bg-neutral-900 border-2 border-[#C9A961]/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#C9A961]">
            {showItemDetails ? "Edit Item Details" : "Edit Bid"}
          </DialogTitle>
        </DialogHeader>

        {/* Toggle Button */}
        <div className="flex gap-2 border-b border-neutral-700 pb-4">
          <button
            onClick={() => setShowItemDetails(false)}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              !showItemDetails
                ? "bg-[#C9A961] text-black font-semibold"
                : "bg-neutral-800 text-white hover:bg-neutral-700"
            }`}
          >
            Bid & Bidder
          </button>
          <button
            onClick={() => setShowItemDetails(true)}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              showItemDetails
                ? "bg-[#C9A961] text-black font-semibold"
                : "bg-neutral-800 text-white hover:bg-neutral-700"
            }`}
          >
            Item Details
          </button>
        </div>

        <div className="space-y-4">
          {!showItemDetails ? (
            /* BID EDITING SECTION */
            <>
           <div>
  <div className="text-sm text-neutral-400">Item</div>
  <div className="text-white font-medium">{item.service} - {item.honor}</div>
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

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleReset}
                  disabled={isSubmitting}
                  variant="outline"
                  className="flex-1 bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/30"
                >
                  Reset Bid
                </Button>
                <Button
                  onClick={handleUpdateBid}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#C9A961] text-black hover:bg-[#B89851]"
                >
                  {isSubmitting ? "Updating..." : "Update Bid"}
                </Button>
              </div>
            </>
          ) : (
            /* ITEM DETAILS EDITING SECTION */
            <>
              

              <div className="space-y-2">
                <Label htmlFor="service" className="text-neutral-300">
                  Service *
                </Label>
                {services.length > 0 ? (
                  <select
                    id="service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
                  >
                    <option value="">Select service...</option>
                    {services.map((svc) => (
                      <option key={svc} value={svc}>
                        {svc}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="service"
                    type="text"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="e.g., Shacharit, Mincha"
                    className="bg-neutral-800 border-neutral-700 text-white focus:border-[#C9A961] focus:ring-[#C9A961]/20"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="honor" className="text-neutral-300">
                  Honor Name *
                </Label>
                <Input
                  id="honor"
                  type="text"
                  value={honor}
                  onChange={(e) => setHonor(e.target.value)}
                  placeholder="e.g., Petach, Gelila, Maftir"
                  className="bg-neutral-800 border-neutral-700 text-white focus:border-[#C9A961] focus:ring-[#C9A961]/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-neutral-300">
                  Description (Optional)
                </Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startingBid" className="text-neutral-300">
                    Starting Bid ($)
                  </Label>
                  <Input
                    id="startingBid"
                    type="number"
                    value={startingBid}
                    onChange={(e) => setStartingBid(Number(e.target.value))}
                    min="0"
                    step="1"
                    className="bg-neutral-800 border-neutral-700 text-white focus:border-[#C9A961] focus:ring-[#C9A961]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumIncrement" className="text-neutral-300">
                    Minimum Increment ($)
                  </Label>
                  <Input
                    id="minimumIncrement"
                    type="number"
                    value={minimumIncrement}
                    onChange={(e) => setMinimumIncrement(Number(e.target.value))}
                    min="1"
                    step="1"
                    className="bg-neutral-800 border-neutral-700 text-white focus:border-[#C9A961] focus:ring-[#C9A961]/20"
                  />
                </div>
              </div>

              {item.current_bid !== item.starting_bid && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3 text-sm text-yellow-400">
                  <strong>Note:</strong> This item has active bids. Changing the starting bid will not affect the current bid amount.
                </div>
              )}

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateItemDetails}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#C9A961] text-black hover:bg-[#B89851]"
                >
                  {isSubmitting ? "Updating..." : "Update Details"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}