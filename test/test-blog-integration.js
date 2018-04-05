'use strict'

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');


const expect = chai.expect;

const {BlogPost} = require('../models');

const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);


//seed the db

function seedBlogPostData() {
	console.info('seeding the BlogPost data');
	const seedData = [];

	for (let i=1; i <= 10; i++)
	{
		seedData.push(generateBlogPostData());
	}

	return BlogPost.insertMany(seedData);
}

function generateBlogPostData() {
	return {
		title: faker.lorem.words(),
		content: faker.lorem.paragraph(),
		author: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()
		},
		created: faker.date.recent()
	};
}

function tearDownDb() {
	console.warn('Deleting database');
	return mongoose.connection.dropDatabase();

}

describe('BlogPost API resource', function() { 

 before(function() {
 	return runServer(TEST_DATABASE_URL)
 });

 beforeEach(function() {
  return seedBlogPostData();
 });

 afterEach(function() {
   return tearDownDb();
 });

 after(function() {
   return closeServer();
 });

 
 describe('Get endpoint', function() {
  
  it('should return all blog posts', function() {
  	let res;
  	return chai.request(app)
  	 .get('/posts')
  	 .then(function(_res) {
  	 	res = _res;

  	 	expect(res).to.have.status(200);
  	 //	console.log(res);
  	  	expect(res.body).to.have.length.of.at.least(1);
  	 	return BlogPost.count(); 
  	 })
  	 .then(function(count) {
  	 	expect(res.body).to.have.lengthOf(count);
  	 });
  });

 });
 

 describe('Post endpoint', function() {
 	it('should add a new blog post', function() { 
 	const newPost = generateBlogPostData();

 	return chai.request(app)
 	 .post('/posts')
 	 .send(newPost)
 	 .then(function(res) {
 	 	expect(res).to.have.status(201);
 	 	expect(res).to.be.json;
 	 	expect(res.body).to.be.a('object');
 	 	expect(res.body).to.include.keys(
 	 		'title', 'content', 'author', 'created', 'id');
 	 	expect(res.body.title).to.equal(newPost.title);
 	 	expect(res.body.content).to.equal(newPost.content);
 	 	expect(res.body.id).to.not.be.null;
 	 	return BlogPost.findById(res.body.id);
 	 })
 	 .then(function(blogpost) {
 	 	expect(blogpost.title).to.equal(newPost.title);
 	 	expect(blogpost.content).to.equal(newPost.content);
 	 	expect(blogpost.author.firstName).to.equal(newPost.author.firstName);
 	 	//expect(blogpost.created).to.equal(newPost.created);
 	 });

 	});


 });

//put
 describe('PUT endpoint', function() {

   
    it('should update post', function() {
      const updateData = {
        title: 'Time to go',
        content: 'Bacon Epsom'
      };

      return BlogPost
        .findOne()
        .then(function(blogPost) {
          updateData.id = blogPost.id;

          return chai.request(app)
            .put(`/posts/${blogPost.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return BlogPost.findById(updateData.id);
        })
        .then(function(blogPost) {
          expect(blogPost.title).to.equal(updateData.title);
          expect(blogPost.content).to.equal(updateData.content);
        });
    });
  });

//delete
  describe('DELETE endpoint', function() {
    
    it('delete a post by id', function() {

      let blogPost;

      return BlogPost
        .findOne()
        .then(function(_blogPost) {
          blogPost = _blogPost;
          return chai.request(app).delete(`/posts/${blogPost.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(blogPost.id);
        })
        .then(function(_blogPost) {
          expect(_blogPost).to.be.null;
        });
    });
  });

});