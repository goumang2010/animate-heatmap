/**
 * @file defines echarts Heatmap Chart
 * @author Ovilia (me@zhangwenli.com)
 * Inspired by https://github.com/mourner/simpleheat
 *
 * @module
 */
import { defaultOptions, GRADIENT_LEVELS, BRUSH_SIZE } from './constants';
/**
 * Heatmap Chart
 *
 * @class
 * @param {Object} opt options
 */
function Heatmap(opt) {
    this.setOption(opt);
}
Heatmap.prototype = {
    /**
     * Renders Heatmap and returns the rendered canvas
     * @param {Array} [x, y, value] array of data
     * @param {number} canvas width
     * @param {number} canvas height
     * @return {Object} rendered canvas
     */
    init: function({ width, height }) {
        this.width = width;
        this.height = height;
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        this.ctx = ctx;
        this.canvas = canvas;
    },
    setOption(opt) {
        this.option = { ...defaultOptions, ...opt };
        this.r = Math.round(BRUSH_SIZE + this.option.blurSize);
        this.brush = this._getBrush();
        this.gradient = this._getGradient();
    },
    draw({ ctx = this.ctx, data = this.data, dx = 0, dy = 0, width = this.width, height = this.height } = {}) {
        const gradient = this.gradient;
        const r = this.r;
        const { opacity, minAlpha, bgAlpha, valueScale } = this.option;
        let x0 = dx,
            y0 = dy,
            x1 = dx + width,
            y1 = dy + height;
        let minX = x0 - r;
        let minY = y0 - r;
        let maxX = x1 + r;
        let maxY = y1 + r;
        // create new canvas
        let _ctx = this._getTempCtx();
        for (let [x, y, value] of data) {
            // filter the point that has no effect
            if (x < minX || y < minY || x > maxX || y > maxY) {
                continue;
            }
            _ctx.globalAlpha = Math.min(1, Math.max(value * valueScale ||
                minAlpha, minAlpha));
            _ctx.drawImage(this.brush, x - r, y - r);
        }
        let imageData = _ctx.getImageData(x0, y0, width, height);
        let pixels = imageData.data;
        let plen = pixels.length / 4;
        while (plen--) {
            var id = plen * 4 + 3;
            var alpha = pixels[id] / 256;
            var colorOffset = Math.floor(alpha * (GRADIENT_LEVELS - 1));
            pixels[id - 3] = gradient[colorOffset * 4]; // red
            pixels[id - 2] = gradient[colorOffset * 4 + 1]; // green
            pixels[id - 1] = gradient[colorOffset * 4 + 2]; // blue
            pixels[id] *= opacity;
            pixels[id] = pixels[id] > bgAlpha ? pixels[id] : bgAlpha; // alpha
        }
        ctx.putImageData(imageData, x0, y0);
    },
    reset({ width = this.width, height = this.height } = {}) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.clearRect(0, 0, width, height);
        this.data = null;
    },
    /**
     * get canvas of a black circle brush used for canvas to draw later
     * @private
     * @returns {Object} circle brush canvas
     */
    _getBrush: function() {
        if (!this._brushCanvas) {
            this._brushCanvas = document.createElement('canvas');
            // set brush size
            var r = BRUSH_SIZE + this.option.blurSize;
            var d = r * 2;
            this._brushCanvas.width = d;
            this._brushCanvas.height = d;
            var ctx = this._brushCanvas.getContext('2d');
            // in order to render shadow without the distinct circle,
            // draw the distinct circle in an invisible place,
            // and use shadowOffset to draw shadow in the center of the canvas
            ctx.shadowOffsetX = d;
            ctx.shadowBlur = this.option.blurSize;
            // draw the shadow in black, and use alpha and shadow blur to generate
            // color in color map
            ctx.shadowColor = 'black';
            // draw circle in the left to the canvas
            ctx.beginPath();
            ctx.arc(-r, r, BRUSH_SIZE, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }
        return this._brushCanvas;
    },
    /**
     * get gradient color map
     * @private
     * @returns {array} gradient color pixels
     */
    _getGradient: function() {
        if (!this._gradientPixels) {
            var levels = GRADIENT_LEVELS;
            var canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = levels;
            var ctx = canvas.getContext('2d');
            // add color to gradient stops
            var gradient = ctx.createLinearGradient(0, 0, 0, levels);
            var len = this.option.gradientColors.length;
            for (var i = 0; i < len; ++i) {
                if (typeof this.option.gradientColors[i] === 'string') {
                    gradient.addColorStop((i + 1) / len,
                        this.option.gradientColors[i]);
                } else {
                    gradient.addColorStop(this.option.gradientColors[i].offset,
                        this.option.gradientColors[i].color);
                }
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1, levels);
            this._gradientPixels = ctx.getImageData(0, 0, 1, levels).data;
        }
        return this._gradientPixels;
    }
};
export default Heatmap;
