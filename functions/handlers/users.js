
const { admin, db }=require('../util/admin');
const config=require('../util/config');
const {validateSignupData, validateLoginData, reduceUserDetails}=require('../util/validators');
const firebase = require('firebase/app');
require('firebase/auth');
// require('@firebase/firestore');
firebase.initializeApp(config);

exports.signup=(req,res)=>{
    const user={
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      username: req.body.username
    }
    let validate=validateSignupData(user);
    if(!validate.valid){
        return res.status(400).json(validate.errors);
    }
    else{
        let uid,token;
        db.doc(`/users/${user.username}`).get()
        .then((doc)=>{
          if(doc.exists){
            return res.status(400).json({error:"username already exists"});
          }
          else{
            return firebase.auth().createUserWithEmailAndPassword(user.email,user.password);
          }
        })
        .then((data)=>{
            // console.log(data.user);
            uid=data.user.uid;
            return data.user.getIdToken();
        })
        .then((utoken)=>{
          token=utoken;
          const newUser={
            email:user.email,
            password:user.password,
            username:user.username,
            createdAt: new Date().toISOString(),
            imageFileName: 'no-img.png',
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/no-image.png?alt=media`,
            userId: uid
          }
          return db.doc(`/users/${user.username}`).set(newUser);
        })
        .then(()=>{
          return res.status(200).json({message: token});
        })
        .catch(err=>{
          if (err.code === 'auth/email-already-in-use') {
            return res.status(400).json({ email: 'Email is already is use' });
          } 
          else {
            return res
              .status(500)
              .json({ general: 'Something went wrong, please try again' });
          }
        })
    }
  
  }

  exports.login=(req,res)=>{
    const user={
      email: req.body.email,
      password: req.body.password
    }
    let validate=validateLoginData(user);
    if(!validate.valid){
        return res.status(400).json(validate.errors);
    }
    else{

        firebase.auth().signInWithEmailAndPassword(user.email,user.password)
        .then((data)=>{
          return data.user.getIdToken();
        })
        .then(token=>{
          return res.status(200).json({message: token});
        })
        .catch(err=>{
          return res.status(403).json({ general: 'Wrong credentials, please try again' });
        })
    }
  
  }

  exports.uploadImage=(req,res)=>{
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
  
    const busboy = new BusBoy({ headers: req.headers });
  
    let imageToBeUploaded = {};
    let imageFileName;
  
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log("Inside on \n",fieldname, file, filename, encoding, mimetype);
      if (mimetype !== 'image/jpeg' && mimetype !== 'image/png' && mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Wrong file type submitted' });
      }
      // my.image.png => ['my', 'image', 'png']
      const imageExtension = filename.split('.')[filename.split('.').length - 1];
      // 32756238461724837.png
      imageFileName = `${Math.round(
        Math.random() * 1000000000000
      ).toString()}.${imageExtension}`;
      const filepath = path.join(os.tmpdir(), imageFileName);
      imageToBeUploaded = { filepath, mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on('finish', () => {
      admin
        .storage()
        .bucket()
        .upload(imageToBeUploaded.filepath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageToBeUploaded.mimetype
            }
          }
        })
        .then(() => {
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
            config.storageBucket
          }/o/${imageFileName}?alt=media`;
          return db.doc(`/users/${req.user.username}`).update({ imageUrl,imageFileName });
        })
        .then(() => {
          return res.json({ message: 'image uploaded successfully' });
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({ error: 'something went wrong' });
        });
    });
    busboy.end(req.rawBody);
  }
  exports.updateUserDetails=(req,res)=>{
    let userDetails={};
    userDetails=reduceUserDetails(req.body);
    db.doc(`/users/${req.user.username}`).update(userDetails)
    .then((doc)=>{
      // console.log(doc);
      return res.status(200).json({message: `Document updated successfully`});
    })
    .catch(err=>{
      return res.status(400).json({error:err});
    })
  }

  exports.getAuthenticatedUser=(req,res)=>{
    let details={};
    db.doc(`/users/${req.user.username}`).get()
    .then((doc)=>{
      if(doc.exists){
        details.credentials=doc.data();
        return db.collection('likes').where("user","==",req.user.username).get();
      }
    })
    .then((data)=>{
      details.likes=[];
      data.forEach((doc)=>{
        details.likes.push(doc.data());
      })
      return db.collection('notifications').where('recipient','==',req.user.username)
      .orderBy('createdAt','desc').limit(10).get();
    })
    .then(data=>{
      details.notifications=[];
      data.forEach((doc)=>{
        details.notifications.push({...doc.data(),notificationId: doc.id});
      })
      return res.status(200).json(details);
    })
    .catch(err=>{
      return res.status(400).json({error:err});
    })
  }

  exports.getUserDetails=(req,res)=>{
    let user={};
    db.doc(`/users/${req.params.username}`).get()
    .then(doc=>{
      if(doc.exists){
        user.data=doc.data();
        return db.collection('posts').where('user','==',req.params.username).orderBy('createdAt','desc').get();
      }
      else{
        return res.status(500).json({error: 'User not found'});
      }
    })
    .then(data=>{
      user.posts=[];
      data.forEach(doc=>{
        user.posts.push(doc.data());
      });
      return res.json(user);
    })
    .catch(err=>{
      res.status(500).json({err});
    })

  }

  exports.markNotificationsAsRead=(req,res)=>{
    let batch=db.batch();
    req.body.forEach(notificationId=>{
      const notificationDocument= db.doc(`/notifications/${notificationId}`);
      batch.update(notificationDocument,{read: true}); 
    });
    batch.commit()
    .then(()=>{
      return res.status(200).json({message: 'Notifications marked read'});
    })
    .catch((err)=>{
      console.log(err);
      return res.status(500).json({err});
    })
  }

  // exports.deleteUploadedImage=(req,res)=>{
  //   let username=req.user.username;
  //   db.doc(`/users/${username}`).get()
  //   .then((doc)=>{
  //     return doc.data().imageFileName;
  //   })
  //   .then((filename)=>{
  //     return admin
  //     .storage()
  //     .bucket()
  //     .file(filename)
  //     .delete();
  //   })
  //   .then(()=>{
  //     return res.status(200).json({message:"File deleted successfully"});
  //   })
  //   .catch((err)=>{
  //     return res.status(400).json({error:err});
  //   })
  // }
  // exports.downloadImage=(req,res)=>{
  //   let username=req.user.username;
    
  //   db.doc(`/users/${username}`).get()
  //   .then((doc)=>{
  //     return doc.data().imageFileName;
  //   })
  //   .then((filename)=>{
  //     let newfilename=filename.split('.')[0];
  //     let options={
  //       destination: `../${newfilename}.jpeg`
  //     }
  //     return admin
  //     .storage()
  //     .bucket()
  //     .file(filename)
  //     .download(options);
  //   })
  //   .then(()=>{
  //     return res.status(200).json({message:"File successfully downloaded"});
  //   })
  //   .catch((err)=>{
  //     return res.status(400).json({error:err});
  //   })
  // }

  // exports.uploadPdf=(req,res)=>{
  //   const BusBoy = require('busboy');
  //   const path = require('path');
  //   const os = require('os');
  //   const fs = require('fs');
  
  //   const busboy = new BusBoy({ headers: req.headers });
  
  //   let imageToBeUploaded = {};
  //   let imageFileName;
  
  //   busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
  //   //   console.log("Inside on \n",fieldname, file, filename, encoding, mimetype);
  //     if (mimetype !== 'application/pdf') {
  //       return res.status(400).json({ error: 'Wrong file type submitted' });
  //     }
  //     // my.image.png => ['my', 'image', 'png']
  //     const imageExtension = filename.split('.')[filename.split('.').length - 1];
  //     // 32756238461724837.png
  //     imageFileName = `${Math.round(
  //       Math.random() * 1000000000000
  //     ).toString()}.${imageExtension}`;
  //     const filepath = path.join(os.tmpdir(), imageFileName);
  //     imageToBeUploaded = { filepath, mimetype };
  //     file.pipe(fs.createWriteStream(filepath));
  //   });
  //   busboy.on('finish', () => {
  //     admin
  //       .storage()
  //       .bucket()
  //       .upload(imageToBeUploaded.filepath, {
  //         resumable: false,
  //         metadata: {
  //           metadata: {
  //             contentType: imageToBeUploaded.mimetype
  //           }
  //         }
  //       })
  //       .then(() => {
  //         const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
  //           config.storageBucket
  //         }/o/${imageFileName}?alt=media`;
  //         return db.doc(`/users/${req.user.username}`).update({ imageUrl,imageFileName });
  //       })
  //       .then(() => {
  //         return res.json({ message: 'image uploaded successfully' });
  //       })
  //       .catch((err) => {
  //         console.error(err);
  //         return res.status(500).json({ error: 'something went wrong' });
  //       });
  //   });
  //   busboy.end(req.rawBody);
  // }