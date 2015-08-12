const assert = require('assert');
const co = require('co');
const moment = require('moment');
const SimpleInOut = require("../index");

var client = new SimpleInOut({
  client_id: process.env.SIMPLE_IN_OUT_CLIENT_ID,
  client_secret: process.env.SIMPLE_IN_OUT_CLIENT_SECRET,
  access_token: process.env.SIMPLE_IN_OUT_ACCESS_TOKEN,
  refresh_token: process.env.SIMPLE_IN_OUT_REFRESH_TOKEN
});

describe('Simple In/Out', function() {
  this.timeout(5000);
  //it('should get a new access and request token.', co.wrap(function*() {
  //  var result = yield client.get_access_token();
  //  console.log(result);
  //}));
  it('should verify the API client is configured correctly.', co.wrap(function*() {
    var result = yield client.ok();
    assert(result.version);
  }));
  it('should retrieve the company’s information.', co.wrap(function*() {
    var result = yield client.company();
    assert(result.version);
    assert(result.name);
  }));
  it('should retrieve the company’s geofences.', co.wrap(function*() {
    var result = yield client.fences();
    assert(result.version);
    assert(result.fences);
  }));
  it('should retrieve the company’s groups.', co.wrap(function*() {
    var result = yield client.groups();
    assert(result.version);
    assert(result.groups);
  }));
  it('should retrieve the company’s statuses.', co.wrap(function*() {
    var result = yield client.statuses();
    assert(result.version);
    assert(result.users);
  }));
  it('should retrieve users.', co.wrap(function*() {
    var current_user = yield client.current_user();
    assert(current_user.version);
    assert(current_user.user.id);
    var user = yield client.user(current_user.user.id);
    assert(current_user.version);
    assert.equal(current_user.user.id, user.user.id);
    var query_parameters = {
      start_date: moment().subtract(7, 'days').format("MM/DD/YYYY"),
      end_date: moment().format("MM/DD/YYYY")
    };
    var statuses = yield client.user_statuses(current_user.user.id, query_parameters);
    assert(statuses.total);
  }));
});
