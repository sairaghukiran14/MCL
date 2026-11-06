import type { Metadata } from "next";
import { RouteView } from "@/components/RouteView";

export const metadata: Metadata = { title: "13-week route" };

export default function RoutePage() {
  return <RouteView />;
}
