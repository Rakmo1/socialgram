const { admin, db }=require('../util/admin');

exports.getPosts=(req,res)=>{
    db.collection('posts').get()
    .then((data)=>{
      let posts=[];
      data.forEach((doc)=>{
        posts.push(doc.data());
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
      return db.collection('comments').where('post',"==",req.params.postId).get();
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

  

  exports.test=(req,res)=>{
    console.log(req.rawBody);
    return res.status(200).json(req.rawBody);
  
  }