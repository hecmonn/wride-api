import metaphone from 'metaphone';

export function prettyName(fname,lname){
    let capFname=fname.charAt(0).toUpperCase() + fname.slice(1);
    let capLname=lname.charAt(0).toUpperCase() + lname.slice(1);
    let fullName=`${capFname} ${capLname}`;
    return fullName;
}

export function initials (fname,lname){
    let capFname=fname.charAt(0).toUpperCase();
    let capLname=lname.charAt(0).toUpperCase();
    let initials=`${capFname}${capLname}`;
    return initials
}

export function _make_user_sound(data){
    let phonetic_name=metaphone(data.name);
    let phonetic_username=metaphone(data.username);
    let sound=phonetic_name===phonetic_username?phonetic_username:`${phonetic_name}${phonetic_username}`;
    return sound;
}
