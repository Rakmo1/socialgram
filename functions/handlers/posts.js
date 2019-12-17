const { admin, db }=require('../util/admin');

exports.getAllPosts=(req,res)=>{
    db.collection('posts').get()
    .then((data)=>{
      let posts=[];
      data.forEach((doc)=>{
        console.log(doc.id);
        posts.push({...doc.data(), postId: doc.id});
      })
      return res.json(posts);
    })
    .catch((err)=>{
      return res.status(400).json({error:err});
    })
  
  }
exports.getPost=(req,res)=>{
  let postData={};
  db.doc(`/posts/${req.params.postId}`).get()
    .then((doc)=>{
      postData=doc.data();
      return db.collection('comments').orderBy('createdAt','desc').where('post',"==",req.params.postId).get();
    })
    .then((data)=>{
      postData.comments=[];
      data.forEach((doc)=>{
        postData.comments.push(doc.data());
      });
      return res.status(200).json(postData);
    })
    .catch((err)=>{
      return res.status(400).json({error:err});
    })
  
  }
  
  exports.createPost=(req,res)=>{

    const newPost={
      title: req.body.title,
      user: req.user.username,
      userImage: req.user.userImage,
      likeCount:0,
      commentCount:0,
      createdAt: new Date().toISOString()
    };
  
    db.collection('posts')
    .add(newPost)
    .then((doc)=>{
      res.json({message: `Document ${doc.id} created successfully`});
    })
    .catch((err)=>{
      res.status(500).json({err:"Something went wrong"});
    })
  
  }

  exports.commentOnPost=(req,res)=>{
    if(req.body.body.trim()==''){
      return res.status(400).json({error:"Comment cannot be empty"});
    }
    let newComment={
      body: req.body.body,
      post: req.params.postId,
      user: req.user.username,
      createdAt: new Date().toISOString()
    }
    db.doc(`/posts/${req.params.postId}/`).get()
    .then(doc=>{
      console.log(doc.id);
      if(!doc.exists){
        return res.status(400).json({error:"Post not found"});
      }
      else{
        return doc.ref.update({commentCount: doc.data().commentCount+1})
        .then(()=>{
          return db.collection('comments').add(newComment);
        })
        .then(doc=>{
          res.status(200).json({message:`Comment with id ${doc.id} was created successfully`});
        })
      }
    })
    .catch(err=>{
      res.status(400).json({err});
    });
  }

  exports.likePost=(req,res)=>{
    const likeDocument=db.collection('likes').where('user','==',req.user.username).where('post','==',req.params.postId).limit(1);
    const postDocument=db.doc(`/posts/${req.params.postId}`);
    let likes=0;
    postDocument.get()
    .then(doc=>{
      // console.log('hello');
      if(!doc.exists){
        return res.status(400).json({error: 'Post does not exist'});
      }
      else{
        likes=doc.data().likeCount;
        return likeDocument.get()
        .then(data=>{
          if(!data.empty){
            // console.log("Liked");
            return res.status(400).json({error:"Post already liked"});
            // console.log("Liked");
          }
          else{
            let likeData={
              post: req.params.postId,
              user: req.user.username
            }
            return db.collection('likes').add(likeData)
            .then((doc)=>{
              likes+=1;
              return postDocument.update({likeCount:likes});
            })
            .then(()=>{
              return res.status(200).json({message: 'Post liked successfully'});
            })
          }
        });
      }
    })
    .catch((err)=>{
      res.status(400).json({err});
    });
  }

  exports.unlikePost=(req,res)=>{
    const likeDocument=db.collection('likes').where('user','==',req.user.username).where('post','==',req.params.postId).limit(1);
    const postDocument=db.doc(`/posts/${req.params.postId}`);
    let likes=0;
    postDocument.get()
    .then(doc=>{
      // console.log('hello');
      if(!doc.exists){
        return res.status(400).json({error: 'Post does not exist'});
      }
      else{
        likes=doc.data().likeCount;
        return likeDocument.get()
        .then(data=>{
          if(data.empty){
            // console.log("Liked");
            return res.status(400).json({error:"Like the post first"});
            // console.log("Liked");
          }
          else{
            return data.docs[0].ref.delete()
            .then(()=>{
              likes-=1;
              return postDocument.update({likeCount:likes});
            })
            .then(()=>{
              return res.status(200).json({message: 'Post unliked successfully'});
            })
          }
        });
      }
    })
    .catch((err)=>{
      res.status(400).json({err});
    });
  }

  exports.deletePost=(req,res)=>{
    const postDocument=db.doc(`/posts/${req.params.postId}`);
    postDocument.get()
    .then(doc=>{
      if(!doc.exists){
        return res.status(400).json({error: "Post does not exist"});
      }
      
      if(doc.data().user!==req.user.username){
        return res.status(400).json({error: "Unauthorized"});
      }
      else{
        return postDocument.delete()
        .then(()=>{
          res.status(200).json({message: 'Post deleted successfully'});
        });
      }
    })
    .catch((err)=>{
      res.status(500).json({error: err.code});
    });
  }

  exports.test=(req,res)=>{
    console.log(req.rawBody);
    return res.status(200).json(req.rawBody);
  
  }