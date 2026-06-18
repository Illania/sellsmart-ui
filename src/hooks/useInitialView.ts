import { useState } from "react";
import type { ViewType } from "../types";

export function useInitialView() {
  return useState<ViewType>("dashboard");
}