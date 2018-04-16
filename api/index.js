import mysql from 'mysql';
import express from 'express';
import {dbCred,tokenSecret,dest} from '../config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {prettyName,initials,_make_user_sound} from './helpers.js';
import metaphone from 'metaphone';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import isEmpty from 'is-empty';

const router=express.Router();
const storage=multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null,dest);
    },
    filename: function (req, file, cb) {
        cb(null,file.originalname);
    }
});
const upload = multer({storage});
const type = upload.single('photo');
/*const storage = multer.diskStorage({
    //destination: function (req, file, cb) {
    //    cb(null, '/tmp/my-uploads')
    //},
    filename: function (req, file, cb) {
        cb(file.fieldname + '.jpeg')
    }
});*/
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
    let phonetic=_make_user_sound({name:`${fname} ${lname}`,username});
    const password_digest=bcrypt.hashSync(password, 10);
    let sql=`INSERT INTO users(username,fname,lname,email,password,phonetic) values('${username}','${fname}','${lname}','${email}','${password_digest}','${phonetic}')`
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
                    name: prettyName(response[0].fname,response[0].lname),
                    avatar: response[0].path,
                    bio: response[0].bio,
                    private_: response[0].private,
                    path: response[0].path
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


router.post('/save-post',async (req,res)=>{
    const {username,title,content,draft,draft_redirector,id,tagsSelected,anonymous}=req.body.data;
    let phonetic=metaphone(title);
    //let sql=`INSERT INTO wrides(username,title,content,phonetic,draft) VALUES('${username}','${title}','${content}','${phonetic}',${draft})`;
    let anonymous_fixed=anonymous?1:0;
    let sql='';
    if(draft_redirector){
        sql=`update wrides set title='${title}',content='${content}',phonetic='${phonetic}',draft=${draft},created_date=current_timestamp,anonymous='${anonymous_fixed}' where id=${id}`;
    } else{
        sql=`INSERT INTO wrides(username,title,content,phonetic,draft,anonymous) VALUES('${username}','${title}','${content}','${phonetic}',${draft},'${anonymous_fixed}')`;
    }
    await con.query(sql, async(err,response,fields)=>{
        if(err) throw err;
        let wride_id=draft_redirector?id:response.insertId;
        //res.json({submitted:true,...req.body.data});
        await tagsSelected.map(async r=>{
            let sql=`select id from tags where tag='${r}'`;
            await con.query(sql, async (err,response,fields)=>{
                if(err) throw err;
                if(isEmpty(response)){
                    let sqlTag=`insert into tags(tag) values('${r}')`;
                    con.query(sqlTag,async(err,response,fields)=>{
                        if(err) throw err;
                        tag_id=response.insertId;
                        let sql_wt=`insert into wrides_tags (wid,tid) values(${wride_id},${tag_id})`
                        await con.query(sql_wt,(err,response,fields)=>{
                            if(err) throw err;
                        });
                    });
                } else {
                    tag_id=response[0].id;
                    let sql_wt=`insert into wrides_tags (wid,tid) values(${wride_id},${tag_id})`
                    await con.query(sql_wt,(err,response,fields)=>{
                        if(err) throw err;
                    });
                }
            });
        });
        if(!err) res.json({saved_post:true});
    });
});

router.post('/get-own-posts',(req,res)=>{
    const {username,offset}=req.body.data;
    let limit=5;
    let sql=`select a.*,b.fname,b.lname,b.path,sum(case when c.action=1 and c.username='${username}' then 1 else 0 end) as is_liked,sum(case when c.action=2 and c.username='${username}' then 1 else 0 end) as is_shared,sum(case when c.action=3 and c.username='${username}' then 1 else 0 end) as is_saved,sum(case when c.action=1 then 1 else 0 end) as likes_cnt,sum(case when c.action=2 then 1 else 0 end) as shares_cnt from wrides a left join actions c on a.id=c.wid left join users b on a.username=b.username where a.username='${username}' and draft=0 group by id,content,title,a.created_date,a.username,fname,lname,path order by a.created_date desc limit ${limit} offset ${offset};`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({fetched:true,wrides:response});
    });
});

router.post('/get-own-posts-count',(req,res)=>{
    const username=req.body.data;
    let sql=`select count(a.id) as posts_cnt from wrides a where a.username='${username}' and draft=0;`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({wrides_cnt:response[0].posts_cnt});
    });
});


