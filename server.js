var http = require('http');
var fs = require('fs');
var url = require('url');
// Load the static index page into memory.
var index = fs.readFileSync('index.html');
const PAGESIZE=10;
var fileList=[];

// Initialize the file list in memory. This way we don't have to access the HDD
// everytime there' a query.
function init() {

    // Read the list of files into memory.
    fs.readdir("textfiles/", (err, files) => {
        if (err) {
            abort("Unable to read from textfiles directory.");
        }
        fileList=files;
    });
}

function handleIncomingRequest(request, response) {
    request.parsedUrl=url.parse(request.url, true);
    // This is the base URL without the query.
    var coreUrl = request.parsedUrl.pathname.toLowerCase();
    console.log("Core URL: "+coreUrl);

    if(coreUrl == "/index.html") {
        handleIndex(request, response);
    } else if(coreUrl == "/pages") {
        handlePages(request, response);
    } else {
        sendError(response, 404, notFound());
    }
}

function handleIndex(request, response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    // The index page was already loaded into memory.
    response.end(index);
}

// Parse the request and list the text files.
// Send an error if the page is out of range.
// The PAGESIZE const is at the top.
function handlePages(request, response) {
    var page = request.parsedUrl.query.page;

    // If the page is beyond the file list, set it to the last page.
    if(page*PAGESIZE>fileList.length) {
        console.log("Page requested beyond file list length.");
        page = parseInt((fileList.length-PAGESIZE)/PAGESIZE);
    }

    // If the page is negative, set it to zero.
    page = page<0 ? 0 : page;

    // content will be the web page that is sent to the browser.
    var content = "<html><head><title>Page "+page+"</title></head><body>";

    content += "<h1>File list - page: "+page+"</h1>";

    content += "<ul>";

    // Create a list of file names.
    for(var i=0; i<PAGESIZE && (page*PAGESIZE+i)<fileList.length; i++) {
        content += "<li>"+fileList[page*PAGESIZE+i]+"</li>";
    }
    content += "</ul>";

    // Make paging buttons using ternary operator. If the button isn't going to show, it is left blank. The other way
    // would be to have the CSS handle it.
    content += page>0 ? "<button type=\"button\" onClick=\"location.href='/pages?page="+(page-1)+"'\" name=\"button\">Page: "+(page-1)+"</button>" : "";
    content += (parseInt(page)+1)*PAGESIZE<fileList.length ? "<button type=\"button\" onClick=\"location.href='/pages?page="+(parseInt(page)+1)+"'\" name=\"button\">Page: "+(parseInt(page)+1)+"</button>" : "";

    content += "</body></html>";

    response.writeHead(200, {"Content-Type" : "text/html"});
    response.end(content);
}

// An error function.
function notFound() {
    return createError('invalid_resource', "The requested resource does not exist.");
}

// Receives response object, code:int, err:object.
// Send the error as the server response.
function sendError(response, code, err) {
    response.writeHead(code, {"Content-Type" : "application/json"});
    response.end(JSON.stringify({error : err.code, message : err.message}));
}

// Receives error:string, message:string.
// Returns a new error object storing the message and the code.
function createError(code, message) {
    var e = new Error(message);
    e.code = code;
    return e;
}

// Americans are already purchasing a "grass roots movement" to counter this.
function abort(message) {
    console.error(message);
    process.exit(1);
}

init();
var s = http.createServer(handleIncomingRequest);
s.listen(8080);
