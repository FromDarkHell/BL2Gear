window.onload = decodeURL;

function main() {

}

function decodeURL() {
	
	// This is our URL for decoding
	var siteURL = window.location.href;

	if(_.isUndefined(siteURL.split("#")[1])) {
		return;
	}

	// This is our item suffix array filled with all of our suffixes.
	var suffixArray;

	// This is our item prefix array filled with all of our prefixes.
	var prefixArray;

	// Gather our json file from myjson.com and assign the response to the data variable.
	$.ajax({
		async: false,
		url: 'https://api.myjson.com/bins/115wj4',
		dataType: 'json',
		success: function(response) {
			// Assign our array values.
			suffixArray = response.weaponSuffixes;
			prefixArray = response.weaponPrefixes;
		},
		error: function() {
			alert('Unable to contact the server!\nPlease contact the developers!');
		}
	});
	

	// Split our URL on '#'.
    var splitURL = siteURL.split("#");

    // Fix our 0th entry in the array to include proper data.
    splitURL.shift();

    // Split our array further
    var suffixURL = splitURL[0].toString().split("$")[0].split(",");
    var prefixURL;

    try {
    	// Create our prefix array based on the URL.
    	prefixURL = siteURL.split("$");
    	prefixURL = prefixURL[1].toString().split(",");
    } catch(err) {
    	prefixURL = "";
    }

    // Iterate through every weapon suffix in the URL.
    for (var i = 0; i < suffixURL.length; i++) {
    	// This happens when our data provided in the URL > suffixArray.length thus causing a TypeError.
    	if(suffixArray.length <= suffixURL[i]) {
    		continue;
    	}

    	// Create a variable for our combined weapon name w/ prefixes / suffixes.
    	var totalWeaponName = "";

    	// If our prefix / suffix array in our URL is improper, skip over the prefix.
    	// It might also be best to exclude the current weapon through a continue statement, but I find this to be better.
    	try {
	    	// Add our respective prefix.
	    	totalWeaponName += prefixArray[prefixURL[i]].name + " ";
    	} catch(err) {
    		totalWeaponName += "";
    	}

    	// Find our weapon divider
    	var weaponDivider = document.getElementById("weaponDiv");

    	// Get our suffix for our weapon.
    	totalWeaponName += suffixArray[suffixURL[i]].name + "\n";

    	// Create a new text node to go in our div.
    	var content = document.createTextNode(totalWeaponName);

    	// Create a new div for our text-node to go into.
    	var newDiv = document.createElement('div');

    	// Change out font size.
    	newDiv.style.fontSize = "35px";

		// Change our padding.
		newDiv.style.paddingTop = "12px";
		newDiv.style.paddingLeft = "3.5px";

    	// Append our new div onto our weapon divider.
    	weaponDivider.appendChild(newDiv);

    	// Append our text onto our new div.
    	newDiv.appendChild(content);
    }
}

function encodeURL() {

}
