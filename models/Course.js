const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  display: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  prerequisites: { type: String },
  credits: { type: Number },
  labFee: { type: String },
  // UofU-specific catalog fields
  creditsMin: { type: Number },
  creditsMax: { type: Number },
  semestersOffered: { type: String },
  crossListed: { type: String },
  genEdDesignation: { type: String },
  recommendedBackground: { type: String },
  tenant: { type: String, required: true, enum: ['uvu', 'uofu'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
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
