import FighterJetIcon from "../../assets/fighterJet.svg?react";
import ArmyTankIcon from "../../assets/armyTank.svg?react";
import BattleSoldierIcon from "../../assets/battleSoldier.svg?react";
import { UnitCategory } from "../../types";

function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

export const UnitIcon = ({ unitType, className }: { unitType: UnitCategory, className: string }): JSX.Element => {
  const props = {
    width: 28,
    height: 28,
    className,
  }

  switch (unitType) {
    case "fighter":
      return <FighterJetIcon {...props} />
    case "tank":
      return <ArmyTankIcon {...props} />
    case "soldier":
      return <BattleSoldierIcon {...props}/>
    default:
      return assertNever(unitType);
  }
}
