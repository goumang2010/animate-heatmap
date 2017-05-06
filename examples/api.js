var mockdata = require('./mock/heatdata');
export default {
    getHeatData(data) {
        return Promise.resolve(mockdata).then(function(res) {
            if (res.code !== '200' || res.iserror !== '0') {
                return Promise.reject('Fail to get heat data' + res.msg);
            }
            var data;
            if (res && (data = res.data) && (data = data.result) && data.length) {
                // data = data.filter(x => /a(\d|[0-2]\d)$/.test(x.pointName));
                // data = data.filter(x => /a83$/.test(x.pointName));
				// data = data.filter(x => /(a14[67]|a49|a50|a51|a52)$/.test(x.pointName));		
                // data = data.filter(x => /(a26)$/.test(x.pointName));		
                return data;
            } else {
                return Promise.reject('No heat info!');
            }
        }).catch(function(err) {
            console.error(err);
        });
    }
}
