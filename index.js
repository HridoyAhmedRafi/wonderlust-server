import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import express from "express";

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

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

// http://localhost:5000/add-destination
app.post("/add-destination", async (req, res) => {
  const data = req.body;
  const result = await destinations.insertOne(data);
  res.send(result);
});

//http://localhost:5000
app.get("/", (req, res) => {
  res.send({ Msg: "API is working" });
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

app.listen(PORT, (req, res) => {
  console.log(`Server is running on PORT ${PORT}`);
});
