import mysql from 'mysql';
import express from 'express';
import {dbCred,tokenSecret} from '../config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {prettyName,initials} from './helpers.js';

const router=express.Router();
const con = mysql.createConnection({...dbCred});

const query=(sql,res)=>{
    con.query(sql,(err,response,fields)=>{
        err?
        console.error('Something went wrong fetching the query\n%s',err):'';
        res.json({response})
    })
}

router.post('/save-user',(req,res)=>{
    const {fname,lname,email,username,password,confirm_password}=req.body.data;
    //TODO: MISSING BACKEND VALIDATIONS
    //TODO: redirect user logged in to home
    const password_digest=bcrypt.hashSync(password, 10);
    let sql=`INSERT INTO users(username,fname,lname,email,password) values('${username}','${fname}','${lname}','${email}','${password_digest}')`
    let query_res=con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        const payload=req.body.data;
        console.log(payload);
        res.json({payload});
    });

});
router.post('/login',(req,res)=>{
    const {identifier,password}=req.body.data;
    let sql=`select * from users where username='${identifier}' or email='${identifier}'`;
    let queryRes=con.query(sql,(err,response,fields)=>{
        if(err) throw(err);
        if(response.length>0){
            if(bcrypt.compareSync(password,response[0].password)){
                const token=jwt.sign({
                    username: response[0].username,
                    email: response[0].email,
                    initials: initials(response[0].fname,response[0].lname),
                    name: prettyName(response[0].fname,response[0].lname)
                }, tokenSecret.jwtSecret);
                res.json({token,isLogged:true});
            } else {
                console.log('invalid bruh')
                res.status(401).json({errors:{form:'Invalid credentials'},isLogged:false});
            }
        } else {
            res.status(401).json({errors:{form:'Invalid credentials'},isLogged:false});
        }
    });
});
router.post('/save-post',(req,res)=>{
    const {username,title,content}=req.body.data;
    let sql=`INSERT INTO wrides(username,title,content) VALUES('${username}','${title}','${content}')`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({submitted:true,...req.body.data})
    });
});

router.post('/get-own-posts',(req,res)=>{
    const username=req.body.data;
    //let sql=`select a.*,b.fname,b.lname,case when c.action=1 then 1 else 0 end as is_liked, case when c.action=2 then 1 else 0 end as is_shared from wrides a left join actions c on a.id=c.wid and a.username=c.username left join users b on a.username=b.username where a.username='${username}' order by a.created_date desc`;
    let sql=`select a.*,b.fname,b.lname,sum(case when c.action=1 and c.username='${username}' then 1 else 0 end) as is_liked,sum(case when c.action=2 and c.username='${username}' then 1 else 0 end) as is_shared,sum(case when c.action=1 then 1 else 0 end) as likes_cnt,sum(case when c.action=2 then 1 else 0 end) as shares_cnt from wrides a left join actions c on a.id=c.wid left join users b on a.username=b.username where a.username='${username}' group by id,content,title,a.created_date,a.username,fname,lname order by a.created_date desc;`;

    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({fetched:true,wrides:response});
    });
});

router.post('/get-home-posts',(req,res)=>{
    const username=req.body.data;
    let sql=`select a.*,b.fname,b.lname,sum(case when c.action=1 and c.username='${username}' then 1 else 0 end) as is_liked,sum(case when c.action=2 and c.username='${username}' then 1 else 0 end) as is_shared,sum(case when c.action=1 then 1 else 0 end) as likes_cnt,sum(case when c.action=2 then 1 else 0 end) as shares_cnt from wrides a left join actions c on a.id=c.wid left join users b on a.username=b.username where a.username in (select username from followers where follower_username='${username}') or a.username='${username}' group by id,content,title,a.created_date,a.username,fname,lname order by a.created_date desc;`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({ok:true,wrides:response});
    });
});

