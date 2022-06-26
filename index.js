import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";


const app = express()
app.use(express.json());
app.use(cors());

dotenv.config();

const userSchema = joi.object({
  name: joi.string().required()
});

const messageScheme = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.valid('message','private_message'),
  from: joi.string()
});
const time = dayjs().format('HH:MM:ss')
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("batepapouol");
});

app.get("/participants", (req, res) => {
	
	db.collection("participante").find().toArray().then(participantes => {
		res.send(participantes) 
	});
});

app.post("/participants", async (req, res) => {
	const {name} = req.body;
  const dado = req.body;
  const validation = userSchema.validate({name});
  const userexists = await db.collection('participante').findOne({name: dado.name})
 
  if(userexists != null){
    res.sendStatus(409)
    return
  }

  if (validation.error) {
   res.sendStatus(422)
  } else{
    db.collection('participante')
    .insertOne({name, lastStatus: Date.now()})
    .then(() => {
      res.sendStatus(201);
      
    })
  }

  ;
});

app.post("/messages", (req, res) => {
	const {to, text, type} = req.body;
  const from = req.headers.user;
  console.log(req.headers.user)
  console.log(req.body)
  const validation = messageScheme.validate({from, to, text, type});
  
  if (validation.error) {
   res.sendStatus(422)
  } else{
    db.collection('messagem')
    .insertOne({from, to,text, type, time})
    .then(() => {
      res.sendStatus(201);
    })
  };
});

app.get("/messages", (req, res) => {
	
	db.collection("messagem").find().toArray().then(mensagem => {
		res.send(mensagem) 
	});
});
  



app.listen(5000, ()=>{console.log("Servidor funcionando")})