router.post('/get-home-posts',(req,res)=>{
    const {username,offset}=req.body.data;
    let limit=5;
    let sql=`select a.*,b.fname,b.lname,b.path,sum(case when c.action=1 and c.username='${username}' then 1 else 0 end) as is_liked,sum(case when c.action=2 and c.username='${username}' then 1 else 0 end) as is_shared,sum(case when c.action=3 and c.username='${username}' then 1 else 0 end) as is_saved,sum(case when c.action=1 then 1 else 0 end) as likes_cnt,sum(case when c.action=2 then 1 else 0 end) as shares_cnt from wrides a left join actions c on a.id=c.wid left join users b on a.username=b.username where  a.username in (select username from followers where follower_username='${username}') or a.username='${username}' and draft=0 group by id,content,title,a.created_date,a.username,fname,lname,path order by a.created_date desc limit ${limit} offset ${offset};`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({ok:true,wrides:response});
    });
});

router.post('/get-home-posts-count',(req,res)=>{
    const username=req.body.data;
    let sql=`select count(a.id) as posts_cnt from wrides a where draft=0 and a.username in (select username from followers where follower_username='${username}') or a.username='${username}';`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({wrides_cnt:response[0].posts_cnt});
    });
});



router.post('/get-profile',(req,res)=>{
    const username=req.body.data;
    let sql=`select a.username,path,fname,lname,bio,count(distinct b.id) as post_cnt, count(distinct d.follower_username) as followers_cnt, count(distinct c.id) as likes_cnt from users a left join wrides b on a.username=b.username left join actions c on a.username=c.username and c.action=1 left join followers d on a.username=d.username where a.username='${username}'`;
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
                posts: response[0].post_cnt,
                path: response[0].path
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
    const {id,auser,action,liked,shared,saved}=req.body.data;
    let sql=`insert into actions(wid,username,action) values('${id}','${auser}','${action}')`;
    let wyd=1;
    let wydn;
    if(action==1 && liked){
        sql=`delete from actions where action=1 and username='${auser}' and wid=${id}`;
        wyd=2;
    } else if(action==2 && shared){
        sql=`delete from actions where action=2 and username='${auser}' and wid=${id}`;
        wyd=3;
    } else if(action==3 && saved){
        sql=`delete from actions where action=3 and username='${auser}' and wid=${id}`;
        wyd=4;
    }
    if(wyd==1 && action==1){
        wydn='liked';
    } else if(wyd==1 && action==3){
        wydn='saved';
    } else if(wyd==1 && action==2){
        wydn='shared';
    } else if(wyd==2){
        wydn='unliked';
    } else if(wyd==3){
        wydn='unshared';
    } else if(wyd==4){
        wydn='unsaved';
    }
    console.log('Post action sql: ',sql)
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({wydn});
    });
});

router.post('/get-followers',(req,res)=>{
    const {username,username_param}=req.body.data;
    let sql=`select fname,lname,a.username,a.path,case when b.id is not  null then 1 else 0 end as following,case when a.username='${username}' then 1 else 0 end as own_profile from users a left join followers b on a.username=b.username and b.follower_username='${username}' where a.username in (select follower_username from followers where username='${username_param}');`
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
    let sql=`select count(distinct a.id) as post_cnt, count(distinct c.follower_username) as followers_cnt, count(distinct b.id) as likes_cnt from wrides a left join actions b on a.username=b.username and b.action=1 left join followers c on a.username=c.username where a.username='${username}' and draft=0;`
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({stats:response})
    });
});

router.post('/get-notifications',(req,res)=>{
    const {username,offset}=req.body.data;
    let sql=`select * from (select a.username, case when action=1 then 'has liked' when action=2 then 'has shared' else 'undefined' end as action, title,a.created_date,action as action_no,path from actions a left join wrides b on a.wid=b.id left join users c on a.username=c.username where b.username='${username}' and a.username<>'${username}' union select follower_username as username,'started following you' as action, null as title,a.created_date,3 as action_no,path from followers a left join users b on a.follower_username=b.username where a.username='${username}' and follower_username<>'${username}') a order by a.created_date desc`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({notifications:response});
    });
});

