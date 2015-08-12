const superagent = require("superagent");

const SimpleInOut = function(options){
  if(!options.client_id) {
    throw new Error("Missing required parameter 'client_id'");
  }
  if(!options.client_secret) {
    throw new Error("Missing required parameter 'client_secret'");
  }
  this.client_id = options.client_id;
  this.client_secret = options.client_secret;
  this.access_token = options.access_token || null;
  this.refresh_token = options.refresh_token || null;
};

SimpleInOut.prototype.get_access_token = function(username, password){
  const options = {
    grant_type: "password",
    client_id: this.client_id,
    client_secret: this.client_secret,
    username: username,
    password: password,
    scope:"read write executive"
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
        var result = JSON.parse(response.text);
        client.access_token = result.access_token;
        client.refresh_token = result.refresh_token;
        return resolve(result);
      });
  });
};

SimpleInOut.prototype.update_access_token = function(){
  const options = {
    grant_type: "refresh_token",
    client_id: this.client_id,
    client_secret: this.client_secret,
    refresh_token: this.refresh_token
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
        var result = JSON.parse(response.text);
        client.access_token = result.access_token;
        client.refresh_token = result.refresh_token;
        return resolve(result);
      });
  });
};

SimpleInOut.prototype._get = function(path, query_parameters, attempt){
  if(!this.access_token) {
    throw new Error("Missing required parameter 'access_token'");
  }
  if(!this.refresh_token) {
    throw new Error("Missing required parameter 'refresh_token'");
  }
  const access_token = this.access_token;
  query_parameters = query_parameters || {};
  attempt = attempt || 1;
  var client = this;
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
      return client.update_access_token().then(function(){
        return client._get(path, query_parameters, attempt + 1);
      });
    } else {
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

