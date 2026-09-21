import models from '../models/index.js';
const plain = value => value == null ? null : JSON.parse(JSON.stringify(value));
// The application uses this small persistence interface. Normal startup always uses MongoDB.
export function mongoStore() {
  return {
    mode: 'mongodb',
    async get(type, id) { return plain(await models[type].findById(id).select('+password')); },
    async list(type, filter = {}, options = {}) {
      let query = models[type].find(filter).select('+password').sort(options.sort || { createdAt: -1, _id: -1 });
      if (options.skip) query = query.skip(options.skip);
      if (options.limit) query = query.limit(options.limit);
      return plain(await query);
    },
    async count(type, filter) { return models[type].countDocuments(filter); },
    async create(type, data) { return plain(await models[type].create(data)); },
    async patch(type, id, fields) { return plain(await models[type].findByIdAndUpdate(id, { $set: fields }, { new: true, runValidators: true })); },
    async remove(type, id) { await models[type].deleteOne({ _id: id }); },
    async deleteMany(type, filter) { await models[type].deleteMany(filter); }
  };
}