router.post('/get-profile',(req,res)=>{
    const username=req.body.data;
    let sql=`select a.username,fname,lname,bio,count(distinct b.id) as post_cnt, count(distinct d.follower_username) as followers_cnt, count(distinct c.id) as likes_cnt from users a left join wrides b on a.username=b.username left join actions c on a.username=c.username and c.action=1 left join followers d on a.username=d.username where a.username='${username}'`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        if(response.length>0){
            res.json({user:{
                username:response[0].username,
                name:prettyName(response[0].fname,response[0].lname),
                email:response[0].email,
                bio:response[0].bio,
                likes: response[0].likes_cnt,
                followers: response[0].followers_cnt,
                posts: response[0].post_cnt
            }});
        } else {
            res.json({user:'error'})
        }
    });
});

router.post('/following',(req,res)=>{
    const {username,username_param}=req.body.data;
    let sql=`select count(id) as following from followers where follower_username='${username}' and username='${username_param}';`
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({following: response[0].following})
    });
});

router.post('/un-follow',(req,res)=>{
    const {username,username_param,following}=req.body.data;
    let sql=`insert into followers (follower_username,username) values('${username}','${username_param}')`;
    if(following){
        sql=`delete from followers where follower_username='${username}' and username='${username_param}'`;
    }
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({action:following?'Follow':'Following',following:!following});
    });
});

router.post('/post-action',(req,res)=>{
    const {id,auser,action,liked,shared}=req.body.data;
    let sql=`insert into actions(wid,username,action) values('${id}','${auser}','${action}')`;
    let wyd=1;
    let wydn;
    if(action==1 && liked){
        sql=`delete from actions where action=1 and username='${auser}' and wid=${id}`;
        wyd=2;
    } else if(action==2 && shared){
        sql=`delete from actions where action=2 and username='${auser}' and wid=${id}`;
        wyd=3;
    }
    if(wyd==1 && action==1){
        wydn='liked';
    } else if(wyd==1 && action==2){
        wydn='shared';
    } else if(wyd==2){
        wydn='unliked';
    } else if(wyd==3){
        wydn='unshared';
    }

    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({wydn});
    });
});

router.post('/get-followers',(req,res)=>{
    const username=req.body.data;
    let sql=`select fname,lname,username from users where username in (select follower_username from followers where username='${username}')`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({followers:response});
    });
});

router.post('/get-likes',(req,res)=>{
    const username=req.body.data;
    let sql=`select id,title,content,username from wrides where id in(select wid from actions where username='${username}' and action=1) order by created_date desc`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({likes:response});
    });
});

router.post('/get-stats',(req,res)=>{
    const username=req.body.data;
    let sql=`select count(distinct a.id) as post_cnt, count(distinct c.follower_username) as followers_cnt, count(distinct b.id) as likes_cnt from wrides a left join actions b on a.username=b.username and b.action=1 left join followers c on a.username=c.username where a.username='${username}';`
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({stats:response})
    });
});

router.post('/get-notifications',(req,res)=>{
    const username=req.body.data;
    let sql=`select * from (select a.username, case when action=1 then 'has liked' when action=2 then 'has shared' else 'undefined' end as action, title,a.created_date,action as action_no from actions a left join wrides b on a.wid=b.id where b.username='john' union select follower_username as username,'started following you' as action, null as title,created_date,3 as action_no from followers) a order by a.created_date desc`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({notifications:response});
    });
});

router.post('/get-unread-notifications',(req,res)=>{
    const username=req.body.data;
    let sql=`select a.username, case when action=1 then 'liked' when action=2 then 'shared' else 'undefined' end as action, title from actions a left join wrides b on a.wid=b.id where b.username='john' and seen=0`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({notifications:response});
    });
});

router.post('/clear-notifications',(req,res)=>{
    let sql=`update actions set seen=1 where wid in (select id from wrides where username='${username}')`;
    console.log(sql);
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({cleared:response});
    });
});

router.post('/change-settings',(req,res)=>{
    let sql=`update users set `;
    console.log(req.body)
});



export default router;
