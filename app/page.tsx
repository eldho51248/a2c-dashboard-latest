"use client";

import DashboardClient from '@/components/dashboard-client';

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <DashboardClient
      geoJsonData={null} // defer map topo to client fetch to keep payload small
    />
  );
}
