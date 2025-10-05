// components/admin/move-bid-modal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface AuctionItemData {
  id: string
  title: string
  description?: string
  current_bid: number
  current_bidder?: {
    full_name: string
    email: string
  }
}

interface MoveBidModalProps {
  item: AuctionItemData
  onClose: () => void
  allItems: AuctionItemData[]
}

export function MoveBidModal({ item, onClose, allItems }: MoveBidModalProps) {
  const [targetItemId, setTargetItemId] = useState("")
  const [resetOriginal, setResetOriginal] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleMove = async () => {
    if (!targetItemId) {
      setError("Please select a target item")
      return
    }

    if (targetItemId === item.id) {
      setError("Cannot move bid to the same item")
      return
    }

    if (!item.current_bidder) {
      setError("No bidder to move")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/move-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromItemId: item.id,
          toItemId: targetItemId,
          bidAmount: item.current_bid,
          bidderName: item.current_bidder.full_name,
          bidderEmail: item.current_bidder.email,
          resetFrom: resetOriginal,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to move bid")
      }

      onClose()
    } catch (err) {
      setError("Failed to move bid. Please try again.")
      console.error("Move bid error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableItems = allItems.filter(i => i.id !== item.id)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-2 border-[#C9A961]/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#C9A961]">Move Bid to Another Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-neutral-800 p-4 rounded-lg space-y-2 border border-neutral-700">
            <div className="text-sm text-neutral-400">Moving from:</div>
            <div className="text-white font-medium text-lg">{item.title}</div>
            {item.description && (
              <div className="text-sm text-neutral-500">{item.description}</div>
            )}
            <div className="text-[#C9A961] font-semibold text-xl">
              ${item.current_bid.toLocaleString()} by {item.current_bidder?.full_name || "Unknown"}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300">Move to:</Label>
            <Select value={targetItemId} onValueChange={setTargetItemId}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white focus:border-[#C9A961] focus:ring-[#C9A961]/20">
                <SelectValue placeholder="Select target item" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-white max-h-[300px]">
                {availableItems.map((targetItem) => (
                  <SelectItem 
                    key={targetItem.id} 
                    value={targetItem.id} 
                    className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{targetItem.title}</span>
                      <span className="text-xs text-neutral-400">
                        Current: ${targetItem.current_bid.toLocaleString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="reset"
              checked={resetOriginal}
              onCheckedChange={(checked: boolean) => setResetOriginal(checked)}
              className="border-neutral-700 data-[state=checked]:bg-[#C9A961] data-[state=checked]:border-[#C9A961]"
            />
            <label htmlFor="reset" className="text-sm text-neutral-300 cursor-pointer">
              Reset original item to starting bid (remove bidder)
            </label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-neutral-700 bg-transparent text-neutral-300 hover:bg-neutral-800"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMove}
              className="flex-1 bg-[#C9A961] hover:bg-[#B89851] text-black font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Moving..." : "Move Bid"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}