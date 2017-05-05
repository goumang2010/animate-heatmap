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
