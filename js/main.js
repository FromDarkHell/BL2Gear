var currentFocus = -1;

// This is our weapon suffix array filled with all of our suffixes.
var suffixArray;

// This is our weapon prefix array filled with all of our prefixes.
var prefixArray;

// This is our item prefix/suffix array.
var itemSuffixArray;
var itemPrefixArray;

window.onload = decodeURL;

// Close our auto-complete lists when we click on the document.
document.addEventListener("click", function(e) {
    closeAllLists(e.target);
});


// A function to decode our URL
function decodeURL() {
    // This is our URL for decoding
    var siteURL = window.location.href;
    // This happens if someone connects to just the domain with no attached links.
    if (_.isUndefined(siteURL.split("#")[1]) || !siteURL.split("#")[1].split("$")[0].includes(",")) {
        createSearch(false, true, -1, 0, false, undefined, undefined);
    }

    if (_.isUndefined(siteURL.split("$")[1]) || !siteURL.split("$")[1].includes(",")) {
        createSearch(false, false, 0, 1, false, undefined, undefined);
    }


    // Placeholder Arrays for our URL prefix/suffix data.
    var suffixURL = [];
    var prefixURL = [];


    // Gather our json file and assign the response to the variables.
    $.ajax({
        async: false,
        url: '/ItemDataParts/WeaponNames.json',
        dataType: 'json',
        success: function(response) {
            try {
                // Assign our array values.
                suffixArray = response.weaponSuffixes;
                prefixArray = response.weaponPrefixes;

                itemSuffixArray = response.itemSuffixes;
                itemPrefixArray = response.itemPrefixes;
            } catch (err) {
                (console.error || console.log).call(console, err.stack || err);
                alert('Error retrieving data from the JSON file!\nPlease contact the developers!');
            }
        },
        error: function() {
            alert('Unable to contact the server!\nPlease contact the developers!');
        }
    });

    var prefixesAndSuffixes = _.isUndefined(siteURL.split("#")[1]) ? [""] : siteURL.split("#")[1].split(",");

    for (var i = 0; i < prefixesAndSuffixes.length; i++) {
        if (prefixesAndSuffixes[i] == ",") { continue; }

        if (prefixesAndSuffixes[i].includes("$")) {
            prefixesAndSuffixes[i] = prefixesAndSuffixes[i].split("$")[0];
            prefixesAndSuffixes.length = i + 1;
        }

        if ((i + 1) % 2 != 0) {
            prefixURL.push(prefixesAndSuffixes[i]);
            continue;
        } else {
            suffixURL.push(prefixesAndSuffixes[i]);
            continue;
        }
    }
    createCombinedSearches(suffixURL, prefixURL, suffixArray, prefixArray, true);

    // Clean our arrays.
    suffixURL = [];
    prefixURL = [];

    // This is our item URL 'decoding'.
    if (!_.isUndefined(siteURL.split("$")[1])) {
        prefixesAndSuffixes = siteURL.split("$")[1].split(",");
    }

    for (var i = 0; i < prefixesAndSuffixes.length; i++) {
        if (prefixesAndSuffixes[i] == ",") {
            continue;
        }

        if (prefixesAndSuffixes[i].includes("#")) {
            prefixesAndSuffixes[i] = prefixesAndSuffixes[i].split("#")[0];
            prefixesAndSuffixes.length = i + 1;
        }

        if ((i + 1) % 2 != 0) {
            prefixURL.push(prefixesAndSuffixes[i]);
            continue;
        } else {
            suffixURL.push(prefixesAndSuffixes[i]);
            continue;
        }
    }

    createCombinedSearches(suffixURL, prefixURL, suffixArray, prefixArray, false);

}


