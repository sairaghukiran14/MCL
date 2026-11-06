"use client";

import type { ComponentType } from "react";
import type { PartId } from "@/lib/content/anatomy";
import { BldcScene, PartIcon as BldcIcon } from "./BldcDrawing";
import { BldcCrossSection } from "./BldcCrossSection";
import { SystemDiagram as BldcSystem } from "./SystemDiagram";
import { InverterScene, InverterIcon } from "./InverterDrawing";
import { InverterLive } from "./InverterLive";
import { InverterSystem } from "./InverterSystem";
import { DroneScene, DroneIcon } from "./DroneDrawing";
import { DroneMixer } from "./DroneMixer";
import { DroneSystem } from "./DroneSystem";

export interface SceneProps {
  t: number;
  active: PartId[];
  onEnter: (id: PartId | null) => void;
  onPick: (id: PartId) => void;
}
export interface Kit {
  Scene: ComponentType<SceneProps>;
  Icon: ComponentType<{ id: PartId }>;
  Live: ComponentType;
  System: ComponentType;
}

/* One drawing kit per teardown id in lib/content/anatomy.ts. */
export const KITS: Record<string, Kit> = {
  bldc: { Scene: BldcScene, Icon: BldcIcon, Live: BldcCrossSection, System: BldcSystem },
  inverter: { Scene: InverterScene, Icon: InverterIcon, Live: InverterLive, System: InverterSystem },
  drone: { Scene: DroneScene, Icon: DroneIcon, Live: DroneMixer, System: DroneSystem },
};
