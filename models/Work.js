const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Web Development', 'Mobile App', 'Desktop App', 'API', 'Design', 'Other'],
    default: 'Web Development'
  },
  status: {
    type: String,
    enum: ['Planning', 'In Progress', 'Completed', 'On Hold'],
    default: 'Completed'
  },
  technologies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stack'
  }],
  images: [{
    url: { type: String, required: true },
    caption: { type: String, default: '' },
    isMain: { type: Boolean, default: false }
  }],
  links: {
    live: { type: String, default: '' },
    github: { type: String, default: '' },
    documentation: { type: String, default: '' }
  },
  features: [{
    type: String,
    trim: true
  }],
  duration: {
    startDate: { type: Date },
    endDate: { type: Date }
  },
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
workSchema.index({ title: 1 });
workSchema.index({ category: 1 });
workSchema.index({ featured: -1, order: 1 });
workSchema.index({ createdAt: -1 });

// Virtual for main image
workSchema.virtual('mainImage').get(function() {
  const mainImg = this.images.find(img => img.isMain);
  return mainImg || (this.images.length > 0 ? this.images[0] : null);
});

// Static methods
workSchema.statics.getByCategory = function(category) {
  return this.find({ 
    category: category, 
    isActive: true 
  })
  .populate('technologies', 'name color icon')
  .sort({ order: 1, createdAt: -1 });
};

workSchema.statics.getFeatured = function() {
  return this.find({ 
    featured: true, 
    isActive: true 
  })
  .populate('technologies', 'name color icon')
  .sort({ order: 1, createdAt: -1 });
};

workSchema.statics.getRecent = function(limit = 6) {
  return this.find({ isActive: true })
    .populate('technologies', 'name color icon')
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Work', workSchema);