// This encodes our URL based on the current data.
function encodeURL() {
    // Get a list of all of our inputs possible
    var inputs = document.getElementsByTagName('input')
    var hash = "";
    var hashCount = false;
    for (var i = 0; i < inputs.length; i++) {
        if ($(inputs[i]).attr('type') !== 'hidden') {
            var currentInput = inputs[i];
            var placeholder = currentInput.placeholder;
            var properArray;
            var encoded = false;

            // Define our proper array we want to touch.
            var properArray = (placeholder.includes("Weapon") ?
                (placeholder.includes("Prefix") ? prefixArray : suffixArray) :
                (placeholder.includes("Prefix") ? itemPrefixArray : itemSuffixArray));

            // Map our results
            $.map(properArray, function(val, i) {
                if (properArray[i].name === currentInput.value) {
                    if (placeholder.includes("Weapon")) {
                        hash += (i + ",");
                    } else {
                        if (hashCount === true) {
                            hash += (i + ",")
                        } else {
                            hash += ("$" + i + ",")
                            hashCount = true;
                        }
                    }
                    encoded = true;
                }
            });

            // This happens when our currentInput is an empty/unencodable value and can't be properly encoded using the map function.
            if (currentInput.value == "" || encoded === false) {
                if (placeholder.includes("Weapon")) {
                    hash += (",");
                } else {
                    if (hashCount === true) {
                        hash += (",")
                    } else {
                        hash += ("$" + ",")
                        hashCount = true;
                    }
                }
                encoded = true;
                continue;
            }
        }
    }
    hash = hash.replace(",$", "$").slice(0, -1);
    location.hash = hash;
}


// We just use this function to reduce repeating ourselves plenty of times.
function createCombinedSearches(suffixURL, prefixURL, suffixArray, prefixArray, weaponOrItem) {
    // Iterate through every suffix in the array.
    for (var i = 0; i < suffixURL.length; i++) {

        // This happens when our data provided in the URL > suffixArray.length thus causing a TypeError.
        // When this happens, go onto our next weapon.

        if (suffixArray.length < suffixURL[i] || prefixArray.length < prefixArray[i]) {
            continue;
        }

        var content = createSearch(false, weaponOrItem, i, suffixURL.length, true, suffixURL, prefixURL);
    }
}


// This function creates a new 'input' with the ability to use auto-complete.
function createSearch(prefix, weaponOrItem, count, length, name, array, prefixURL) {

    // This function takes a bool, 'prefix' to denote whether or not the input we need to create is a prefix or not.
    // It also takes another bool, 'weaponOrItem' to denote whether or not the input we need to create is an item or a weapon.
    // Count being equal to the fact that we might need to create a new search button.
    // if Count > length - 1 we need to create a new search button.
    // It then takes 'length' which is equal to the length of the array property
    // It'll also accept a 'name' bool, which'll note if we need to get a name through the current URL
    // It also accepts an 'array' variable, which is our current set of suffixes in the URL
    // The 'prefixURL' variable is the same thing but for our prefixes in the URL.

    // This is our weapon suffix array filled with all of our suffixes.
    var suffixArray;

    // This is our weapon prefix array filled with all of our prefixes.
    var prefixArray;

    // This is our item prefix/suffix array.
    var itemSuffixArray;
    var itemPrefixArray;

    $.ajax({
        async: false,
        url: '/ItemDataParts/WeaponNames.json',
        dataType: 'json',
        success: function(response) {
            try {
                // Assign our array values.
                suffixArray = response.weaponSuffixes;
                prefixArray = response.weaponPrefixes;
                itemSuffixArray = response.itemSuffixes;
                itemPrefixArray = response.itemPrefixes;
            } catch (err) {
                (console.error || console.log).call(console, err.stack || err);
                alert('Error retrieving data from the JSON file!\nPlease contact the developers!');
            }
        },
        error: function() {
            alert('Unable to contact the server!\nPlease contact the developers!');
        }
    });

    // Create our new search dialog box
    var content = document.createElement('input');

    content.placeholder = weaponOrItem ? "Weapon" : "Item";

    // Create our new div for 'content' to go into.
    var newDiv = document.createElement('div');

    // Change our font size.
    newDiv.style.fontSize = "30px";

    // Find our weapon divider
    var itemDivider = (weaponOrItem ? document.getElementById("weaponDiv") : document.getElementById("itemDiv"));

    // Append our div to the item divider.
    itemDivider.appendChild(newDiv);

    // Prefix Creation
    var prefixContent = document.createElement('input');
    prefixContent.placeholder = ((weaponOrItem ? "Weapon" : "Item") + " Prefix");
    prefixContent.style.marginRight = "5px";

    // Append Our Prefix Input 
    newDiv.appendChild(prefixContent);

    // Append our input box to the new div.
    newDiv.appendChild(content);

    if (count !== 0 && count !== -1) {
        createDeleteButton(newDiv, content, prefixContent);
    } else if (weaponOrItem === false) {
        prefixContent.style.marginRight = "5px";
        content.style.marginRight = "35px";
    }

    if (count == (length - 1)) { createSearchButton(weaponOrItem, newDiv); }
    var siteURL = window.location.href;
    if (weaponOrItem === true) {
        autoComplete(content, suffixArray);
        autoComplete(prefixContent, prefixArray);
        if (name) {
            if (!_.isUndefined(array) && !_.isUndefined(array[count]) && !_.isUndefined(count) && array[count] != "") {
                content.value = suffixArray[array[count]].name;
            }
            if (!_.isUndefined(prefixURL) && !_.isUndefined(prefixURL[count]) && !_.isUndefined(count) && prefixURL[count] != "") {
                prefixContent.value = prefixArray[prefixURL[count]].name;
            }
        }
    } else if (weaponOrItem === false) {
        autoComplete(content, itemSuffixArray);
        autoComplete(prefixContent, itemPrefixArray);
        if (name) {
            if (!_.isUndefined(itemSuffixArray) && !_.isUndefined(itemSuffixArray[count]) && !_.isUndefined(count) && itemSuffixArray[count] != "") {
                try {
                    content.value = itemSuffixArray[array[count]].name;
                } catch (err) {
                    // lol I'm lazy this works
                }
            }
            if (!_.isUndefined(itemPrefixArray) && !_.isUndefined(itemPrefixArray[count]) && !_.isUndefined(count) && itemPrefixArray[count] != "") {
                try {
                    prefixContent.value = itemPrefixArray[prefixURL[count]].name;
                } catch (err) {

                }
            }
        }
    }

    return content;
}

