
import * as _ from "lodash";

export function IndustrialSectorIcon(sectorName) {
    return `<img src="./img/industryIcons/${sectorName}.png" title="${sectorName}" />`


}

export
function IndustrialSectorAbbreviation(sectorName) {

    sectorName= _.startCase(sectorName)

    if (sectorName.indexOf(" ")==-1) return sectorName

    return sectorName.replace(/[a-z\s]/g, '');

}


