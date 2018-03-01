import express from 'express';
import ssl from 'express-ssl';
import {serverConf} from './config';
import bodyParser from 'body-parser';
import apiRouter from './api';
import url from 'url';
import path from 'path';

const app=express();
app.use(ssl());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname,'static')));
app.get('/',(req,res)=>{
    res.json({msg:'hello'});
})
app.use('/api',apiRouter);
app.use((req,res)=>{
    //res.status(404).json({
    //    errors:{
    //        global:"Still working on it"
    //    }
    //});
    res.redirect(
        url.format({
            pathname:'/'
        })
    );
});
const server=app.listen(serverConf.port,serverConf.host,()=>{
    let port=serverConf.port;
    let host=serverConf.host;
    console.log('Magic happening at %s:%s',host,port);
});
