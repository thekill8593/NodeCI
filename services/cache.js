const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require("../config/keys");


const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
	this.useCache = true;
	this.hashKey = JSON.stringify(options.key || '');

	return this;
}

mongoose.Query.prototype.exec = async function() {

	if (!this.cache) {
		return exec.apply(this, arguments);
	}
	
	// creating catching key
	const key = JSON.stringify(Object.assign({}, this.getQuery(), {
		collection: this.mongooseCollection.name
	}));

	// see if we have a value for 'key' in redis
	const cacheValue = await client.hget(this.hashKey, key);

	// if we do, return from cache
	if (cacheValue) {
		const doc = JSON.parse(cacheValue);

		const data = Array.isArray(doc) 
			? doc.map(d => new this.model(d)) 
			: new this.model(doc);

		return data;
	}

	// otherwise, issue the query and store the result in cache
	const result = await exec.apply(this, arguments);
	client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);

	return result;
}

module.exports = {
	clearHash(hashKey) {
		client.del(JSON.stringify(hashKey));
	}
}