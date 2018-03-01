select
    a.id
    ,sum(case when c.action=1 and c.username='john' then 1 else 0 end) as is_liked
    ,sum(case when c.action=2 and c.username='john' then 1 else 0 end) as is_shared
    ,sum(case when c.action=1 then 1 else 0 end) as likes_cnt
    ,sum(case when c.action=2 then 1 else 0 end) as shares_cnt
from wrides a
    left join actions c on a.id=c.wid
    left join users b on a.username=b.username
where
    a.id=10
group by id 

select a.*,b.fname,b.lname,sum(case when c.action=1 and c.username='john' then 1 else 0 end) as is_liked,sum(case when c.action=2 and c.username='john' then 1 else 0 end) as is_shared,sum(case when c.action=1 then 1 else 0 end) as likes_cnt,sum(case when c.action=2 then 1 else 0 end) as shares_cnt from wrides a left join actions c on a.id=c.wid left join users b on a.username=b.username where a.username in (select username from followers where follower_username='${username}') or a.username='${username}' group by id,content,title,a.created_date,a.username,fname,lname order by a.created_date desc;
