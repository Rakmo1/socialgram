const functions = require('firebase-functions');
const app =require('express')();
const FBAuth=require('./util/FBAuth');
const {getAllPosts,createPost, test,getPost, commentOnPost,likePost, unlikePost, deletePost}=require('./handlers/posts');
const {signup,login, uploadImage, updateUserDetails,getAuthenticatedUser, getUserDetails, markNotificationsAsRead}=require('./handlers/users');
const { db }=require('./util/admin');
//Posts Path
app.get('/getPosts',FBAuth,getAllPosts);
app.post('/createPost',FBAuth,createPost);
app.post('/test',test);
app.get('/post/:postId',FBAuth,getPost);
app.post('/post/:postId/comment',FBAuth,commentOnPost);
app.post('/post/:postId/like',FBAuth,likePost);
app.post('/post/:postId/unlike',FBAuth,unlikePost);
app.post('/post/:postId/delete',FBAuth,deletePost);

//Users Path
app.post('/signup',signup);
app.post('/login',login);
app.post('/user/image',FBAuth,uploadImage);
app.post('/userDetails',FBAuth,updateUserDetails);
app.get('/getUser',FBAuth,getAuthenticatedUser);
app.get('/user/:username',FBAuth,getUserDetails);
app.post('/notifications',FBAuth,markNotificationsAsRead);


exports.api=functions.https.onRequest(app);

exports.createNotificationsOnLike= functions.firestore.document('/likes/{id}')
.onCreate((snapshot)=>{
   return db.doc(`/posts/${snapshot.data().post}`).get() 
   .then(doc=>{
       if(doc.exists && doc.data().user!==snapshot.data().user){
           let notification={
                recipient: doc.data().user,
                sender: snapshot.data().user,
                read: false,
                type: 'like',
                createdAt: new Date().toISOString(),
                post: doc.id
           }
           return db.doc(`/notifications/${snapshot.id}`).set(notification);
       }
   })
   .catch((err)=>{
       console.log(err);
   })
});

exports.deleteNotificationsOnUnlike= functions.firestore.document('/likes/{id}')
.onDelete((snapshot)=>{
   return db.doc(`/notifications/${snapshot.id}`).delete()
   .catch((err)=>{
       console.log(err);
   })
});

exports.createNotificationsOnComment= functions.firestore.document('/comments/{id}')
.onCreate((snapshot)=>{
   return db.doc(`/posts/${snapshot.data().post}`).get() 
   .then(doc=>{
       if(doc.exists && doc.data().user!==snapshot.data().user){
           let notification={
                recipient: doc.data().user,
                sender: snapshot.data().user,
                read: false,
                type: 'comment',
                createdAt: new Date().toISOString(),
                post: doc.id
           }
           return db.doc(`/notifications/${snapshot.id}`).set(notification);
       }
   })
   .catch((err)=>{
       console.log(err);
   })
});

exports.onUserImageChange=functions.firestore.document('/users/{id}')
.onUpdate((change)=>{
    console.log(change.id);
    //console.log(change.before.data());
    //console.log(change.after.data());
    if(change.before.data().imageUrl!=change.after.data().imageUrl){
        let batch=db.batch();   
        return db.collection('posts').where('user','==',change.after.data().username).get()
        .then(data=>{
            data.forEach(doc=>{
                
                const postDocument =db.doc(`/posts/${doc.id}`);
                batch.update(postDocument,{userImage: change.after.data().imageUrl});
            })
            return batch.commit();
        })
        .catch(err=>{
            console.log(err);
        })
    }
    else{
        return true;
    }
});

exports.onPostDelete=functions.firestore.document('/posts/{id}')
.onDelete((snapshot,context)=>{
    let batch=db.batch();
    let postId=context.params.id;
    return db.collection('likes').where('post','==',postId).get()
    .then(data=>{
        data.forEach(doc=>{
            const likeDocument=db.doc(`/likes/${doc.id}`);
            batch.delete(likeDocument);
        });
        return db.collection('comments').where('post','==',postId).get();
    })
    .then(data=>{
        data.forEach(doc=>{
            const commentDocument=db.doc(`/comments/${doc.id}`);
            batch.delete(commentDocument);
        });
        return db
          .collection('notifications')
          .where('post', '==', postId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });
// exports.deleteNotificationsOnUnlike= functions.firestore.document('/likes/{id}')
// .onDelete((snapshot)=>{
//    db.doc(`/notifications/${snapshot.id}`).delete()
//    .then(()=>{
//        return;
//    })
//    .catch((err)=>{
//        console.log(err);
//        return;
//    })
// });