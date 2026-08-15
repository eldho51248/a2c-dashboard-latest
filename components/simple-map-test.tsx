"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SimpleMapTest() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapData, setMapData] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadMapData = async () => {
      try {
        setLoading(true)
        
        const response = await fetch('/assets/geojsons/regions.geojson')
        
        if (!response.ok) {
          throw new Error(`Failed to load regions: ${response.status}`)
        }
        
        const data = await response.json()
        
        setMapData(data)
      } catch (err) {
        console.error('🗺️ Map loading error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load map')
      } finally {
        setLoading(false)
      }
    }

    loadMapData()
  }, [mounted])

  if (!mounted) {
    return (
      <Card className="w-full h-[400px]">
        <CardHeader>
          <CardTitle>🗺️ Map Test - Mounting...</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p>Mounting component...</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="w-full h-[400px]">
        <CardHeader>
          <CardTitle>🗺️ Map Test - Loading...</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading map data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full h-[400px]">
        <CardHeader>
          <CardTitle>🗺️ Map Test - Error</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center text-red-500">
            <p className="font-semibold">Error loading map:</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle>🗺️ Map Test - Success!</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-[300px]">
        <div className="text-center text-green-600">
          <p className="font-semibold">✅ Map data loaded successfully!</p>
          <p className="text-sm mt-2">
            Features: {mapData?.features?.length || 0}
          </p>
          <p className="text-sm">
            Type: {mapData?.type}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
