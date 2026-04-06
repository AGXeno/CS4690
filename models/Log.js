const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  courseId: { type: String, required: true },
  uvuId: { type: String, required: true },
  date: { type: String, required: true },
  text: { type: String, required: true }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('Log', logSchema);
