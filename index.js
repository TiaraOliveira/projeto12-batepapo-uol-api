import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";


const app = express()
app.use(express.json());
app.use(cors());

dotenv.config();

const userSchema = joi.object({
  name: joi.string().required()
});

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("batepapouol");
});

app.get("/participants", (req, res) => {
	// buscando usuários
	db.collection("participants").find().toArray().then(name => {
		res.send(name) // array de usuários
	});
});

app.post("/participants", (req, res) => {
	// inserindo usuário
	const {name} = req.body;
  const validation = userSchema.validate({name});
  
  if (validation.error) {
   res.send(422)
  } else{
    db.collection('participantes')
    .insertOne({name, lastStatus: Date.now()})
    .then(() => {
      res.send(201);
    })
  }

  ;
});



  

app.listen(5000, ()=>{console.log("Servidor funcionando")})