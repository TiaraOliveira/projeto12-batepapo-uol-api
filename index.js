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

const time = dayjs().format('HH:mm:ss')
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("batepapouol");
});

app.get("/participants", async(req, res) => {
  try{
    const participantes = await db.collection("participante").find({}).toArray()
    res.send(participantes)  
  }catch{
    res.sendStatus(500)
  }
});

app.post("/participants", async (req, res) => {
	const {name} = req.body;
  const dado = req.body;
  const validation = userSchema.validate({name});
  const userexists = await db.collection('participante').findOne({name: dado.name})
 try{
  if(userexists != null){
    res.sendStatus(409)
    return
  }

  if (validation.error) {
   res.sendStatus(422)
  } else{
    await db.collection('participante').insertOne({name, lastStatus: Date.now()})
    await db.collection('messagem').insertOne({from:name, to:"Todos",text:"entra na sala...", type: 'status', time: time})
    res.sendStatus(201);
    
  };
 }catch{
  res.sendStatus(500)
 }
  
});

  
app.post("/status", async(req, res) =>{
 
  const name = req.headers.user;
 
  try {
		const participantes = await db.collection("participante").findOne({"name": name })
  		if (!participantes) {
			res.sendStatus(404)
			return;
		}
    
  	await db.collection("participante").updateOne({name:participantes.name}, { $set: {"lastStatus": Date.now()} })
		res.sendStatus(200)
		
	 } catch (error) {
	  res.status(500).send(error)
	 }
})

app.post("/messages", async(req, res) => {
	const {to, text, type} = req.body;
  const from = req.headers.user;
  const validation = messageScheme.validate({from, to, text, type});
  const userexists = await db.collection('participante').findOne({name: from})
 
  if(userexists === null){
    res.sendStatus(409)
    return
  }

  if (validation.error) {
   res.sendStatus(422)
  } else{
    await db.collection('messagem').insertOne({from, to,text, type, time})
    res.sendStatus(201);
  
  };
});

app.get("/messages", async (req, res) => {
  const limit = parseInt(req.query.limit);
  const user = req.headers.user;
	try{
    const mensagem = await db.collection("messagem").find({$or: [{type:"message"},{type:"status"},{ from: user }, { to: user } ]}).sort({"_id":-1}).limit(limit).toArray()

   res.send(mensagem.reverse())
  
  }catch{
    res.sendStatus(500)
  }
});

async function removeparticipant(){

  const timelimit = Date.now() - 10000
  
  const participantesout = await db.collection("participante").find({ lastStatus: { $lte:timelimit} }).toArray()
  if(participantesout.length!=0){
  const exitmessage = participantesout.map(element =>{

  return{
  from: element.name,to:"Todos",text:"sai da sala...", type: 'status', time: time
  }
  })
 
  await db.collection('messagem').insertMany(exitmessage)
  await db.collection("participante").deleteMany({ lastStatus: { $lte:timelimit} })
  }
  }
  setInterval(()=> removeparticipant(),15000)
  
  

app.listen(process.env.PORT, ()=>{console.log("Servidor funcionando")})