import Heatmap from './heatmap';
import { STATE, samePoint, getPosSymbol, createPointsKeyToIdx, createPointsPosToIdx, groupPoints, getPointsRect } from '../src/utils';

function initAnimate(Heatmap) {
    Object.assign(Heatmap.prototype, {
        buildAnimation(params) {
            this.variance = 4 * this.r * this.r;
            let _requestId, _interval, _processor, _converter, _data, then;
            const freshCanvas = () => {
                _requestId = window.requestAnimationFrame(freshCanvas);
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
                // this.data = null;
            }
            setParams(params);
            return {
                reset: setParams,
                clear: () => {
                    this.data = null;
                },
                render: (data) => {
                    data && (_data = data);
                    _data = _processor(_data);
                    this.render(_converter(_data));
                },
                start: (data) => {
                    data && (_data = data);
                    then = Date.now();
                    if (!_requestId) {
                        freshCanvas();
                    }
                    return this;
                },
                stop: () => {
                    if (_requestId) {
                        window.cancelAnimationFrame(_requestId);
                        _requestId = null;
                    }
                    return this;
                }
            }
        },
        render(newdata) {
            // only render visible points
            this.drawArea({ data: newdata.filter(x => x[3] && this._checkPosition(x)) });
            newdata.forEach(x => (x[6] = !x[3]));
            this.data = newdata;
        },
        update(newData, oldData = this.data) {
            if (!Array.isArray(newData)) {
                throw new Error('data is required to be an array!');
            }
            newData = newData.filter(x => this._checkPosition(x));
            if (!oldData) {
                this.render(newData);
                return;
            }
            // contains points those are visible and might effect redrawing.
            let needKeep = [];
            // draw these points
            let needDraw = [];
            // remove these points
            let needErease = [];
            // slinet and visible
            let silentExisted = [];
            const patchPoint = (x0, x1, state) => {
                let samePosition;
                if(state === STATE.SAME_POS) {
                    samePosition = true;
                }
                // item[0] -> X; item[1] -> Y; item[2] -> value;  item[3] -> visible in view; item[4] -> silent point(out of view); item[5] -> key; item[6] -> if has been deleted; 
                // item[5] -> if deleted, then true, else false. Inherit last state.
                x1[6] = x0[6];
                // skip slient point
                if (x1[4]) {
                    if (!x0[6]) {
                        silentExisted.push(x1);
                    }
                    return;
                }
                // point that visible
                if (x1[3] && this._checkPosition(x1)) {
                    x1[6] = false;
                    if (x0[6]) {
                        // x0 has been deleted, then create it
                        needDraw.push(x1);
                    } else if ((samePosition || x0[0] === x1[0] && x0[1] === x1[1]) && (x0[2] === x1[2])) {
                        // position is the same, keep it
                        needKeep.push(x1);
                    } else {
                        // point has been moved
                        needErease.push(x0);
                        needDraw.push(x1);
                    }
                } else {
                    // point is not visible now, we need remove it or keep it.
                    if (x0[6]) {
                        // already deleted, just leave it alone
                    } else {
                        // ever exist, now inbisible
                        needErease.push(x0);
                        x1[6] = true;
                    }
                }
            }
            /**
             * Virtual DOM patching algorithm based on Snabbdom by
             * Simon Friis Vindum (@paldepind)
             * Licensed under the MIT License
             * https://github.com/paldepind/snabbdom/blob/master/LICENSE
             *
             * modified by Evan You (@yyx990803)
             */
            let oldStartIdx = 0
            let newStartIdx = 0
            let oldEndIdx = oldData.length - 1
            let oldStartPoint = oldData[0]
            let oldEndPoint = oldData[oldEndIdx]
            let newEndIdx = newData.length - 1
            let newStartPoint = newData[0]
            let newEndPoint = newData[newEndIdx]
            let oldKeyToIdx, keyIdxInOld;
            let state;
            while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
                if (state = samePoint(oldStartPoint, newStartPoint)) {
                    patchPoint(oldStartPoint, newStartPoint, state)
                    oldStartPoint = oldData[++oldStartIdx]
                    newStartPoint = newData[++newStartIdx]
                } else if (state = samePoint(oldEndPoint, newEndPoint)) {
                    patchPoint(oldEndPoint, newEndPoint, state)
                    oldEndPoint = oldData[--oldEndIdx]
                    newEndPoint = newData[--newEndIdx]
                } else if (state = samePoint(oldStartPoint, newEndPoint)) { // Point moved right
                    patchPoint(oldStartPoint, newEndPoint, state)
                    oldStartPoint = oldData[++oldStartIdx]
                    newEndPoint = newData[--newEndIdx]
                } else if (state = samePoint(oldEndPoint, newStartPoint)) { // Point moved left
                    patchPoint(oldEndPoint, newStartPoint, state)
                    oldEndPoint = oldData[--oldEndIdx]
                    newStartPoint = newData[++newStartIdx]
                } else {
                    if (oldKeyToIdx == null) oldKeyToIdx = createPointsKeyToIdx(oldData, oldStartIdx, oldEndIdx)
                    keyIdxInOld = oldKeyToIdx[newStartPoint[5] || getPosSymbol(newStartPoint)];
                    if (keyIdxInOld == null) { // New element
                        !newStartPoint[4] && needDraw.push(newStartPoint);
                        newStartPoint = newData[++newStartIdx]
                    } else {
                        patchPoint(oldData[keyIdxInOld], newStartPoint)
                        newStartPoint = newData[++newStartIdx]
                    }

                }
            }
            if (oldStartIdx > oldEndIdx) {
                for (; newStartIdx <= newEndIdx; ++newStartIdx) {
                    needDraw.push(newData[newStartIdx]);
                }
            } else if (newStartIdx > newEndIdx) {
                for (; oldStartIdx <= oldEndIdx; ++oldStartIdx) {
                    needErease.push(oldData[oldStartIdx]);
                }
            }
            // deleted points might at the silent area
            if (needErease.length) {
                needKeep.push(...silentExisted);
            }
            let all = [...needErease, ...needDraw];
            if (all.length > 0) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log('points:' + all.length)
                    console.time('update');
                }
                this.data = newData;
                needDraw.push(...needKeep);
                // group the points
                let results = groupPoints(all, this.variance);
                for (let res of results) {
                    this.drawArea({ data: needDraw, ...getPointsRect(res, this.r) });
                }
                if (process.env.NODE_ENV !== 'production') {
                    console.log('blocks:' + results.length)
                    console.timeEnd('update');
                }
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
