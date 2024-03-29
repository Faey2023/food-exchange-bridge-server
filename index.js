const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middlewares
app.use(
  cors({
    origin: ["http://localhost:5173", "https://food-exchange-bridge.web.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//
app.get("/", (req, res) => {
  res.send("Food Exchange Bridge is running.");
});

app.listen(port, () => {
  console.log("server is running.");
});

//mongodb
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { configDotenv } = require("dotenv");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d9lmwal.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const foodCollection = client.db("febDB").collection("foods");

    //set foods
    app.post("/foods", async (req, res) => {
      const addedFoods = req.body;
      console.log(addedFoods);
      const result = await foodCollection.insertOne(addedFoods);
      res.send(result);
    });

    // get foods
    app.get("/foods", async (req, res) => {
      const cursor = foodCollection.find().sort({ foodQuantity: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    //single food details
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    //specific
    app.get("/myFoods", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { donatorEmail: req.query.email };
      }
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });
    //delete food request
    app.delete("/myFoods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    //update food
    app.patch("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedFood = req.body;
      const updateFood = {
        $set: {
          foodName: updatedFood.foodName,
          foodImage: updatedFood.foodImage,
          foodQuantity: updatedFood.foodQuantity,
          pickupLocation: updatedFood.pickupLocation,
          expiredDate: updatedFood.expiredDate,
          note: updatedFood.note,
          status: updatedFood.status,
        },
      };
      const result = await foodCollection.updateOne(filter, updateFood);
    });

    //partners
    const partners = client.db("febDB").collection("partners");

    app.get("/partners", async (req, res) => {
      const cursor = partners.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    const foodRequestCollection = client.db("febDB").collection("foodRequest");

    app.post("/foodRequest", async (req, res) => {
      const requestedFood = req.body;
      console.log(req.body);
      const result = await foodRequestCollection.insertOne(requestedFood);
      res.send(result);
    });

    app.get("/foodRequest", async (req, res) => {
      const cursor = foodRequestCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //delete
    app.delete("/foodRequest/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodRequestCollection.deleteOne(query);
      res.send(result);
    });

    //specific
    app.get("/request", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { requesterEmail: req.query.email };
      }
      const result = await foodRequestCollection.find(query).toArray();
      res.send(result);
    });

    //myfoodrequest
    const myFoodRequestCollection = client
      .db("febDB")
      .collection("myFoodRequest");

    app.post("/myfoodrequest", async (req, res) => {
      const requestedMyFood = req.body;
      console.log(req.body);
      const result = await myFoodRequestCollection.insertOne(requestedMyFood);
      res.send(result);
    });

    app.get("/myfoodrequest", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { donatorEmail: req.query.email };
      }
      const options = {
        projection: {
          requesterEmail: 1,
          requesterName: 1,
          requestingDate: 1,
          status: 1,
          donatorEmail: 1,
        },
      };
      const result = await myFoodRequestCollection
        .find(query, options)
        .toArray();
      res.send(result);
    });

    //auth related
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "24h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: false,
        })
        .send({ success: true });
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
