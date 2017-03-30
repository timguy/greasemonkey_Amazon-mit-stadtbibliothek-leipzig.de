// ==UserScript==
// @name Amazon mit stadtbibliothek-leipzig.de
// @namespace de.leipzig.library
// @description Reichert die Amazon Buch Detail Seite mit Informationen zur Verfügbarkeit aus der stadtbibliothek-leipzig.de an (Enriches amazon book detaily page by availability information from stadtbibliothek-leipzig.de)
// @version 1.0
// @include       *.amazon.*/dp/*
// @include       *.amazon.*/gp/product*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js
// @grant       GM_xmlhttpRequest
// @author timguy
// @license MIT
// @noframes    
// @run-at document-end
// ==/UserScript==
addOwnHTML();
updateProgressBar(10);
var isbn = getIsbn(window.content.location.href);
console.log("Parsed amazon ISBN:" + isbn);
updateProgressBar(20);
var libraryStartPage = "https://webopac.stadtbibliothek-leipzig.de/webOPACClient/start.do";
var libraryDetailSearchPage = "https://webopac.stadtbibliothek-leipzig.de/webOPACClient/search.do?methodToCall=submit&CSId=USERSESSIONIDplaceholder&methodToCallParameter=submitSearch&searchCategories%5B0%5D=100&searchString%5B0%5D=&combinationOperator%5B1%5D=AND&searchCategories%5B1%5D=540&searchString%5B1%5D=ISBN_placeholder&combinationOperator%5B2%5D=AND&searchCategories%5B2%5D=331&searchString%5B2%5D=&submitSearch=Suchen&callingPage=searchParameters&selectedViewBranchlib=0&selectedSearchBranchlib=&searchRestrictionID%5B0%5D=4&searchRestrictionValue1%5B0%5D=&searchRestrictionValue2%5B0%5D=&searchRestrictionID%5B1%5D=3&searchRestrictionValue1%5B1%5D=";
//Im Request Header muss das hier sein:
//Cookie:JSESSIONID=D37A423603C9C747A637F949BD6CA2BE; USERSESSIONID=18225N35Sd2f78b0ca8462efa8e52887c63e647f65e98852f; BaseURL="/webOPACClient/start.do?BaseURL=this"; USERSESSIONID=13071N17Sf3948e533b6bf5afbdbb2e830bb7f0ff9e8ee6cd; BaseURL=""
//var respHeader = getCookie(libraryStartPage);
var respHeader;
getCookie(libraryStartPage);
updateProgressBar(30);
function continueAfterCookie(respHeader) {
  updateProgressBar(40);
  var cookieHeader = parseCookieHeaders(respHeader);
  console.log('response received  getCookie: \t jSessionId: ' + cookieHeader.strJSessionID + '\t strUserSessionID: ' + cookieHeader.strUserSessionID);
  callSearch(libraryDetailSearchPage, cookieHeader);
}//search for the isbn and include all cookie and session information

function callSearch(libraryDetailSearchPage, cookieHeader) {
  updateProgressBar(50);
  libraryDetailSearchPage = libraryDetailSearchPage.replace('USERSESSIONIDplaceholder', cookieHeader.strUserSessionID);
  libraryDetailSearchPage = libraryDetailSearchPage.replace('ISBN_placeholder', isbn);
  console.log('start call libraryDetailSearchPage:' + libraryDetailSearchPage);
  GM_xmlhttpRequest({
    method: 'GET',
    url: libraryDetailSearchPage,
    headers: {
      'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey/0.3',
      'Accept': 'application/atom+xml,application/xml,text/xml',
      //'Cookie': cookieHeader.strSetCookieHeader,
    },
    onload: function (response) {
      updateProgressBar(80);
      console.log('response received libraryDetailSearchPage: ' + response.status);
      var searchResponse = response.responseText;
      //console.log(searchResponse);
      if (searchResponse.includes('keine Treffer'))
      {
        console.log('library didnt found a book for given isbn' + isbn);
        addHTMLbiboContent('Buch ISBN (' + isbn + ') gibt es nicht in der Bibo');
        updateProgressBar(100);
        return 0;
      }
      var dataTable = $(searchResponse).find('#tab-content').html();
      //console.log('-----------------------\ntabContent: ' + dataTable);
      addHTMLbiboContent(dataTable);
      updateProgressBar(100);
    }
  });
}//################### Help methods ################################
//get the cookie from library page and session information

function getCookie(libraryStartPage) {
  console.log('start call:' + libraryStartPage);
  GM_xmlhttpRequest({
    method: 'GET',
    url: libraryStartPage,
    headers: {
      'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey/0.3',
      'Accept': 'application/atom+xml,application/xml,text/xml',
    },
    onload: function (response) {
      //console.log(response.responseHeaders);
      continueAfterCookie(response.responseHeaders);
    }
  });
}// Method based on http://userscripts-mirror.org/scripts/show/1396 - Based on work by Carrick Mundell http://userscripts.org/scripts/show/1396

function getIsbn(url) {
  try {
    //match if there is a / followed by a 7-9 digit number followed by either another number or an x 
    //followed by a / or end of url 
    var isbn = url.match(/\/(\d{7,9}[\d|X])(\/|\?|$)/) [1];
  } catch (e) {
    return 0;
  }
  return isbn;
}
function addOwnHTML()
{
  var inclLibText = '<div id="inclLibText">stadtbibliothek-leipzig.de<br/> <progress id="biboProgress" value="0" max="100"> <i class="fa fa-car"></i> </progress> <div id="biboContent"> </div> </div>    ';
  $(inclLibText).insertBefore('#MediaMatrix');
  $('#inclLibText').attr('style', 'border-radius: 25px; background: #73AD21; padding: 20px;');
}
function addHTMLbiboContent(biboContent)
{
  $('#biboContent').replaceWith(biboContent);
}
function updateProgressBar(value)
{
  $('#biboProgress').val(value);
};
//parse cookie and session details
function parseCookieHeaders(strAllRequestHeaders) {
  var strSetCookieHeader = strAllRequestHeaders.match(/Set-Cookie: ([\s\S]*?)Keep-Alive/) [1];
  var strUserSessionID = strSetCookieHeader.match(/USERSESSIONID=(.*)/) [1];
  var strJSessionID = strSetCookieHeader.match(/JSESSIONID=(.*?);/) [1];
  return {
    strSetCookieHeader: strSetCookieHeader,
    strUserSessionID: strUserSessionID,
    strJSessionID: strJSessionID
  };
};
