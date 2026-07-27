import * as _ from "lodash";


/**
 * Code in here contains some helper functions to manage different layout types for industrial sector captions.
 * This is mainly used to override the way the caption of a cluster is displayed. {@link Default3DGraphConfig}
 */


/**
 * Using this method - based on the 'sectorName' - an icon is drawn for the caption.
 */
export function IndustrialSectorIcon(sectorName) {
    return `<img src="./img/industryIcons/${sectorName}.png" title="${sectorName}" />`
}



/**
 * Using this method - based on the 'sectorName' - an abbreviation is used.
 */

export function IndustrialSectorAbbreviation(sectorName) {

    sectorName = _.startCase(sectorName)

    if (sectorName.indexOf(" ") == -1) return sectorName

    return sectorName.replace(/[a-z\s]/g, '');

}


