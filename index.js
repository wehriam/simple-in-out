const superagent = require("superagent");
const AWS = require('aws-sdk');

const SimpleInOut = function(options){
  if(!options.client_id) {
    throw new Error("Missing required parameter 'client_id'");
  }
  if(!options.client_secret) {
    throw new Error("Missing required parameter 'client_secret'");
  }
  if(!options.redirect_uri) {
    throw new Error("Missing required parameter 'redirect_uri'");
  }
  this.client_id = options.client_id;
  this.client_secret = options.client_secret;
  this.redirect_uri = options.redirect_uri;
  this.access_token = options.access_token || null;
  this.refresh_token = options.refresh_token || null;
  if(options.aws_access_key_id || options.aws_secret_access_key || options.aws_s3_bucket || options.aws_s3_key) {
    if(!options.aws_access_key_id) {
      throw new Error("Missing required parameter 'aws_secret_access_key'");
    }
    if(!options.aws_secret_access_key) {
      throw new Error("Missing required parameter 'aws_secret_access_key'");
    }
    if(!options.aws_s3_bucket) {
      throw new Error("Missing required parameter 'aws_s3_bucket'");
    }
    if(!options.aws_s3_key) {
      throw new Error("Missing required parameter 'aws_s3_key'");
    }
    this._aws_s3_bucket = new AWS.S3({
      accessKeyId: options.aws_access_key_id,
      secretAccessKey: options.aws_secret_access_key,
      params: {
        Key: options.aws_s3_key,
        Bucket: options.aws_s3_bucket,
        ContentType: "application/json"
      }
    });
  }
};

SimpleInOut.prototype.get_access_token = function(authorization_code){
  if(!authorization_code) {
    if(this._aws_s3_bucket) {
      return this.get_credentials_from_aws_s3();
    } else {
      throw new Error("Missing required parameter 'authorization_code'");
    }
  }
  const options = {
    grant_type: "authorization_code",
    client_id: this.client_id,
    client_secret: this.client_secret,
    redirect_uri: this.redirect_uri,
    code: authorization_code
  };
  var client = this;
  return new Promise(function(resolve, reject){
    superagent
      .post("https://www.simpleinout.com/oauth/token")
      .type('form')
      .send(options)
      .set('Accept', 'application/json')
      .end(function(error, response){
        if(error) {
          return reject(error);
        }
        return resolve(JSON.parse(response.text));
      });
  }).then(function(result){
    return client.set_credentials(result);
  }, function(error){
    if(error.status === 401 && client._aws_s3_bucket) {
      return client.get_credentials_from_aws_s3();
    }
    if(typeof error.message === "string") {
      error.message = "Get Access Token: "  + error.message;
    }
    throw error;
  });
};

SimpleInOut.prototype.get_credentials_from_aws_s3 = function(){
  if(!this._aws_s3_bucket) {
    throw new Error("Missing required constructor parameters aws_access_key_id, aws_secret_access_key, aws_s3_bucket, and aws_s3_key.");
  }
  var client = this;
  return new Promise(function(resolve, reject){
    client._aws_s3_bucket.getObject({}, function(error, data) {
      if(error) {
        if(typeof error.message === "string") {
          error.message = "Get Credentials From S3: "  + error.message;
        }
        return reject(error);
      }
      var result = JSON.parse(data.Body);
      if(!result.access_token) {
        throw new Error("S3 credentials missing required property 'access_token'");
      }
      if(!result.refresh_token) {
        throw new Error("S3 credentials missing required property 'refresh_token'");
      }
      client.access_token = result.access_token;
      client.refresh_token = result.refresh_token;
      return resolve(result);
    });
  });
};

