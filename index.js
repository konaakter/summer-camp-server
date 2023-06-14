const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const stripe = require('stripe')('sk_test_51NHTMaFypvNrd4o3uawYfdvmey5VbtKZsvdh2YjRNPji741GoD0cKvPK98puql8jC84wauM7923nIDDDOJcsBiGY00zbFRo2Ty')

require('dotenv').config()
const cors = require('cors')
const port = process.env.PORT || 5000

app.use(cors())


const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello World!')
})



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ah3a7qz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const populerclasscollectoin = client.db("summerdb").collection("populerclass");
    const userCollection = client.db("summerdb").collection("user");
    const sletedSCCollection = client.db("summerdb").collection("sletedclass");
    const paymentCollection = client.db("summerdb").collection("payment");


    /*************************************variry alluser moto router gulate dite hode */
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }

    /************************************************instractor************ */
    const verifyInstractor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      if (user?.role !== 'instractor') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }




    /////////////////////////////////*isadmin ba initractor anar jonno*/
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        return res.send({ admin: false })
      }

      const query = { email: email }
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })
    /**************************************************isInstractor ar jonno ********   */

    app.get('/users/instractor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        return res.send({ instractor: false })
      }

      const query = { email: email }
      const user = await userCollection.findOne(query);
      const result = { instractor: user?.role === 'instractor' }
      res.send(result);
    })




    /////////////////////////////////////////////////////////////jwt authprovider ay disi jaita////////////////////////////j
    app.post('/jwt', (req, res) => {
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token })
    })
    /***********************************************admin dash ar ********************** */

    app.post('/users', async (req, res) => {
      const iteam = req.body
      console.log(iteam)
      const query = { email: iteam.email }
      const extaingemail = await userCollection.findOne(query);
      if (extaingemail) {
        return res.send({ message: 'user allady exit' });
      }
      const userresult = await userCollection.insertOne(iteam);
      res.send(userresult);
    })

    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const alluser = await userCollection.find().toArray();
      res.send(alluser);
    })



    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    })

    /*********************************instractor banar jonno************************************** */

    app.patch('/users/instractor/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instractor'
        },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    })
    /**********************************************instractor dasbioad************************** */

    app.post('/addclass', verifyJWT, verifyInstractor, async (req, res) => {
      const iteam = req.body;
      const addresult = await populerclasscollectoin.insertOne(iteam);
      res.send(addresult);
    })

    app.get('/addclass', verifyJWT, verifyInstractor, async (req, res) => {
      console.log(req.query.email)

      let query = {};
      if (req.query?.email) {
        query = { instructorEmail: req.query.email }
      }
      const result = await populerclasscollectoin.find(query).toArray();
      res.send(result)
    });

    app.patch('/addclas/:id', async (req, res) => {
      const updatedClass = req.body;
      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          artCraftName: updatedClass.artCraftName,
          price: updatedClass.price,
          totalSeats: updatedClass.totalSeats
        },
      };

      const result = await populerclasscollectoin.updateOne(query, updateDoc);
      res.send(result);
    })

    app.get('/addclass/:id', async (req, res) => {
      const id = req.params.id
      console.log(id)
      const query = { _id: new ObjectId(id) };
      const cursor = await populerclasscollectoin.findOne(query);
      res.send(cursor);
    })


    /******************************************************************************************** */



    app.get('/allcllass', verifyJWT, verifyAdmin, async (req, res) => {
      const allclass = await populerclasscollectoin.find().toArray();
      res.send(allclass);
    })

    app.patch('/allcllass/approve/:id', async (req, res) => {

      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'approved'
        },
      };
      const result = await populerclasscollectoin.updateOne(query, updateDoc);
      res.send(result);
    })


    app.patch('/allcllass/deny/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'Deny'
        },
      };
      const result = await populerclasscollectoin.updateOne(query, updateDoc);
      res.send(result);
    })
    app.patch('/allcllass/feedback/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const feedb = req.body;
      console.log(feedb);
      const updateDoc = {
        $set: {
          feedback: feedb.feedback
        },
      };
      const result = await populerclasscollectoin.updateOne(filter, updateDoc);
      res.send(result);
    })


    /*************************************************************************************************** */



    /******************************************************************populer class jonno */

    app.get('/allclass', async (req, res) => {
      const query = { status: "approved" };
      const options = {

        sort: { bookSeats: -1 },

      };

      const populerclass = await populerclasscollectoin.find(query, options)
      const result = await populerclass.limit(6).toArray();
      res.send(result);
    })


    app.get('/topinstractor', async (req, res) => {
      const query = { role: "instractor" };
      const populerinctrotor = await userCollection.find(query).limit(6).toArray();
      
      res.send(populerinctrotor);
    })
    app.get('/topinstractor', async (req, res) => {
      const query = { role: "instractor" };
      const populerinctrotor = await userCollection.find(query).toArray();
      
      res.send(populerinctrotor);
    })

    /******************************************************************************************************* */
    /************************************************************************Allclass page****** */
    app.get('/approveclass', async (req, res) => {
      const query = { status: "approved" };
      const approveclass = await populerclasscollectoin.find(query).toArray();

      res.send(approveclass);
    })

    app.post('/sletedclass', async (req, res) => {
      const iteam = req.body;
      const userresult = await sletedSCCollection.insertOne(iteam);
      res.send(userresult);
    })

    /***************************************student dashboad********************* */

    app.get('/sletedclass', async (req, res) => {
      console.log(req.query.email)

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await sletedSCCollection.find(query).toArray();
      res.send(result)
    });

    app.delete('/sletedclass/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await sletedSCCollection.deleteOne(query);
      res.send(result);
    })



    /**********************************************************payment */
    app.post('/create-payment-intent', verifyJWT, async (req, res) => {
      const { price } = req.body
      console.log(price)

      if (!price) return
      const amount = parseFloat(price) * 100
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card'],
      })

      res.send({
        clientSecret: paymentIntent.client_secret,
      })
    })


    app.post('/payments', verifyJWT, async (req, res) => {
      const payment = req.body;
      const id = payment.sleted_id;
      const query = { _id: new ObjectId(id) };
      const deleteresult = await sletedSCCollection.deleteOne(query);

      const insertResult = await paymentCollection.insertOne(payment);
      await populerclasscollectoin.updateOne({}, { $inc: { bookSeats: 1 } });

      res.send({ insertResult, deleteresult });
    })

    app.get('/payments', async (req, res) => {
      console.log(req.query.email)

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const options = {

        sort: { date: -1 },

      };
      const result = await paymentCollection.find(query, options).toArray();
      res.send(result)
    });
    




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})




//password: 122357uvbfgr4566
//name: summer-kona