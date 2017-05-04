import Heatmap from './heatmap';
import { GRADIENT_LEVELS } from './constants';

function initAnimate(Heatmap) {
    Object.assign(Heatmap.prototype, {
        buildAnimation({ fps = 20, processor = x => x, converter = x => x, initData } = {}) {
            let interval = 1000 / fps;
            let requestId, then, data;
            const freshCanvas = () => {
                requestId = window.requestAnimationFrame(freshCanvas.bind(this));
                let now = Date.now();
                let elapsed = now - then;
                if (elapsed > interval) {
                    data = processor(data);
                    this.update(converter(data));
                    then = now;
                }
            }
            return {
                start: (_data = initData) => {
                    data = _data;
                    then = Date.now();
                    if (!requestId) {
                        freshCanvas();
                    }
                },
                stop: () => {
                    if (requestId) {
                        window.cancelAnimationFrame(requestId);
                        requestId = null;
                    }
                }
            }
        },
        update(newdata) {
            if (!this.data) {
                this.draw({ data: newdata });
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
                if (this._checkPosition(x0)) {
                    // assign to keep
                    if (x1[3]) {
                        needkeep.push(x0);
                        newdata[i] = x0;
                    } else if (x1[0] && x1[1] && (x0[0] === x1[0]) && (x0[1] === x1[1])) {
                        needkeep.push(x0);
                    } else if (this._checkPosition(x1)) {
                        needupdatePrev.push(x0);
                        needupdate.push(x1);
                        // if x1 has been deleted
                    } else {
                        needupdatePrev.push(x0);
                    }
                    // if x1 is new
                } else if (this._checkPosition(x1)) {
                    needupdate.push(x1);
                }
            }
            let all = [...needupdatePrev, ...needupdate];
            if (all.length > 0) {
                this.data = newdata;
                return this.draw({ data: [...needupdate, ...needkeep], ...this._getMinReDrawSection(all) });
            }
        },
        _checkPosition(item) {
            let x, y;
            return (item && (x = item[0]) >= 0 && x < this.width && (y = item[1]) >= 0 && y < this.height)
        },
        _getTempCtx() {
            if (!this.__ctx) {
                let _canvas = document.createElement('canvas');
                _canvas.width = this.width;
                _canvas.height = this.height;
                this.__ctx = _canvas.getContext('2d');
            } else {
                this.__ctx.clearRect(0, 0, this.width, this.height);
            }
            return this.__ctx;
        },
        _getMinReDrawSection(data) {
            // find the minimal section to be cleared
            let xseries = data.map(x => x[0]);
            let yseries = data.map(x => x[1]);
            let r = this.r;
            let maxX = Math.ceil(Math.max(...xseries) + r);
            let minX = Math.floor(Math.min(...xseries) - r);
            let maxY = Math.ceil(Math.max(...yseries) + r);
            let minY = Math.floor(Math.min(...yseries) - r);
            let dx = minX > 0 ? minX : 0;
            let dy = minY > 0 ? minY : 0;
            let width = maxX - minX;
            let height = maxY - minY;
            return {
                dx,
                dy,
                width,
                height
            }
        }
    })
}
initAnimate(Heatmap);
export default Heatmap;
