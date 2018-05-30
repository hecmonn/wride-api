export function getHomePosts(username,limit,offset){
    const sql=`
        select a.*
            ,b.fname
            ,b.lname
            ,b.path
            ,d.path as post_path
            ,sum(case when c.action=1 and c.username='${username}' then 1 else 0 end) as is_liked
            ,sum(case when c.action=2 and c.username='${username}' then 1 else 0 end) as is_shared
            ,sum(case when c.action=3 and c.username='${username}' then 1 else 0 end) as is_saved
            ,sum(case when c.action=1 then 1 else 0 end) as likes_cnt
            ,sum(case when c.action=2 then 1 else 0 end) as shares_cnt
        from wrides a
            left join actions c on a.id=c.wid
            left join users b on a.username=b.username
            left join media d on a.id=d.wid
        where
            draft=0
            and a.username not in (select blocked from blocked where blocker='${username}')
            and a.username in (select username from followers where follower_username='${username}') or a.username='${username}'
        group by id,content,title,a.created_date,a.username,fname,lname,path,post_path
        order by a.created_date desc
        limit ${limit} offset ${offset};
    `;
    return sql;
}

export function inspiration (username) {
    const sql=`
    select
        a.id,a.title,a.username,a.content
        ,e.fname,e.lname,e.path
        ,d.path as post_path
        ,a.anonymous
        ,sum(case when b.action=1 and b.username='${username}' then 1 else 0 end) as liked
        ,sum(case when b.action=2 and b.username='${username}' then 1 else 0 end) as shared
        ,sum(case when b.action=3 and b.username='${username}' then 1 else 0 end) as saved
        ,sum(case when b.action=1 then 1 else 0 end) as likes_cnt
        ,sum(case when b.action=2 then 1 else 0 end) as shares_cnt
        ,sum(case when b.action=3 then 1 else 0 end) as saves_cnt
    from wrides a
        left join actions b on a.id=b.wid
        left join media d on a.id=d.wid
        left join users e on a.username=e.username
    where
        a.id in (
            select wid from wrides_tags where tid in (
                select tid from (
                    select
                        tid
                        ,tag
                        ,count(distinct a.id) as tag_cnt
                        ,sum(case when action=1 then 1 else 0 end) as likes_cnt
                        ,sum(case when action=2 then 1 else 0 end) as shares_cnt
                        ,sum(case when action=3 then 1 else 0 end) as saves_cnt
                    from wrides_tags a
                        left join wrides b on a.wid=b.id
                        left join tags c on a.tid=c.id
                        left join actions d on a.wid=d.wid
                    where d.username='${username}'
                    group by tid,tag
                    order by saves_cnt desc,likes_cnt desc,shares_cnt desc,tag_cnt desc
                ) a
            )
        )

        and a.username not in (select username from followers where follower_username <>'${username}')
        and a.username not in (select blocked from blocked where blocker='${username}')
    group by a.id,title
    order by saves_cnt desc, likes_cnt desc, shares_cnt desc;
    `;
    //add to where statement on query
    //and a.username <> '${username}'
    return sql;
}

export function inspirationCnt (username) {
    const sql=`
    select
        count(distinct a.id) as post_cnt
    from wrides a
        left join actions b on a.id=b.wid
    where
        a.id in (
            select wid from wrides_tags where tid in (
                select tid from (
                    select
                        tid
                        ,tag
                        ,count(distinct a.id) as tag_cnt
                        ,sum(case when action=1 then 1 else 0 end) as likes_cnt
                        ,sum(case when action=2 then 1 else 0 end) as shares_cnt
                        ,sum(case when action=3 then 1 else 0 end) as saves_cnt
                    from wrides_tags a
                        left join wrides b on a.wid=b.id
                        left join tags c on a.tid=c.id
                        left join actions d on a.wid=d.wid
                    where d.username='${username}'
                    group by tid,tag
                    order by saves_cnt desc,likes_cnt desc,shares_cnt desc,tag_cnt desc
                ) a
            )
        )
        and a.username <> '${username}'
        and a.username not in (select username from followers where follower_username <>'${username}')
        and a.username not in (select blocked from blocked where blocker='${username}')
    `;
    return sql;
}