router.post('/get-notifications-count',(req,res)=>{
    const username=req.body.data;
    let sql=`select sum(cnt) as nots_cnt from (select count(a.id) as cnt from actions a left join wrides b on a.wid=b.id where b.username='${username}' and a.username<>'${username}' union select count(a.id) as cnt from followers a where a.username='${username}' and follower_username<>'${username}') a`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({notifications:response[0].nots_cnt});
    });
});

router.post('/get-unread-notifications',(req,res)=>{
    const username=req.body.data;
    let sql=`select a.username, case when action=1 then 'liked' when action=2 then 'shared' else 'undefined' end as action, title from actions a left join wrides b on a.wid=b.id where b.username='${username}' and seen=0`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({notifications:response});
    });
});

router.post('/clear-notifications',(req,res)=>{
    const username=req.body.data;
    let sql=`update actions set seen=1 where seen=0 and wid in (select id from wrides where username='${username}' and draft=0);`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({cleared:response});
    });
});

router.post('/upload-avatar',type,(req,res)=>{
    //console.log('Req: ',req.file);
    //console.log('Req body: ',req.body);
    const {filename}=req.file;
    const {username}=req.body;
    let sql=`select path from users where username='${username}'`;
    con.query(sql,(err,response,fields)=>{
        let path=response[0].path;
        let complete_path=dest+'/'+path;
        if(path!==null && path!==filename){
            fs.unlink(complete_path,(err)=>{
                if(err) throw err;
            });
        }
        let sql=`update users set path='${filename}' where username='${username}'`;
        con.query(sql,(err,response,fields)=>{
            if (err) throw err;
            res.json({msg:'Changed profile picture succesfully'});
        });
    });
});

router.post('/get-search',(req,res)=>{
    let {query,username}=req.body.data;
    let phonetic=metaphone(query);
    let sql=`select username,fname,lname from users where phonetic like '%${phonetic}%' or username='${query}'`;
    con.query(sql,(err,responsePeople,fields)=>{
        if(err) throw err;
        let sqlPosts=`select * from wrides where phonetic like '${phonetic}' and draft=0`;
        con.query(sqlPosts,(err,responsePosts,fields)=>{
            if(err) throw err;
            res.json({result_posts:responsePosts,result_people:responsePeople});
        });
    });
});

router.post('/change-settings',(req,res)=>{
    let {changes,username}=req.body.data;
    let sql_string='';
    for (var k in changes){
        let value_=changes[k];
        if(k=='private_') {
            k='private';
            value_=value_?1:0
        };
        sql_string=sql_string+k+'='+`'${value_}'`+',';
    }
    let fixed_sql=sql_string.slice(0,-1);
    let sql=`update users set ${fixed_sql} where username='${username}'`;
    console.log('Settings SQL: ',sql);
    con.query(sql,(err,response,fields)=>{
        if (err) throw err;
        let sqlN=`select fname,lname,username,path,bio,private as private_,email from users where username='${username}'`;
        con.query(sqlN,(err,response,fields)=>{
            if(err) throw err;
            res.json({changed_user: response});
        });
    })
});

router.post('/get-collection-cnt',(req,res)=>{
    const {username}=req.body.data;
    let sql=`select count(a.id) as post_cnt from actions a where a.username='${username}' and action=3`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({post_cnt:response[0].post_cnt})
    })
});
router.post('/get-collection',(req,res)=>{
    const {username,offset}=req.body.data;
    let limit=5;
    let sql=`select a.id,a.created_date,b.id,b.title,b.content,b.username,b.created_date from actions a left join wrides b on a.wid=b.id where a.username='${username}' and action=3 limit ${limit} offset ${offset}`;
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({collection:response});
    });
});

router.post('/get-drafts-cnt',(req,res)=>{
    const {username}=req.body.data;
    let sql=`select count(a.id) as post_cnt from wrides a where a.username='${username}' and draft=1`;
    console.log('draft cnt: ',sql);
    con.query(sql,(err,response,fields)=>{
        if(err) throw err;
        res.json({post_cnt:response[0].post_cnt})
    })
});

router.post('/get-drafts',(req,res)=>{
    const {username}=req.body.data;
    let sql=`select * from wrides where username='${username}' and draft=1`;
    con.query(sql,(err,response,fields)=>{
        if (err) throw err;
        res.json({drafts:response});
    });
});



export default router;
