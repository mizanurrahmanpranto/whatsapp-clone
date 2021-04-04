import Messages from "./dbMessages.js";
import Pusher from "Pusher";
import cors from "cors";
//importing
import express from "express";
import mongoose from "mongoose";
//app config
const app = express();
const port = process.env.Port || 9000;

const pusher = new Pusher({
  appId: "1182025",
  key: "1116fa9dbdd5a3f5b5fa",
  secret: "79273c071d54df76c1be",
  cluster: "eu",
  useTLS: true,
});

//middleware
app.use(express.json());
app.use(cors());

/*app.use((req, res, next) => {
 // res.setHeader("Access-Control-Allow-Origin", "*");
 // res.setHeader("Access-Control-Allow-Origin", "*");
 // next();}); */

//DB config
const connection_url =
  "mongodb+srv://whatsapp:whatsapp@cluster0.uui8y.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose
  .connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "whatsapp",
  })
  .then(() => {
    console.log("Database Connection is ready....");
    const db = mongoose.connection;

    const msgCollection = db.collection("messages");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
      console.log("A change occured", change);

      if (change.operationType === "insert") {
        const messageDetails = change.fullDocument;
        pusher.trigger("messages", "inserted", {
          name: messageDetails.name,
          message: messageDetails.message,
          timestamp: messageDetails.timestamp,
          received: messageDetails.received,
        });
      } else {
        console.log("Error triggering Pusher ");
      }
    });
  });
/*.catch((err) => {
    console.log(err);});*/

// ?????

//api routes
app.get("/", (req, res) => {
  res.status(200).send("hello world");
});

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

//listen
app.listen(port, () => console.log(`listen on localhost:${port}`));
