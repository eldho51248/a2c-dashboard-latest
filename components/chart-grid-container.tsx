"use client"

import type React from "react"

import { useState, useRef } from "react"

interface ChartGridContainerProps {
  children: React.ReactNode
}

export function ChartGridContainer({ children }: ChartGridContainerProps) {
  const [dragOver, setDragOver] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen w-full transition-all duration-300 ${dragOver ? "bg-amber-50/50" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        backgroundImage: `
          linear-gradient(rgba(245, 158, 11, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245, 158, 11, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
      }}
    >
      {children}

      {/* Drop zones indicator */}
      {dragOver && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full border-2 border-dashed border-amber-400 bg-amber-50/20 rounded-lg flex items-center justify-center">
            <p className="text-amber-700 font-medium">Drop chart here</p>
          </div>
        </div>
      )}
    </div>
  )
}
