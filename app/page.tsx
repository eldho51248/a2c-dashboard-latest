"use client";

import DashboardClient from '@/components/dashboard-client';

export const dynamic = "force-dynamic";

export default function Page() {
  const initialFilters = {
    region: "all",
    zone: "all",
    woreda: "all",
    kebele: "all",
    farmerType: "all",
    recordState: "all",
    farmingType: "all",
  };

  return (
    <DashboardClient
      geoJsonData={null} // defer map topo to client fetch to keep payload small
      initialFilters={initialFilters}
    />
  );
}
