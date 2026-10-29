import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import express from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

const varifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ Message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ Message: "Unauthorized" });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );
  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(500).send({ Message: "Invalid token" });
  }
};

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongoClient = await connectToMongoDB();
const db = mongoClient.db("wonderlust");
const destinations = db.collection("destinations");
const bookings = db.collection("bookings");

// http://localhost:5000/add-destination
app.post("/add-destination", varifyToken, async (req, res) => {
  const data = req.body;
  const result = await destinations.insertOne(data);
  res.send(result);
});

// http://localhost:5000/bookings
app.post("/bookings", varifyToken, async (req, res) => {
  const data = req.body;
  const existing = await bookings.findOne({
    email: data.email,
    destinationId: data.destinationId,
  });
  if (existing) {
    return res.send({ status: "Already added" });
  }
  const result = await bookings.insertOne(data);
  res.send(result);
});
// http://localhost:5000/bookings
app.get("/bookings/:email", varifyToken, async (req, res) => {
  const email = req.params.email;
  const result = await bookings.find({ email: email }).toArray();
  res.send(result);
});

//http://localhost:5000
app.get("/", (req, res) => {
  res.send({ Msg: "API is working" });
});

app.get("/featured-destinations", async (req, res) => {
  const result = await destinations.find().limit(6).toArray();
  res.send(result);
});

app.delete("/bookings/:id", varifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await bookings.deleteOne(query);
  res.send(result);
});

app.get("/destinations", async (req, res) => {
  const result = await destinations.find().toArray();
  res.send(result);
});

app.get("/destinations/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await destinations.findOne(query);
  res.send(result);
});

app.patch("/destinations/:id", varifyToken, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDestination = req.body;
  // const options = { upsert: true };

  const updatedDoc = {
    $set: updatedDestination,
  };

  const result = await destinations.updateOne(filter, updatedDoc);
  res.send(result);
});

app.delete("/destinations/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await destinations.deleteOne(query);
  res.send(result);
});

app.listen(PORT, (req, res) => {
  console.log(`Server is running on PORT ${PORT}`);
});

export default app;
