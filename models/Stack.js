const mongoose = require('mongoose');

const stackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Frontend', 'Backend', 'Database', 'DevOps', 'Mobile', 'Design', 'Other'],
    default: 'Other'
  },
  proficiencyLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  icon: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  link: {
    type: String,
    default: ''
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
    default: 0
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
  timestamps: true
});

// Indexes
stackSchema.index({ name: 1 });
stackSchema.index({ category: 1 });
stackSchema.index({ featured: -1, order: 1 });

// Static methods
stackSchema.statics.getByCategory = function(category) {
  return this.find({ 
    category: category, 
    isActive: true 
  }).sort({ order: 1, createdAt: -1 });
};

stackSchema.statics.getFeatured = function() {
  return this.find({ 
    featured: true, 
    isActive: true 
  }).sort({ order: 1, createdAt: -1 });
};

module.exports = mongoose.model('Stack', stackSchema);