// This function creates a new 'button' element, which deletes the elements, inputBox / prefixBox.
function createDeleteButton(appendTo, inputBox, prefixBox) {
    var closeButton = document.createElement("button");
    var textNode = document.createTextNode("❌");

    closeButton.appendChild(textNode);
    closeButton.addEventListener("click", function(e) {
        prefixBox.parentElement.removeChild(prefixBox);
        inputBox.parentElement.removeChild(inputBox);
        closeButton.parentElement.removeChild(closeButton);
        encodeURL();
    });

    var newDiv = document.createElement('div');
    newDiv.style.display = "inline";

    newDiv.appendChild(closeButton);

    appendTo.appendChild(newDiv);
}

// This creates a new button which'll allow us to create a new weapon
function createSearchButton(weaponOrItem, appendTo) {

    // Create ourselves a new button 
    var searchButton = document.createElement("button");

    // Create a new text node to fill the button with.
    var t = weaponOrItem ? document.createTextNode("Create new weapon") : document.createTextNode("Create new item");

    // Fill our button with the text.
    searchButton.appendChild(t);

    // Establish a listener to our searchButton
    searchButton.addEventListener("click", function(e) {
        this.parentNode.removeChild(this);
        createSearch(false, weaponOrItem, -3, -2, false, undefined);
        encodeURL();
    });
    searchButton.style.marginRight = "35px";

    // Create a new div
    var newDiv = document.createElement('div');
    newDiv.style.fontSize = "30px";
    newDiv.style.display = "block";

    newDiv.appendChild(searchButton);

    appendTo.appendChild(newDiv);
}

