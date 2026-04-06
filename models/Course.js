const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  display: { type: String, required: true }
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

module.exports = mongoose.model('Course', courseSchema);
