const assert = require('assert');
const co = require('co');
const moment = require('moment');
const SimpleInOut = require("../index");

const s3_client = new SimpleInOut({
  client_id: process.env.SIMPLE_IN_OUT_CLIENT_ID,
  client_secret: process.env.SIMPLE_IN_OUT_CLIENT_SECRET,
  redirect_uri: process.env.SIMPLE_IN_OUT_REDIRECT_URI,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  aws_s3_bucket: process.env.SIMPLE_IN_OUT_CREDENTIALS_S3_BUCKET,
  aws_s3_key: process.env.SIMPLE_IN_OUT_CREDENTIALS_S3_KEY
});

describe('Simple In/Out with S3 Credential Storage', function() {
  this.timeout(5000);
  it('should request access and request tokens.', co.wrap(function*() {
    var credentials = yield s3_client.get_access_token(process.env.SIMPLE_IN_OUT_AUTHORIZATION_CODE);
    assert(credentials.access_token);
    assert(credentials.refresh_token);
  }));
  it('should get access and request tokens stored on S3.', co.wrap(function*() {
    var credentials = yield s3_client.get_access_token();
    assert(credentials.access_token);
    assert(credentials.refresh_token);
  }));
  it('should refresh the access token and store them on AWS S3.', co.wrap(function*() {
    var credentials = yield s3_client.refresh_access_token();
    assert(credentials.access_token);
    assert(credentials.refresh_token);
  }));
  it('should set credentials', co.wrap(function*() {
    var credentials = yield s3_client.set_credentials({access_token: s3_client.access_token, refresh_token: s3_client.refresh_token});
    assert(credentials.access_token);
    assert(credentials.refresh_token);
  }));
  it('should verify the API client is configured correctly.', co.wrap(function*() {
    var result = yield s3_client.ok();
    assert(result.version);
  }));
  it('should retrieve the company’s information.', co.wrap(function*() {
    var result = yield s3_client.company();
    assert(result.version);
    assert(result.name);
  }));
  it('should retrieve the company’s geofences.', co.wrap(function*() {
    var result = yield s3_client.fences();
    assert(result.version);
    assert(result.fences);
  }));
  it('should retrieve the company’s groups.', co.wrap(function*() {
    var result = yield s3_client.groups();
    assert(result.version);
    assert(result.groups);
  }));
  it('should retrieve the company’s statuses.', co.wrap(function*() {
    var result = yield s3_client.statuses();
    assert(result.version);
    assert(result.users);
  }));
  it('should retrieve users.', co.wrap(function*() {
    var current_user = yield s3_client.current_user();
    assert(current_user.version);
    assert(current_user.user.id);
    var user = yield s3_client.user(current_user.user.id);
    assert(current_user.version);
    assert.equal(current_user.user.id, user.user.id);
    var query_parameters = {
      start_date: moment().subtract(7, 'days').format("MM/DD/YYYY"),
      end_date: moment().format("MM/DD/YYYY")
    };
    var statuses = yield s3_client.user_statuses(current_user.user.id, query_parameters);
    assert(statuses.total);
  }));
  it('should get access and request tokens stored on S3 without initialization.', co.wrap(function*() {
    const temp_s3_client = new SimpleInOut({
      client_id: process.env.SIMPLE_IN_OUT_CLIENT_ID,
      client_secret: process.env.SIMPLE_IN_OUT_CLIENT_SECRET,
      redirect_uri: process.env.SIMPLE_IN_OUT_REDIRECT_URI,
      aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
      aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
      aws_s3_bucket: process.env.SIMPLE_IN_OUT_CREDENTIALS_S3_BUCKET,
      aws_s3_key: process.env.SIMPLE_IN_OUT_CREDENTIALS_S3_KEY
    });
    var result = yield temp_s3_client.ok();
    assert(result.version);
  }));
  it('should set credentials on client without S3.', co.wrap(function*() {
    const temp_client = new SimpleInOut({
      client_id: process.env.SIMPLE_IN_OUT_CLIENT_ID,
      client_secret: process.env.SIMPLE_IN_OUT_CLIENT_SECRET,
      redirect_uri: process.env.SIMPLE_IN_OUT_REDIRECT_URI,
      access_token: s3_client.access_token,
      refresh_token: s3_client.refresh_token
    });
    var result_1 = yield temp_client.ok();
    assert(result_1.version);
    var credentials = yield temp_client.set_credentials({access_token: s3_client.access_token, refresh_token: s3_client.refresh_token});
    assert(credentials.access_token);
    assert(credentials.refresh_token);
    var result_2 = yield temp_client.ok();
    assert(result_2.version);
  }));
});
