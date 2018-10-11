import mysql from 'mysql';
import express from 'express';
import {dbCred,tokenSecret,dest} from '../config';
//helpers
import isEmpty from 'is-empty';
//import haversine from 'haversine';
import {getDistance} from 'geolib'
import sortObjectsArray from 'sort-objects-array';

const router=express.Router();

const con = mysql.createConnection({...dbCred});

const query=(sql,res)=>{
    con.query(sql,(err,response,fields)=>{
        err?
        console.error('Something went wrong fetching the query\n%s',err):'';
        res.json(response)
    })
}

router.post('/register',(req,res)=>{
    const {source,payload}=req.body;
    let sourceId=payload.id;
    const sql=`select id,source from users where email='${payload.email}' and source=${source}`;
    con.query(sql,(err,response,fields)=>{
        if(err) console.error('Error registering user: ',err);
        if(isEmpty(response)){
            let sql=`insert into users(source,email,name) values(1,'${payload.email}','${payload.name}')`;
            con.query(sql,(err,response,fields)=>{
                let payload;
                let userId=response.insertId;
                if(err) payload={msg:'Error registering user',success:false,errorDesc:err}
                else payload={msg:'User registered succesfully',success:true,userId,source,sourceId};
                res.json(payload);
            });
        } else {
            res.json({msg:'Welcome back',success:true,userId:response[0].id,sourceId,source})
        }
    });
});

router.post('/get-restaurants',(req,res)=>{
    let userCoords=req.body;
    const sql=`select a.* from locations a`; //limit ${limit} offset ${offset}`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        if(!isEmpty(response)){
            let restsTemp=[];
            response.map(l=>{
                let resCoords={
                    latitude: parseFloat(l.latitude),
                    longitude: parseFloat(l.longitude)
                }
                let distance=getDistance(userCoords,resCoords);
                restsTemp.push({...l,distance});
            });
            let sortedRestaurants=sortObjectsArray(restsTemp,'distance','asc');
            let sortedFilteredRestaurants=sortedRestaurants.filter(r=>r.distance<30000000000);
            //console.log('SFR: ',sortedRestaurants);
            res.json(sortedFilteredRestaurants);
        } else {
            res.json(response);
        }
    });
});

router.post('/save-ticket',(req,res)=>{
    const {
        table
        ,revenueCenter
        ,name
        ,open
        ,openedAt
        ,locationId
        ,locationProviderId
        ,providerId
        ,ticketId
        ,user
    }=req.body;
    let tableProviderId=table.id;
    let rcProviderId=revenueCenter.id;
    let sqlRc=`select id from revenue_centers where location_id=${locationId} and rc_provider_id='${rcProviderId}'`;
    con.query(sqlRc,(err,response,fields)=>{
        if(!isEmpty(response)){
            if(err) console.error('Error getting rc: ',err);
            let rcId=response[0].id;
            let sqlTable=`select id from tables where location_id=${locationId} and table_provider_id='${tableProviderId}'`;
            con.query(sqlTable,(err,response,fields)=>{
                if(!isEmpty(response)){
                    if(err) console.error('Error getting table: ',err);
                    let tableId=response[0].id;
                    let openFix=open?1:0;
                    let sqlSt=`insert into tickets(table_id,revenue_center_id,name,open,opened_at,location_id,provider_id,ticket_provider_id) values(${tableId},${rcId},'${name}','${openFix}',from_unixtime('${openedAt}'),${locationId},${providerId},'${ticketId}')`;
                    con.query(sqlSt,(err,response,fields)=>{
                        if(err) console.error('Error saving ticket: ',err);
                        let ticketPhoodId=response.insertId;
                        //to update
                        let sqlSu=`insert into users_tickets (user_id,ticket_id,is_admin) values(${user.id},${ticketPhoodId},${user.admin})`;
                        con.query(sqlSu,(err,response,fields)=>{
                            if(err) console.error('Error saving user: ',err);
                            res.json({ok:true,ticketPhoodId,msg:'Ticket opened succesfully'});
                        });
                    });
                } else {
                    res.json({ok:false,msg:'Table not available'});
                }
            });
        } else {
            console.log('revenue center doesnt exist');
            res.json({ok:false,msg:'Revenue center not available'});
        }
    });
});

