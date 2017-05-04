export const defaultOptions = {
    blurSize: 30,

    // gradientColors is either shaped of ['blue', 'cyan', 'lime', 'yellow', 'red']
    // or [{
    //    offset: 0.2,
    //    color: 'blue'
    // }, {
    //    offset 0.8,
    //    color: 'cyan'
    // }]
    // gradientColors: ['black', 'blue', 'cyan', 'lime', 'yellow', 'yellow', 'red', 'red'],
    gradientColors: [{
        offset: 0,
        color: 'black'
    }, {
        offset: 0.1,
        color: 'blue'
    }, {
        offset: 0.2,
        color: 'cyan'
    }, {
        offset: 0.5,
        color: 'lime'
    }, {
        offset: 0.8,
        color: 'yellow'
    }, {
        offset: 1,
        color: 'red'
    }],
    minAlpha: 0.05,
    bgAlpha: 80,
    valueScale: 1,
    opacity: 1
};

export const BRUSH_SIZE = 28;
export const GRADIENT_LEVELS = 256;