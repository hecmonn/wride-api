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
