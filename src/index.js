import Heatmap from './heatmap';
import { groupPoints, getPointsRect } from '../src/utils';

function initAnimate(Heatmap) {
    Object.assign(Heatmap.prototype, {
        buildAnimation(params) {
            let _requestId, _interval, _processor, _converter, _data, then;
            const freshCanvas = () => {
                _requestId = window.requestAnimationFrame(freshCanvas.bind(this));
                let now = Date.now();
                let elapsed = now - then;
                if (elapsed > _interval) {
                    _data = _processor(_data);
                    this.update(_converter(_data));
                    then = now;
                }
            }
            const setParams = ({ fps, processor, converter, data }) => {
                fps && (_interval = 1000 / fps) || _interval || (_interval = 50);
                processor && (_processor = processor) || _processor || (_processor = x => x);
                converter && (_converter = converter) || _converter || (_converter = x => x);
                data && (_data = data);
            }
            setParams(params);
            return {
                reset: setParams,
                start: (data) => {
                    data && (_data = data);
                    then = Date.now();
                    if (!_requestId) {
                        freshCanvas();
                    }
                },
                stop: () => {
                    if (_requestId) {
                        window.cancelAnimationFrame(_requestId);
                        _requestId = null;
                    }
                }
            }
        },
        update(newdata) {
            if (!this.data) {
                this.variance = 4 * this.r * this.r;
                // only render visible points
                this.drawArea({ data: newdata.filter(x => x[3]) });
                newdata.forEach(x => (x[5] = !x[3]));
                this.data = newdata;
                return;
            }
            let len;
            if (!Array.isArray(newdata) || ((len = newdata.length) !== this.data.length)) {
                throw new Error('data array of same length required!');
            }
            // contains points those are visible and might effect redrawing.
            let needKeep = [];
            // draw these points
            let needDraw = [];
            // remove these points
            let needErease = [];
            // slinet and visible
            let silentExisted = [];
            for (let i = 0; i < len; i++) {
                // item[0] -> X; item[1] -> Y; item[3] -> visible in view; item[4] -> silent point(out of view); item[5] -> if has been deleted;
                let x0 = this.data[i];
                let x1 = newdata[i];
                // item[5] -> if deleted, then true, else false. Inherit last state.
                x1[5] = x0[5];
                // skip slient point
                if (x1[4]) {
                    if (!x0[5]) {
                        silentExisted.push(x1);
                    }
                    continue;
                }
                // point that visible
                if (x1[3]) {
                    x1[5] = false;
                    if (x0[5]) {
                        // x0 has been deleted, then create it
                        needDraw.push(x1);
                    } else if ((x0[0] === x1[0]) && (x0[1] === x1[1])) {
                        // position is the same, keep it
                        needKeep.push(x1);
                    } else {
                        // point has been moved
                        needErease.push(x0);
                        needDraw.push(x1);
                    }
                } else {
                    // point is not visible now, we need remove it or keep it.
                    if (x0[5]) {
                        // already deleted, just leave it alone
                    } else {
                        // ever exist, now inbisible
                        needErease.push(x0);
                        x1[5] = true;
                    }
                }
            }
            // deleted points might at the silent area
            if (needErease.length) {
                needKeep.push(...silentExisted);
            }
            let all = [...needErease, ...needDraw];
            if (all.length > 0) {
                // console.time('update');
                this.data = newdata;
                needDraw.push(...needKeep)
                needDraw = needDraw.filter(x => this._checkPosition(x));
                // group the points
                let results = groupPoints(all);
                for (let res of results) {
                    this.drawArea({ data: needDraw, ...getPointsRect(res, this.r) });
                }
                // console.timeEnd('update');
            }
        },
        _checkPosition(item) {
            let x, y;
            return (item && (x = item[0]) >= 0 && x < this.width && (y = item[1]) >= 0 && y < this.height)
        }
    })
}
initAnimate(Heatmap);
export default Heatmap;
