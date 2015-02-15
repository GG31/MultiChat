//Needed a simply format of a Date object. See getFormatedDate
function getFormatedToday(){
    return getFormatedDate(new Date());
}

// Return the date with the format dd/mm/yyyy hh:mm. Yes, it may already exists, but that was not hard to code.
function getFormatedDate(d){
    var day = formatInt(d.getDate());
    var month = formatInt(d.getMonth()+1); // months are 0-based : January is the month 0
    var year = d.getFullYear();
    var hours = formatInt(d.getHours());
    var minuts = formatInt(d.getMinutes());
    
    return "" + day + "/" + month + "/" + year + " " + hours + ":" + minuts
}

// Used to have always 2 digits for a number
function formatInt(i){
    return (i<10 ? '0'+i : ''+i);
}

//Return the html code for the date d
function getHTMLDate(d){
    return "<div class='date'>"+getFormatedDate(d)+"</div>"
}

// Return the html code for today
function getHTMLToday(){
    return "<div class='date'>"+getFormatedToday()+"</div>"
}

/*
 * This function fill a DOM element represented by its JQuery selector (domElem) with the given value
 */
function setInfoToDom(domElem,value){
    $(domElem).html(value);
}

// Special function that may be called by the server if it needs the socket, mainly
function mirror(emitName,data){
    getSocket().emit(emitName,data);
}