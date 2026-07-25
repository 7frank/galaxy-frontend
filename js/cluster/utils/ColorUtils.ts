import * as _ from "lodash";

const _sentRanges = [[92, Number.MAX_SAFE_INTEGER], [85, 92], [78, 85], [71, 78], [64, 71], [57, 64], [50, 57], [43, 50], [36, 43], [29, 36], [22, 29], [15, 22], [Number.MIN_SAFE_INTEGER, 22]];
const _priceRangesInPct = [[18, Number.MAX_SAFE_INTEGER], [18, 15], [12, 15], [9, 12], [6, 9], [3, 6], [0, 3], [-3, 0], [-6, -3], [-9, -6], [-12, -9], [-18, -15], [Number.MIN_SAFE_INTEGER, -18]];

let _currentGradientColors = [0x218D20, 0x439229, 0x8CCB84, 0x14B0BF, 0x9DC9CA, 0xCAB81A, 0xBBC42D, 0xC8A6BF, 0xCF73B4, 0x816365, 0x7D5C53, 0xAE5E29, 0xB62729];

const _availGradients: number[][] = [
    [0x218D20, 0x439229, 0x8CCB84, 0x14B0BF, 0x9DC9CA, 0xCAB81A, 0xBBC42D, 0xC8A6BF, 0xCF73B4, 0x816365, 0x7D5C53, 0xAE5E29, 0xB62729],
    [0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0xff0000, 0x00ff00, 0x0000ff, 0xffffff],
    [0xffffff, 0x0000ff, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111]
];

let _gradientIndex = 0;

export function cycleGradient(): number[] {
    _gradientIndex = ++_gradientIndex % _availGradients.length;
    return _currentGradientColors = _availGradients[_gradientIndex];
}

export function getCurrentGradient(): number[] {
    return _currentGradientColors;
}

export function computeCompanyNodeColor(val = 0, attr = "sent"): number {
    let arr: number[][];
    if (attr === "sent") arr = _sentRanges;
    else if (attr === "priceRanges") arr = _priceRangesInPct;
    else return 0xffffff;

    for (let i = 0; i < arr.length; i++) {
        const range = arr[i];
        if ((range[0] < val && val < range[1]) || (range[1] < val && val < range[0]))
            return _currentGradientColors[i];
    }
    return 0xffffff;
}

export function computeGroupNodeColorHelper(distinctGroupIDS: string[]): { getColor: (groupID: string) => number } {
    const colors = distinctGroupIDS.map(() => _.random(0, 255) * _.random(0, 255) * _.random(0, 255));
    return {
        getColor(groupID: string): number {
            const i = distinctGroupIDS.indexOf(groupID);
            return colors[i] || 0xFFFFFF;
        }
    };
}
