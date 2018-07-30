var page = require('webpage').create();

page.viewportSize = {
	width: 1680,
	height: 1200
};
page.settings.localToRemoteUrlAccessEnabled=true;

page.onAlert = function(msg) {
	console.log("Got alert");
  	console.log('ALERT: ' + msg);
};

var human_click = function(elementIn){
	function offset(el) {
		console.log("starting offset " + el)
		var rect = page.evaluate(function(el) {
			btn = document.querySelector(el);
    		return btn.getBoundingClientRect();
		}, el);
		console.log("Returning");
    	return { top: rect.top, left: rect.left};
	}
	console.log("Offset");
	var element_offset = offset(elementIn)
	console.log("clicking " + element_offset.top);
	page.sendEvent('click', element_offset.left+1, element_offset.top+1);
	console.log("clicked")
}

page.open('http://localhost:8080', function(status) {

  console.log("Status: " + status);
  page.render('phantom_test1.jpeg');
  page.evaluate(function() {
    document.querySelector("#txtConfDesc").value="phantomjs";
  });
  /*var button = page.evaluate(function() {
    document.querySelector("#btnFP").click();
	return document.querySelector("#btnFP").innerHTML;
  });
  console.log(button);*/
  setTimeout(function () {
      page.evaluate(function() {
        saveFP();
      });    
    page.render('phantom_test2.jpeg');
    /*console.log("Human click")
    human_click("#btnFP");
    console.log("done")
    page.evaluate(function() {
      saveFP();
    });
	*/
    page.render('phantom_test3.jpeg');
    setTimeout(function () {
      phantom.exit();		
    },5000);
  },2000);
});