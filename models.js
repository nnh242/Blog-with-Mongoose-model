const mongoose = require('mongoose');

const blogPostSchema = mongoose.Schema ({
    name: {type: String, required: true},
    content: {type: String},
    author: {
        firstName: String,
        lastName: String
      },
    created: {type: Date, default: Date.now}
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

blogPostSchema.virtual('authorName').get(function() {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
  });
  
  blogPostSchema.methods.apiRepr = function() {
    return {
      id: this._id,
      author: this.authorName,
      content: this.content,
      title: this.title,
      created: this.created
    };
  }

module.exports = {BlogPost};