router.post('/get-ticket-admin',(req,res)=>{
    const {ticketPhoodId}=req.body;
    console.log('ticket admin body: ',req.body);
    let sql=`select user_id from users_tickets where is_admin=1 and ticket_id=${ticketPhoodId}`;
    con.query(sql,(err,response,fields)=>{
        if(err) console.error('Error selecting ticket admin: ',err);
        console.log('ticket admin res: ',response);
        res.json({response});
    });
});

router.post('/get-people-ticket',(req,res)=>{
    const {ticketPhoodId}=req.body;
    let sql=`select id, name, source_id, source from users_tickets a inner join users b on a.user_id=b.id where ticket_id=${ticketPhoodId}`;
    con.query(sql,(err,response,fields)=>{
        if(err) console.error('Error getting people on ticket: ',err);
    });
});

router.post('/get-menu',(req,res)=>{
    const sql=`select * from dummy_items`;
    query(sql,res);
});

router.get('/dummy',(req,res)=>{
    const sql=`select * from users`;
    con.query(sql,(err,response,fields)=>{
        if(isEmpty(response)){
            let sql=`insert into users()`
        }
    });
});

router.post('/save-phone',(req,res)=>{
    const {value,userId}=req.body;
    const sql=`update users set phone_number='${value}' where id=${userId}`;
    con.query(sql,(err,response,fields)=>{
        if(err) console.error('Error updating phone: ',err);
        console.log('Phone saved');
        res.json({response});
    });
});

router.post('/send-invite',(req,res)=>{
    const {userId,phoneNumber,ticketPhoodId}=req.body;
    const sql=`select id,name from users where phone_number='${phoneNumber}'`;
    con.query(sql,(err,response,fields)=>{
        if (err) console.error('Error getting user by ph number: ',err);
        if(!isEmpty(response)){
            let guestId=response[0].id;
            let guestName=response[0].name;
            const sqlOpen=`select ticket_id from users_tickets a inner join tickets b on a.ticket_id=b.id where open=1 and user_id=${guestId}`;
            console.log('sqlOpen: ',sqlOpen);
            con.query(sqlOpen,(err,response,fields)=>{
                if (err) console.error('Error getting opened tickets on invitation: ',err);
                if(isEmpty(response)){
                    const sqlGuest=`insert into invitations (uid_host,uid_guest,ticket_id) values(${userId},${guestId},${ticketPhoodId})`;
                    con.query(sqlGuest,(err,response,fields)=>{
                        if (err) console.error('Error inserting invitation: ',err);
                        res.json({ok:true,msg:`Invitation send to ${guestName}`,guestId});
                    });
                }
                else {
                    res.json({ok:false, msg:'User already has an active ticket'});
                }
            });

        } else {
            res.json({ok:false,msg:'User not found'});
        }
    });
});

router.post('/get-invitation',(req,res)=>{
    const {userId}=req.body;
    const sql=`
        select
            ticket_id
            ,c.name as user_name
            ,d.name as location_name
        from invitations a
            inner join tickets b on a.ticket_id=b.id
            inner join users c on a.uid_host=c.id
            inner join locations d on b.location_id=d.id
        where open=1
        and uid_guest=${userId}
    `;
    con.query(sql,(err,response,fields)=>{
        if (err) console.error('Error getting invitation: ',err);
        if(!isEmpty(response)){
            let ticketPhoodId=response[0].ticket_id;
            let locationName=response[0].location_name;
            let userName=response[0].user_name;
            res.json({gotInvite:true,ticketPhoodId,locationName,userName});
        } else {
            res.json({gotInvite:false})
        }

    })
});

export default router;
