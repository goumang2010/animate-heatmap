import Heatmap from './heatmap';
import { GRADIENT_LEVELS } from './constants';

function initAdapter(Heatmap) {
    Heatmap.prototype.checkPosition = function(item) {
        let x, y;
        return (item && (x = item[0]) >= 0 && x < this.width && (y = item[1]) >= 0 && y < this.height)
    }
    Heatmap.prototype.update = function(newdata) {
        if (!this.data) {
            this.refresh({ data: newdata });
            this.data = newdata;
            return;
        }
        let len;
        if (!Array.isArray(newdata) || ((len = newdata.length) !== this.data.length)) {
            throw new Error('data array of same length required!');
        }
        let needkeep = [];
        let needupdate = [];
        // to record old position
        let needupdatePrev = [];
        for (let i = 0; i < len; i++) {
            let x0 = this.data[i];
            let x1 = newdata[i];
            if (this.checkPosition(x0)) {
                if ((x0[0] === x1[0]) && (x0[1] === x1[1])) {
                    needkeep.push(x0);
                } else if (this.checkPosition(x1)) {
                    needupdatePrev.push(x0);
                    needupdate.push(x1);
                    // if x1 has been deleted
                } else {
                    needupdatePrev.push(x0);
                }
                // if x1 is new
            } else if (this.checkPosition(x1)) {
                needupdate.push(x1);
            }
        }
        let all = [...needupdatePrev, ...needupdate];
        if (all.length > 0) {
            if (needupdate.length === 0) {
                // only re-draw the points that need to be keep
                this.refresh({ data: needkeep });
            } else {
                // find the minimal section to be cleared
                let xseries = all.map(x => x[0]);
                let yseries = all.map(x => x[1]);
                let r = this.r;
                let maxX = Math.ceil(Math.max(...xseries) + r);
                let minX = Math.floor(Math.min(...xseries) - r);
                let maxY = Math.ceil(Math.max(...yseries) + r);
                let minY = Math.floor(Math.min(...yseries) - r);
                let dx = minX > 0 ? minX : 0;
                let dy = minY > 0 ? minY : 0;
                let width = maxX - minX;
                let height = maxY - minY;
                let canvasData = [...needupdate, ...needkeep];
                this.refresh({ data: canvasData, dx, dy, width, height });
            }
        }
        this.data = newdata;
    };
    Heatmap.prototype.refresh = function({ ctx = this.ctx, data = this.data, dx = 0, dy = 0, width = this.width, height = this.height } = {}) {
        if (ctx == null) return;
        var brush = this._getBrush();
        var gradient = this._getGradient();
        var r = this.r;
        let x0 = dx,
            y0 = dy,
            x1 = dx + width,
            y1 = dy + height;
        let minX = x0 - r;
        let minY = y0 - r;
        let maxX = x1 + r;
        let maxY = y1 + r;
        let params = [];
        for (let [x, y, value] of data) {
            if (x < minX || y < minY || x > maxX || y > maxY) {
                continue;
            }
            if (x < x0) {
                dx = minX = x - r;
                width += r;
            }
            if (y < y0) {
                dy = minY = y - r;
                height += r;
            }
            if (x > x1) {
                maxX = x + r;
                width += r;
            }
            if (y > y1) {
                maxY = y + r;
                height += r;
            }
            params.push([x - r, y - r, Math.min(1, Math.max(value * this.option.valueScale ||
                this.option.minAlpha, this.option.minAlpha))]);
        }
        ctx.clearRect(dx, dy, width, height);
        for (let [x, y, alpha] of params) {
            ctx.globalAlpha = alpha;
            ctx.drawImage(brush, x, y);
        }
        // colorize the canvas using alpha value and set with gradient
        let imageData = ctx.getImageData(dx, dy, width, height);
        let pixels = imageData.data;
        let plen = pixels.length / 4;
        while (plen--) {
            var id = plen * 4 + 3;
            var alpha = pixels[id] / 256;
            var colorOffset = Math.floor(alpha * (GRADIENT_LEVELS - 1));
            pixels[id - 3] = gradient[colorOffset * 4]; // red
            pixels[id - 2] = gradient[colorOffset * 4 + 1]; // green
            pixels[id - 1] = gradient[colorOffset * 4 + 2]; // blue
            pixels[id] *= this.option.opacity;
            pixels[id] = pixels[id] > 50 ? pixels[id] : 50; // alpha
        }
        ctx.putImageData(imageData, dx, dy);
    };
    Heatmap.prototype.setBackground = function(canvas, color) {
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels = imageData.data;
        var len = pixels.length / 4;
        var alpha = color.a * 256;
        while (len--) {
            var id = len * 4 + 3;
            // console.log(pixels);
            if ((pixels[id - 3] + pixels[id - 2] + pixels[id - 1] + pixels[id]) === 0) {
                pixels[id - 3] = color.r; // red
                pixels[id - 2] = color.g; // green
                pixels[id - 1] = color.b; // blue
                pixels[id] = alpha; // alpha
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    };
}
initAdapter(Heatmap);
export default Heatmap;
