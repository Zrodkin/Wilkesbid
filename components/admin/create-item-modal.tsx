// components/admin/create-item-modal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CreateItemModalProps {
  onClose: () => void
  onItemCreated: () => void
}

export function CreateItemModal({ onClose, onItemCreated }: CreateItemModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startingBid, setStartingBid] = useState("0")
  const [minimumIncrement, setMinimumIncrement] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async () => {
    setError("")
    
    if (!title.trim()) {
      setError("Title is required")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/create-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          startingBid: parseFloat(startingBid) || 0,
          minimumIncrement: parseFloat(minimumIncrement) || 1,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create item")
      }

      onItemCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item. Please try again.")
      console.error("Create item error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-2 border-[#C9A961]/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#C9A961]">
            Create New Auction Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-neutral-300">
              Title *
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Opening the Ark"
              className="bg-neutral-800 border-neutral-700 text-white focus:border-[#C9A961] focus:ring-[#C9A961]/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-neutral-300">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about this honor..."
              className="bg-neutral-800 border-neutral-700 text-white focus:border-[#C9A961] focus:ring-[#C9A961]/20 min-h-[80px]"
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
                step="0.01"
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white focus:border-[#C9A961] focus:ring-[#C9A961]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumIncrement" className="text-neutral-300">
                Min. Increment ($)
              </Label>
              <Input
                id="minimumIncrement"
                type="number"
                step="0.01"
                value={minimumIncrement}
                onChange={(e) => setMinimumIncrement(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white focus:border-[#C9A961] focus:ring-[#C9A961]/20"
              />
            </div>
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
              onClick={handleCreate}
              className="flex-1 bg-[#C9A961] hover:bg-[#B89851] text-black font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}