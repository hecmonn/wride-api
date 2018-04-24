export function inspiration (username) {
    const sql=`
    select
        a.id,a.title,a.username,a.content
        ,e.fname,e.lname,e.path
        ,d.path as post_path
        ,sum(case when b.action=1 and b.username='${username}' then 1 else 0 end) as is_liked
        ,sum(case when b.action=2 and b.username='${username}' then 1 else 0 end) as is_shared
        ,sum(case when b.action=3 and b.username='${username}' then 1 else 0 end) as is_saved
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
    group by a.id,title
    order by saves_cnt desc, likes_cnt desc, shares_cnt desc;
    `
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
    `;
    return sql;
}
