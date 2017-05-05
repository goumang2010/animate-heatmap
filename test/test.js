import chaiPromised from 'chai-as-promised';
import Heatmap from '../src';
import * as utils from '../src/utils';
chai.use(chaiPromised);
const expect = chai.expect;

describe('Heatmap instance', function() {
    it('should find inject script in html', function(done) {
        let heatmap = new Heatmap();
        expect(heatmap.option).to.exist;
        done();
    });
});

describe('utils', function() {
    it('groupPoints should work', function(done) {
        let result = utils.groupPoints([[1,2], [3,4], [101,102],[103,104]], 10)
        expect(result.length).to.equal(2);
        done();
    });
});
