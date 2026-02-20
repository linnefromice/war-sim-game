import fighterImg from "../../assets/fighter.jpg";
import tankImg from "../../assets/tank.jpg";
import soldierImg from "../../assets/army.jpg";
import { UnitCategory } from "../../types";
import { assertNever } from "../../constants";

const unitImageMap: Record<UnitCategory, string> = {
  fighter: fighterImg,
  tank: tankImg,
  soldier: soldierImg,
};

export const UnitIcon = ({ unitType, className }: { unitType: UnitCategory, className: string }): JSX.Element => {
  switch (unitType) {
    case "fighter":
    case "tank":
    case "soldier":
      return (
        <img
          src={unitImageMap[unitType]}
          alt={unitType}
          width={28}
          height={28}
          className={className}
          style={{ objectFit: "contain", borderRadius: 4 }}
        />
      );
    default:
      return assertNever(unitType);
  }
}
