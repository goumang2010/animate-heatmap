var mockdata = require('./mock/heatdata');
export default {
    getHeatData(data) {
        return Promise.resolve(mockdata).then(function(res) {
            if (res.code !== '200' || res.iserror !== '0') {
                return Promise.reject('Fail to get heat data' + res.msg);
            }
            var data;
            if (res && (data = res.data) && (data = data.result) && data.length) {
                // data = data.filter(x => x.pointName.includes('-a0'));
                return data;
            } else {
                return Promise.reject('No heat info!');
            }
        }).catch(function(err) {
            console.error(err);
        });
    }
}
