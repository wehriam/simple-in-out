Simple In/Out API Wrapper for Node.js
=====================================

See [Simple In/Out API documentation](http://www.simplymadeapps.com/developers/simpleinout/) for more details.

## Installation

```
npm install simple-in-out
```

## Usage

Compatible with Node.js >= 0.12.0 or io.js >= 1.0.0.

### With AWS S3 Credential Storage

```js
var SimpleInOut = require("simple-in-out");

var client_a = new SimpleInOut({
  client_id: process.env.SIMPLE_IN_OUT_CLIENT_ID,
  client_secret: process.env.SIMPLE_IN_OUT_CLIENT_SECRET,
  redirect_uri: process.env.SIMPLE_IN_OUT_REDIRECT_URI,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  aws_s3_bucket: process.env.SIMPLE_IN_OUT_CREDENTIALS_S3_BUCKET,
  aws_s3_key: process.env.SIMPLE_IN_OUT_CREDENTIALS_S3_KEY
});

var client_b = new SimpleInOut({
  client_id: process.env.SIMPLE_IN_OUT_CLIENT_ID,
  client_secret: process.env.SIMPLE_IN_OUT_CLIENT_SECRET,
  redirect_uri: process.env.SIMPLE_IN_OUT_REDIRECT_URI,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  aws_s3_bucket: process.env.SIMPLE_IN_OUT_CREDENTIALS_S3_BUCKET,
  aws_s3_key: process.env.SIMPLE_IN_OUT_CREDENTIALS_S3_KEY
});

client_a.get_access_token(process.env.SIMPLE_IN_OUT_AUTHORIZATION_CODE).then(function(){
  // Credentials are stored on AWS S3 after initialization with authorization code
  return client_a.ok();
}).then(function(result){
  assert(result.version);
  // Credentials fetched from AWS S3
  return client_b.ok();
}).then(function(result){
  assert(result.version);
});
```

### Without AWS S3 Credential Storage

With an authorization code:

```js
var SimpleInOut = require("simple-in-out");

var client_a = new SimpleInOut({
  client_id: process.env.SIMPLE_IN_OUT_CLIENT_ID,
  client_secret: process.env.SIMPLE_IN_OUT_CLIENT_SECRET,
  redirect_uri: process.env.SIMPLE_IN_OUT_REDIRECT_URI
});

var client_b = new SimpleInOut({
  client_id: process.env.SIMPLE_IN_OUT_CLIENT_ID,
  client_secret: process.env.SIMPLE_IN_OUT_CLIENT_SECRET,
  redirect_uri: process.env.SIMPLE_IN_OUT_REDIRECT_URI
});

client_a.get_access_token(process.env.SIMPLE_IN_OUT_AUTHORIZATION_CODE).then(function(credentials){
  // Credentials can be set directly, bypassing get_access_token()
  return client_b.set_credentials(credentials);
}).then(function(){
  return client_a.ok();
}).then(function(result){
  assert(result.version);
  return client_b.ok();
}).then(function(result){
  assert(result.version);
});
```

With access and refresh tokens:

```js
var SimpleInOut = require("simple-in-out");

var client = new SimpleInOut({
  client_id: process.env.SIMPLE_IN_OUT_CLIENT_ID,
  client_secret: process.env.SIMPLE_IN_OUT_CLIENT_SECRET,
  redirect_uri: process.env.SIMPLE_IN_OUT_REDIRECT_URI,
  access_token: process.env.SIMPLE_IN_OUT_ACCESS_TOKEN,
  refresh_token: process.env.SIMPLE_IN_OUT_REFRESH_TOKEN
});

client.ok().then(function(result){
  assert(result.version);
});
```

## API

All methods return native promises.

### new SimpleInOut(options)

Simple In/Out API client constructor.

__Required:__

 * `options.client_id`: Simple In/Out application ID string.
 * `options.client_secret`: Simple In/Out secret string.
 * `options.redirect_uri`: Simple In/Out redirect URI.

__Required for AWS S3 credential storage:__

 * `options.aws_access_key_id`: Amazon AWS access key ID string.
 * `options.aws_secret_access_key`: Amazon AWS secret access key string.
 * `options.aws_s3_bucket`: Amazon AWS S3 bucket name string. Bucket must exist.
 * `options.aws_s3_key`: Amazon AWS S3 key string.

__Optional:__

 * `options.access_token`: Simple In/Out access token.
 * `options.refresh_token`: Simple In/Out refresh token.

### .get_access_token([authorization_code])

Get access and refresh tokens via oAuth2 flow or from AWS S3 credential storage.

__Required for use without AWS S3 credential storage, or when intializing with AWS S3 credential storage:__

 * `authorization_code`: Authorization code from Simple In/Out oAuth2 flow.

### .get_credentials_from_aws_s3()

Get access and refresh tokens from AWS S3 credential storage.

### .set_credentials(options)

Set access and refresh tokens. Stores credentials when used with AWS S3 credential storage.

__Required:__

 * `options.access_token`: Simple In/Out access token.
 * `options.refresh_token`: Simple In/Out refresh token.

### .refresh_access_token()

Refresh access token. Stores credentials when used with AWS S3 credential storage.

### .ok()

Verify your API client. [See Simple In/Out documentation for additional details.](http://www.simplymadeapps.com/developers/simpleinout/index.html#ok)

### .company()

Retrieve company information. [See Simple In/Out documentation for additional details.](http://www.simplymadeapps.com/developers/simpleinout/index.html#company)

### .fences()

Retrieve company geofences. [See Simple In/Out documentation for additional details.](http://www.simplymadeapps.com/developers/simpleinout/index.html#geofences)

### .groups()

Retrieve company groups. [See Simple In/Out documentation for additional details.](http://www.simplymadeapps.com/developers/simpleinout/index.html#groups)

### .statuses([query_parameters])

Retrieve current statuses. [See Simple In/Out documentation for additional details.](http://www.simplymadeapps.com/developers/simpleinout/index.html#statuses)

__Optional:__

 * `query_parameters.group_id`: Group ID to restrict the list of statuses.

### .current_user()

Retrieve current user. [See Simple In/Out documentation for additional details.](http://www.simplymadeapps.com/developers/simpleinout/index.html#get-the-current-user)

### .user(user_id)

Retrieve a user. [See Simple In/Out documentation for additional details.](http://www.simplymadeapps.com/developers/simpleinout/index.html#get-user)

__Required:__

 * `user_id`: User ID.

### .user_statuses(user_id, query_parameters)

Retrieve a user's usage statistics. [See Simple In/Out documentation for additional details.](http://www.simplymadeapps.com/developers/simpleinout/index.html#get-user-statuses)

__Required:__

 * `user_id`: User ID.
 * `query_parameters.start_date`: Start date to begin with. String in the format `MM/DD/YYYY`.
 * `query_parameters.end_date`: End date of statuses, no more than 31 days from start_date, in the format `MM/DD/YYYY`.

__Optional:__

 * `query_parameters.comment`: Only consider “in” statuses with this comment as “in”. String.
 * `query_parameters.expanded`: Set to true if all statuses are to be included, otherwise defaults to aggregate statistics. Boolean.

## Testing

 * Copy `run-tests.sh.sample` to `run-tests.sh`.
 * Generate an authorization code via the Simple In/Out oAuth2 flow: `https://www.simpleinout.com/oauth/authorize?response_type=code&client_id=XXXXXXXX&redirect_uri=XXXXXXXX`
 * Edit `run-tests.sh` to include AWS credentials, Simple In/Out credentials, and the authorization code.
 * Run `npm test`
