let db = {
    users: [
      {
        userId: 'dh23ggj5h32g543j5gf43',
        email: 'user@email.com',
        username: 'user',
        createdAt: '2019-03-15T10:59:52.798Z',
        imageUrl: 'image/dsfsdkfghskdfgs/dgfdhfgdh',
        bio: 'Hello, my name is user, nice to meet you',
        website: 'https://user.com',
        location: 'Lonodn, UK'
      }
    ],
    posts: [
      {
        commentCount: 0,
        createdAt: "2019-12-17T16:42:34.695Z",
        likeCount: 0,
        title: "Hello World",
        user: "rakmo",
        userImage: 'https://firebasestorage.googleapis.com/v0/b/socialgram-8f52c.appspot.com/o/no-image.png?alt=media'
      }
    ],
    comments: [
      {
        body: 'This is a post body',
        createdAt: '2019-03-15T10:59:52.798Z',
        post: 'deSHhrgwh3W3yrHvsq2W',
        user: 'rakmo'
      }
    ],
    likes: [
      {
        post: 'deSHhrgwh3W3yrHvsq2W',
        user: 'rakmo'
      }
    ],
    notifications: [
        {
            recipient: 'user',
            sender: 'john',
            read: 'true | false',
            post: 'kdjsfgdksuufhgkdsufky',
            type: 'like | comment',
            createdAt: '2019-03-15T10:59:52.798Z'
          }
        ]
  };
  const userDetails = {
    // Redux data
    credentials: {
      userId: 'N43KJ5H43KJHREW4J5H3JWMERHB',
      email: 'user@email.com',
      handle: 'user',
      createdAt: '2019-03-15T10:59:52.798Z',
      imageUrl: 'image/dsfsdkfghskdfgs/dgfdhfgdh',
      bio: 'Hello, my name is user, nice to meet you',
      website: 'https://user.com',
      location: 'Lonodn, UK'
    },
    likes: [
      {
        userHandle: 'user',
        screamId: 'hh7O5oWfWucVzGbHH2pa'
      },
      {
        userHandle: 'user',
        screamId: '3IOnFoQexRcofs5OhBXO'
      }
    ]
  };