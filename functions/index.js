const functions = require('firebase-functions');
const app =require('express')();
const FBAuth=require('./util/FBAuth');
const {getPosts,createPost, test,getPost}=require('./handlers/posts');
const {signup,login, uploadImage, updateUserDetails,getAuthenticatedUser}=require('./handlers/users');

//Posts Path
app.get('/getPosts',FBAuth,getPosts);
app.post('/createPost',FBAuth,createPost);
app.post('/test',test);
app.get('/post/:postId',FBAuth,getPost);

//Users Path
app.post('/signup',signup);
app.post('/login',login);
app.post('/user/image',FBAuth,uploadImage);
app.post('/userDetails',FBAuth,updateUserDetails);
app.get('/getUser',FBAuth,getAuthenticatedUser);
// app.post('/user/deleteImage',FBAuth,deleteUploadedImage);
// app.post('/user/downloadImage',FBAuth,downloadImage);

exports.api=functions.https.onRequest(app);