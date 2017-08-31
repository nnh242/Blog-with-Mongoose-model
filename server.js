//importing all the dependencies
const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {Restaurant} = require('./models');

app.use('*', function(req, res) {
    res.status(404).json({message: 'Not Found'});
  });

// CRUD operations
//create blog posts
app.post('/posts', (req, res) => {
    const requiredFields = ['title', 'content', 'author']; //can the key created be the same as id so it is not part of required input fiels? 
    for (let i=0; i<requiredFields.length; i++) { //what is this loop really for?
      const field = requiredFields[i];
      if (!(field in req.body)) {
        const message = `Missing \`${field}\` in request body`
        console.error(message);
        return res.status(400).send(message);
      }
    }
  
    BlogPost
      .create({
        title: req.body.title,//  in the Body tab, when user makes a post request, user enters title, content and author
        content: req.body.content,
        author: req.body.author
      })
      .then(blogPost => res.status(201).json(blogPost.apiRepr()))
      .catch(err => {
          console.error(err);
          res.status(500).json({error: 'Internal server error'});
      });
  
  });
// read/ retrieve
app.get('/posts', (req, res) => {
    BlogPost
      .find()
      .exec() //why is this needed? to refresh content?
      .then(posts => {
        res.json(posts.map(post => post.apiRepr())); //use map to add the instance method apiRepr for author
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
      });
  });

  app.get('/posts/:id', (req, res) => { //add id
    BlogPost
      .findById(req.params.id) //pass the requested id pasted in the params by user here 
      .exec() 
      .then(posts => {
        res.json(post => post.apiRepr()); //why is map no longer necessary here? did the id help?
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
      });
  });
//update
  app.put('/posts/:id', (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) { //? what is this logic? not(p&&b&&p matches b)?
      res.status(400).json({
        error: 'Request path id and request body id values must match'
      });
    }
  
    const updated = {};
    const updateableFields = ['title', 'content', 'author'];
    updateableFields.forEach(field => {
      if (field in req.body) {
        updated[field] = req.body[field];
      }
    });
  
    BlogPost
      .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true}) //why pass the object set and new in?
      .exec()
      .then(updatedPost => res.status(201).json(updatedPost.apiRepr()))
      .catch(err => res.status(500).json({message: 'Internal server error'}));
  });

//delete by ID is quite similar to get by ID without the post promises
  app.delete('/:id', (req, res) => {
    BlogPosts
      .findByIdAndRemove(req.params.id)
      .exec()
      .then(() => {
        console.log(`Deleted blog post with id \`${req.params.ID}\``);
        res.status(204).end();
      });
  });

let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }

      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
       return new Promise((resolve, reject) => {
         console.log('Closing server');
         server.close(err => {
             if (err) {
                 return reject(err);
             }
             resolve();
         });
       });
    });
  }

if (require.main === module) {
    runServer().catch(err => console.error(err));
  };

module.exports = {runServer, app, closeServer};