// A function which establishes our auto-complete functionality onto the 'inp' variable and auto-completes using the 'arr' array.
function autoComplete(inp, arr) {
    // This function takes two arguments:
    // The element we need to attach autocomplete to.
    // The Array of possible auto-completable values.

    // A function for when anyone writes text into our text field for auto-complete.
    inp.addEventListener("input", function(e) {
        var itemsList, itemsDiv, i, val = this.value;

        // Close already open auto-complete lists if any exist.
        closeAllLists();

        if (!val) return false;

        currentFocus = -1;

        autocompleteDiv = document.createElement("div");
        autocompleteDiv.setAttribute("class", "autocomplete")

        // Create ourselves a DIV element to contain our values.
        itemsList = document.createElement("div");
        itemsList.style.padding = "0px 15px 0px 0px";

        itemsList.style.top = "50%"
        itemsList.style.left = "length / 2"
        itemsList.style.right = "length"

        itemsList.setAttribute("id", this.id + "autocomplete-list");
        itemsList.setAttribute("class", "autocomplete-items");

        // Append the DIV element as a child of our container.
        this.parentNode.appendChild(autocompleteDiv)
        
        autocompleteDiv.appendChild(itemsList);

        var sortedList = [];
        for (i = 0; i < arr.length; i++) {
            var currentArrayValue = arr[i].name.substring(0, this.value.length);
            var jaroWinkler = distance(currentArrayValue, val);

            if (jaroWinkler > 0.85) {
                sortedList[arr[i].name] = jaroWinkler;
            }
        }

        sortedList = sortProperties(sortedList);
        for (i = 0; i < sortedList.length; i++) {

            itemsDiv = document.createElement('div');
            var itemName = sortedList[i][0];
            var matchingText = itemName.substring(0, this.value.length);

            // Make our matching letters bold
            itemsDiv.innerHTML = "<strong>" + matchingText + "</strong>" + itemName.substr(val.length) + "<input type='hidden' value=\"" + itemName + "\">";
            itemsDiv.addEventListener("click", function(e) {

                // Change our text-box value to the value of our checked box.
                inp.value = this.getElementsByTagName("input")[0].value;
                encodeURL();
                // Close our auto-completed lists.
                closeAllLists();
            });
            itemsList.appendChild(itemsDiv);
        }
    });


    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");

        if (x) x = x.getElementsByTagName("div");

        if (e.keyCode == 40) {
            // Up Arrow
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            // Down Arrow
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            // Enter Key
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });
}

// This copies our current URL to the clipboard.
function permalink() {
    const text = document.createElement('textArea');
    text.value = window.location.href;
    document.body.appendChild(text);
    text.select();
    document.execCommand('copy');
    window.location.href = text.value;
    document.body.removeChild(text);
}

// A function to add the 'active' class to x[currentFocus].
function addActive(x) {
    if (!x) return false;

    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;

    if (currentFocus < 0) currentFocus = (x.length - 1);

    x[currentFocus].classList.add("autocomplete-active");
}

// A function to remove the "active" class from all autocomplete items
function removeActive(x) {
    for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
    }
}

// A function to close all auto-complete lists.
function closeAllLists(elmnt, inp) {
    // Close all autocomplete lists in the document except for the elmnt variable.
    var x = document.getElementsByClassName("autocomplete-items");

    for (var i = 0; i < x.length; i++) {
        x[i].parentNode.removeChild(x[i]);
    }
}

// This sorts a key-value pair object.
function sortProperties(obj) {
    // convert object into array
    var sortable = [];
    for (var key in obj)
        if (obj.hasOwnProperty(key))
            sortable.push([key, obj[key]]); // each item is an array in format [key, value]

    // sort items by value
    sortable.sort(function(a, b) {
        return (a[1] - b[1]); // compare numbers
    });
    return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
}

// This calculates the Jaro-Winkler distance 
function distance(s1, s2) {
    var m = 0;
    var i;
    var j;

    // Exit early if either are empty.
    if (s1.length === 0 || s2.length === 0) {
        return 0;
    }

    s1 = s1.toUpperCase();
    s2 = s2.toUpperCase();

    // Exit early if they're an exact match.
    if (s1 === s2) {
        return 1;
    }

    var range = (Math.floor(Math.max(s1.length, s2.length) / 2)) - 1;
    var s1Matches = new Array(s1.length);
    var s2Matches = new Array(s2.length);

    for (i = 0; i < s1.length; i++) {
        var low = (i >= range) ? i - range : 0;
        var high = (i + range <= (s2.length - 1)) ? (i + range) : (s2.length - 1);

        for (j = low; j <= high; j++) {
            if (s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j]) {
                ++m;
                s1Matches[i] = s2Matches[j] = true;
                break;
            }
        }
    }

    // Exit early if no matches were found.
    if (m === 0) {
        return 0;
    }

    // Count the transpositions.
    var k = 0;
    var numTrans = 0;

    for (i = 0; i < s1.length; i++) {
        if (s1Matches[i] === true) {
            for (j = k; j < s2.length; j++) {
                if (s2Matches[j] === true) {
                    k = j + 1;
                    break;
                }
            }
            if (s1[i] !== s2[j]) {
                ++numTrans;
            }
        }
    }

    var weight = (m / s1.length + m / s2.length + (m - (numTrans / 2)) / m) / 3;
    var l = 0;
    var p = 0.1;

    if (weight > 0.7) {
        while (s1[l] === s2[l] && l < 4) {
            ++l;
        }

        weight = weight + l * p * (1 - weight);
    }

    return weight;
}