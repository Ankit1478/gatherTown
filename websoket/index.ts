import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from 'redis';

const app = express();
const httpServer = app.listen(8080);
const client = createClient();
await client.connect();

const wss = new WebSocketServer({ server: httpServer });

interface newWebSocketUserDetails{
    ws:WebSocket,
    roomId:string,
    userId:string
}
interface Movement {
    userId: string;
    dimension: any;
}

const newWebSocketUser = new Map<string , newWebSocketUserDetails>()
const positions = new Map<String , Map<string , string>>();


function handleuser(data:any, ws: WebSocket, clientId: string){
    const {userId , roomId , dimension} = data;

    const newuser = newWebSocketUser.get(clientId);
    if(newuser){
        newuser.roomId = roomId;
        newuser.userId = userId
    }

    if(!positions.has(roomId)){
        positions.set(roomId,new Map() )
    }

    const usersInRoom = positions.get(roomId);
    usersInRoom?.set(userId , dimension);
    handleMove(roomId,{userId , dimension})
}

function handleMove(roomId:any , movement:Movement){
    const roomPositions = positions.get(roomId);
    if(!roomPositions)return 

    for(const[clientId , moves] of newWebSocketUser.entries()){
       if(moves.roomId === roomId && moves.ws.readyState === moves.ws.OPEN){
       
        moves.ws.send(JSON.stringify(movement));
       }
    }
}

wss.on('connection', (ws)=>{
    const newClient = generateUniqueId();
    //@ts-ignore
    newWebSocketUser.set(newClient,{ws})

    console.log(`New connection established: ${newClient}`);

    //data comming from fronted 
    ws.on('message',(msg:any)=>{
        const parsedData = JSON.parse(msg.toString());
        handleuser(parsedData , ws , newClient)
    })

})

function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}
