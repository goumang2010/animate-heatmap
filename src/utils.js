export function groupPoints(arr, variance) {
    let groups = [];
    while (arr.length) {
        let _g = [arr.shift()];
        let k = 0;
        while (k < _g.length) {
            let p = _g[k];
            let i = 0;
            while (i < arr.length) {
                let x = arr[i];
                if (Math.pow(x[0] - p[0], 2) + Math.pow(x[1] - p[1], 2) < variance) {
                    _g.push(x);
                    arr.splice(i, 1);
                } else {
                    i++;
                }
            }
            k++;
        }
        groups.push(_g);
    }
    return groups;
}
export function filterPoints(points, { minX, minY, maxX, maxY }) {
    let remains = [],
        hits = [];
    for (let p of points) {
        let [x, y] = p;
        // filter the point that has no effect
        if (x < minX || y < minY || x > maxX || y > maxY) {
            remains.push(p);
        } else {
            hits.push(p);
        }
    }
    return {
        hits,
        remains
    }
}
export function mergeRects(rects) {
    if (rects.length <= 1) {
        return rects;
    }
    let groups = [];
    while (rects.length) {
        let _g = [rects.shift()];
        let k = 0;
        while (k < _g.length) {
            let p = _g[k];
            let i = 0;
            while (i < rects.length) {
                let x = rects[i];
                let vx = Math.pow(x.width + p.width, 2) / 4;
                let vy = Math.pow(x.height + p.height, 2) / 4;
                if (Math.pow(x.cx - p.cx, 2) < vx && Math.pow(x.cy - p.cy, 2) < vy) {
                    _g.push(x);
                    rects.splice(i, 1);
                } else {
                    i++;
                }
            }
            k++;
        }
        //merge rect 
        let largeRect;
        if (_g.length > 1) {
            largeRect = _g.reduce((a, x) => {
                let temp;
                (a.dx > x.dx) && (a.dx = x.dx);
                (a.width < (temp = x.dx + x.width - a.dx)) && (a.width = temp);
                (a.dy > x.dy) && (a.dy = x.dy);
                (a.height < (temp = x.dy + x.height - a.dy)) && (a.height = temp);
                return a;
            });
        } else {
            largeRect = _g[0];
        }
        groups.push(largeRect);
    }
    return groups;
}
export function getPointsRect(data, border = 0) {
    let xseries = data.map(x => x[0]).filter(Boolean);
    let yseries = data.map(x => x[1]).filter(Boolean);
    // find the minimal section to be cleared
    if (xseries.length && yseries.length) {
        let maxX = Math.ceil(Math.max(...xseries) + border);
        let minX = Math.floor(Math.min(...xseries) - border);
        let maxY = Math.ceil(Math.max(...yseries) + border);
        let minY = Math.floor(Math.min(...yseries) - border);
        let dx = minX > 0 ? minX : 0;
        let dy = minY > 0 ? minY : 0;
        let width = maxX - minX;
        let height = maxY - minY;
        return {
            dx,
            dy,
            cx: dx + width / 2,
            cy: dy + height / 2,
            width,
            height
        };
    }
    return {};
}
