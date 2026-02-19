import { createContext, useContext, ReactNode } from "react";
import { Scenario } from "../types/scenario";

const ScenarioContext = createContext<Scenario | null>(null);

export const ScenarioProvider = ({ scenario, children }: { scenario: Scenario; children: ReactNode }) => (
  <ScenarioContext.Provider value={scenario}>
    {children}
  </ScenarioContext.Provider>
);

// eslint-disable-next-line react-refresh/only-export-components
export const useScenario = (): Scenario => {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error("useScenario must be used within ScenarioProvider");
  return ctx;
};