SimpleInOut.prototype.set_credentials = function(options){
  if(!options.access_token) {
    throw new Error("Missing required parameter 'access_token'");
  }
  if(!options.refresh_token) {
    throw new Error("Missing required parameter 'refresh_token'");
  }
  this.access_token = options.access_token;
  this.refresh_token = options.refresh_token;
  if(!this._aws_s3_bucket) {
    return Promise.resolve(options);
  }
  var client = this;
  return new Promise(function(resolve, reject){
    client._aws_s3_bucket.putObject({
      Body: new Buffer(JSON.stringify(options))
    }, function(error, data) {
      if(error) {
        if(typeof error.message === "string") {
          error.message = "Set Credentials: "  + error.message;
        }
        return reject(error);
      }
      resolve(options);
    });
  });
};

SimpleInOut.prototype.refresh_access_token = function(attempt){
  var client = this;
  attempt = attempt || 1;
  if(!this.refresh_token) {
    if(this._aws_s3_bucket) {
      return this.get_credentials_from_aws_s3().then(function(){
        return client.refresh_access_token();
      });
    } else {
      throw new Error("No refresh token.");
    }
  }
  const options = {
    grant_type: "refresh_token",
    client_id: this.client_id,
    client_secret: this.client_secret,
    refresh_token: this.refresh_token
  };
  return new Promise(function(resolve, reject){
    superagent
      .post("https://www.simpleinout.com/oauth/token")
      .type('form')
      .send(options)
      .set('Accept', 'application/json')
      .end(function(error, response){
        if(error) {
          if(typeof error.message === "string") {
            error.message = "Refresh Token: "  + error.message;
          }
          return reject(error);
        }
        return resolve(JSON.parse(response.text));
      });
  }).then(function(result){
    return client.set_credentials(result);
  }, function(error){
    if(error.status === 401 && client._aws_s3_bucket && attempt < 2) {
      return client.get_credentials_from_aws_s3().then(function(){
        return client.refresh_access_token(attempt + 1);
      });
    } else {
      throw error;
    }
  });
};

SimpleInOut.prototype._get = function(path, query_parameters, attempt){
  var client = this;
  if(!this.access_token) {
    if(this._aws_s3_bucket) {
      return this.get_credentials_from_aws_s3().then(function(){
        return client._get(path, query_parameters, attempt);
      });
    } else {
      throw new Error("No access token.");
    }
  }
  const access_token = this.access_token;
  query_parameters = query_parameters || {};
  attempt = attempt || 1;
  return new Promise(function(resolve, reject) {
    superagent
      .get("https://www.simpleinout.com" + path)
      .query(query_parameters)
      .set('Authorization', 'Bearer ' + access_token)
      .set('Accept', 'application/json')
      .end(function(error, response){
        if(error) {
          return reject(error);
        }
        return resolve(JSON.parse(response.text));
      });
  }).catch(function(error){
    if(error.status === 401 && attempt < 2) {
      return client.refresh_access_token().then(function(){
        return client._get(path, query_parameters, attempt + 1);
      });
    } else {
      if(typeof error.message === "string") {
        error.message = "Get " + path + ": "  + error.message;
      }
      throw error;
    }
  });
};

SimpleInOut.prototype.ok = function(){
  return this._get("/api/v2/ok");
};

SimpleInOut.prototype.company = function(){
  return this._get("/api/v2/company");
};

SimpleInOut.prototype.fences = function(){
  return this._get("/api/v2/fences");
};

SimpleInOut.prototype.groups = function(){
  return this._get("/api/v2/groups");
};

SimpleInOut.prototype.statuses = function(query_parameters){
  return this._get("/api/v2/statuses", query_parameters);
};

SimpleInOut.prototype.current_user = function(){
  return this._get("/api/v2/users/current");
};

SimpleInOut.prototype.user = function(user_id){
  return this._get("/api/v2/users/" + user_id);
};

SimpleInOut.prototype.user_statuses = function(user_id, query_parameters){
  return this._get("/api/v2/users/" + user_id + "/statuses", query_parameters);
};

module.exports = SimpleInOut;

