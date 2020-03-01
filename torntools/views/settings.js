window.onload = function(){
    console.log("TT - Settings");

    // set update to false and check if api is online
    setUpdateToFalse();

	// setup settings
	chrome.storage.local.get(["settings", "allies"], function(data){
		let settings = data.settings;
		let allies = data.allies;
		showSettings(settings, allies);
	});

	// reset api key button
	const api_button = document.querySelector("#change-api");
	api_button.addEventListener("click", function(){
		resetApikey();
	});

	// reset settings button
	const reset_settings_button = document.querySelector("#settings #reset-button");
	reset_settings_button.addEventListener("click", function(){
		resetSettings();
	});

	// setup changelog
	const ver = chrome.runtime.getManifest().version;
	document.querySelector("#current-version").innerText = "Current version: " + ver;
	showChangelog(ver);

	// save settings button
	const save_settings_button = document.querySelector("#settings #save-button");
	save_settings_button.addEventListener("click", function(){
		saveSettings();
	});
}

function showSettings(settings, allies){
	let tabs = settings.tabs;
	let pages = settings.pages;

	// set tabs
	for(let tab in tabs){
		if(tab == "default")
			continue;
		document.querySelector(`#${tab}-check`).checked = tabs[tab];
	}

	// default tab
	document.querySelector(`#def-${tabs.default}`).checked = true;

	// achievements
	document.querySelector(`#achievements-show`).checked = settings.achievements.show;
	document.querySelector(`#achievements-completed`).checked = settings.achievements.show_completed;

	// other settings
	for(let page in pages){
		try{
			for(let option in pages[page]){
				try {
					document.querySelector(`#${page}-${option}`).checked = pages[page][option];
				}catch(err){}
			}
		}catch(err){}
	}

	// show allies
	console.log(allies)
	let allies_text = "";
	for(let ally of allies){
		allies_text = allies_text + ally;
		
		if(allies[allies.length-1] != ally){
			allies_text += ",";
		}
	}
	document.querySelector("#allies").value = allies_text;
}

function saveSettings(){
	let tabs = {}
	let pages = {}
	let achievements = {
		"show": true,
		"show_completed": true
	}
	let allies = [];

	// achievements
	achievements.show = document.querySelector("#achievements-show").checked;
	achievements.show_completed = document.querySelector("#achievements-completed").checked;

	// tabs
	for(let tab of document.querySelectorAll(".tab")){
		tabs[tab.id.replace("-check","")] = tab.checked;
	}

	// default tab
	tabs.default = document.querySelector(".def-tab:checked").id.replace("def-", "");

	// pages
	const options = document.querySelectorAll(".page");
	for(let option of options){
		let id = option.id;
		let page_name = id.split("-")[0];
		let option_name = id.split("-")[1];

		pages[page_name] = pages[page_name] || {};
		pages[page_name][option_name] = option.checked;
	}

	// allies
	let allies_text = document.querySelector("#allies").value;
	allies = allies_text.split(",");

	// set allies
	chrome.storage.local.set({"allies": allies}, function(){
		console.log("Allies set");
	});

	// write settings
	chrome.storage.local.get(["settings"], function(data){
		let settings = data.settings;
		settings.achievements = achievements;
		settings.tabs = tabs;
		for(let page in settings.pages){
			if(pages[page])
				settings.pages[page] = pages[page];
		}

		console.log("settings", settings);

		chrome.storage.local.set({"settings": settings}, function(){
			console.log("Saved settings.");
			notification("Settings saved.");
		});
	});
}

function setUpdateToFalse(){
	chrome.storage.local.get(["update", "api"], function(data){
		if(data["updated"] === true){
			chrome.storage.local.set({"updated": false},function(){
				console.log("Set update as read.");
			});
		}

		if(data.api.online == false){
			document.getElementById("error").innerText = `Api system is down! + (${data.api.error})`;
		}
	});
}

function resetApikey(){
	let api_key = document.querySelector("#api-input").value;

	chrome.storage.local.set({"api_key": api_key}, function(){
		console.log("API key set.");
		chrome.runtime.sendMessage({"action": "START"});  // re-fetch info
		notification("API key reset.")
	});
}

function showChangelog(ver){
	const changelog_ul = document.querySelector("#changelog");
	for(let v in changeLog){
		let mainSection = document.createElement("li");
		let lowerSection = document.createElement("ul");
		mainSection.innerText = v;
		if(v.indexOf(ver) != -1){
			mainSection.style.backgroundColor = "#ffff0240";
		}

		if(Object.keys(changeLog[v])[0] !== "0"){
			for(let sub_section in changeLog[v]){
				let li = document.createElement("li");
				let ul = document.createElement("ul");
				li.innerText = sub_section;

				for(let bug of changeLog[v][sub_section]){
					let li = document.createElement("li");
					li.innerText = bug;
					ul.appendChild(li);
				}
				li.appendChild(ul);
				lowerSection.appendChild(li);
			}
		} else {
			for(let bug of changeLog[v]){
				let li = document.createElement("li");
				li.innerText = bug;
				lowerSection.appendChild(li);	
			}
		}


		mainSection.appendChild(lowerSection);
		changelog_ul.appendChild(mainSection);
	}
}

function getLowest(lists){
	var lowest;

	for(let list of lists){
		for(let id in list){
			let price = parseInt(data[list][id]["cost"]);

			if(!lowest){
				lowest = price;
			} else if(price < lowest){
				lowest = price
			}
		}
	}
	return lowest;
}

function resetSettings(){
	const settings = {
		"settings": {
			"tabs": {
				"market": true,
				"stocks": true,
				"calculator": true,
				"default": "market"
			},
			"achievements": {
				"show": true,
				"show_completed": true
			},
			"pages": {
				"trade": {
					"calculator": true
				},
				"home": {
					"networth": true
				},
				"bazaar": {
					"show": true
				},
				"auction": {
					"show": true
				},
				"missions": {
					"show": true
				},
				"forums": {
					"textbox_size": true,
					"auto_scroll_top": true
				},
				"mail": {
					"show": true
				},
				"city": {
					"show": true,
					"items_value": true
				},
				"hub": {
					"show": true,
					"pinned": false
				}
			}
		}
	}
	chrome.storage.local.set({"settings": settings}, function(){
		console.log("Settings reset.")
		notification("Settings reset.");
	});
}

function notification(message){
	$("#message").text(message);
	$("#message").slideDown("slow", function(){});
	setTimeout(function(){
		$("#message").slideUp("slow", function(){});
	}, 2000);
}

const changeLog = {
	"v3.2": {
		"Features": [
			"Show warning on player profiles when the player is in your faction or in an ally faction.",
			"Show racing upgrade values."
		]
	},
	"v3.1": {
		"Fixes": [
			"Fixed the extension not updating after an API outage."
		]
	},
	"v3 - Long time, no see(?)": {
		"Features": [
			"I removed some features either because they were not needed anymore (Torn has them default) or they weren't worth it. (auction, bazaar, forums, mail, profile voting) Let me know of any thoughts or ideas about these.",
			"Changed the system for saving settings so don't forget to press the Save button."
		],
		"Fixes": [
			"Fixed long numbers on achievements (shortened to mil)",
			"Fixed wrong prices in Market",
			"Fixed Missions prices not appearing if the prices were split into 2 groups",
			"Fixed API page not working properly (the API key was inserted as 'unknown')",
			"Updated API request info"
		]
	},
	"v2.1 - clean-up": {
		"Fixes": [
			"Fixed Awards not showing up (reworked whole achievement display code - let me know of any bugs)",
			"Fixed wrong API errors"
		]
	},
	"v2.0 - The next big V huh..": {
		"Fixes": [
			"Fixed stock long unrounded numbers.",
			"Fixed tabs not showing error when API was down (hopefully?)"
		],
		"Build": [
			"Refactored the extension so it is easier to develop. And easier to deploy on FireFox also.",
			"I bundled up all files into one right now. Which means a 1 bigger file is loaded on every site. Let me know of any performance issues or anything - I'll make it smaller if needed (probably even if not needed - YOUR FEEDBACK COUNTS)"
		],
		"PS.": [
			"I understand there are some features that are quite buggy (not to name any names but.. *cough* bazaar helper, faction chats .. *cough*). I'll try to work on those :)",
			"Some features might have broken down during the changes I made. Let me know of any features that don't work at all or work incorrectly.",
			"PS. I was on holiday for a bit but I'm back now, so code.. here I come.."
		]
	},
	"v1.9": {
		"New Features": [
			"City Find - shows items in city view and also the total price (Item List is hidden when using DocTorn - total price is still shown) - (Thanks Tos :))",
			"Added a few new achievements. (missions - total hits, largest mug, slashing hits)",
			"Multiple channels for Faction chat - disabled by default (learn more about it below - under Settings)",
			"Awards sections now show last fetch time",
			"Implemented API system fail check - data is not overwritten with errors anymore.",
			"There is now an option to Vote a player (commend or report - upvote/downvote) once in total. The stats are kept on my server. (No other information is sent to my server other than the User's name whose page you are visiting). This system will make it easier to recognize scammers and also trusted people.",
			"Also I set up a system where you can get user IDs via their name (not available this way on API yet) and to fill that database quicker when you visit a user's profile TornTools sends that users info to my server (again no other information is send than just the user's name and id)",
			"Any complaints or questions about sending info to my server - please let me know! (If you understand code and want to check for yourself then all 'POST' requests are done in background.js file)"
		],
		"Fixes": [
			"Fixed issue where TornTools area wasn't shown anywhere else than desktop PCs.",
			"Made forum boxes smaller a bit.",
			"Fixed '/undefined' in mission achievements (killstreak)",
			"Removed achievement for 'Energy cans taken' as it was showing false info. Will add back when API shows stats for it."
		],
		"Extras": [
			"When going to api.torn.com then the api key field is automatically filled with user's api key.",
			"When You find that api shows stats for some achievement that I have not displayed then please let me know :)",
			"Also added code to github if anyone is interested - https://github.com/Mephiles/tornTools"
		]
	},
	"v1.8": {
		"New Features": [
			"Added option to make Mail text box bigger. (both when composing and replying to a mail)",
			"Added option to notify of Vicodin in bazaars that are priced over 100k. (I think you know why ;), price might be changed if for some reason Vicodin gets more expensive in the future)",
			"Bazaar helper now also shows the lowest price on market when managing items in your bazaar. (On both occasions look for the green checkmark - in case you don't see it or see a red cross: a reload might help. If not then check your settings. If still not then let me know!)",
			"As suggested by a user - a sub-tab is added to Stocks where you can add different stocks (permanently until removed) and see their benefits (and stock amounts needed/already owned)."
		],
		"Fixes": [
			"TornTools link is now only shown under Areas when an update is installed. Settings can still be accessed by the 'wheel' when opening extension window.",
			"Added back info about API requests - be sure to see what will make one!"
		],
		"API REQUEST - IMPORTANT": [
			"--GREATLY REDUCED API REQUEST AMOUNTS--",
			"Trade Calculator makes no requests anymore.",
			"Mission values makes no requests anymore.",
			"Networth on Home site makes no requests anymore.",
			"LEARN MORE FROM API REQUEST INFO DOWN BELOW"
		],
		"Extras": [
			"I do NOT encourage signing up on my site yet as it is still 'under construction' and databases might be dropped quite frequently (meaning your user info will be lost). I will notify of future developments.",
			"Also any ideas are welcome (or if you want something personal made for you on my site?).",
			"Also also.. As you might have noticed - my 'designing' skills aren't the best (I'm okay with what I have right now but everything can be improved, right?) so hit me up if You want to help out, site design, logos, banners etc."
		]
	},
	"v1.7.1": {
		"New Features": [
			"Added some functions for forum pages: 1) Added button that will take you to the top of the page. 2) Increased input box size.",
			"Added option to automatically scroll to the top of forum threads when going to one. (not ideal but works)",
			"Added option to show actual networth (fetched from API - 1-2min delay) on Home page.",
			"Added reset settings button.",
			"Added an area for Torn Tools under Areas - directs to this page. (also notifies of a new version release)",
			"Added indicator if the Bazaar Helper is working as it sometimes fails to load correctly (in case of failure - reloading the page should help)",
			"Please note that when you start adding items to bazaar but you are not on the main tab where all items are present then only the items on the opened tab will be 'watched'. When this occurs just click on 'all items' and refresh the page."
		],
		"Fixes": [
			"Fixed wrong price info on auctions.",
			"Noticed that the same info was shown for Market and Bazaar (prices & quantities) in Market tab. Fixed that."
		],
		"IMPORTANT": [
			"Please note that I removed API limit on trades (temporarily). It will be re-enabled once I figure out some code bugs etc."
		],
		"Extras": [
			"Removed info about API requests amount. (Might add it back with more detailed info in later updates.)",
			"If any users had problem with setting the API key (nothing seemed to happen) - hopefully that is fixed now.",
			"Sorry if that update took a long time: reworked some code into parts so it is easier to add future features. Also holidays.. so.. :)",
			"Also working on making a site for TornTools for databases etc. Also for personal education as this is my first :) - www.torntools.eu"
		]
	},
	"v1.6.2": [
		"Re-enabled bazaar price helper (available from settings - disabled by default to not cause any confusion) !!! Note that it only shows the price as a placeholder and You have to insert the price yourself."
	],
	"v1.6.1": [
		"Added a colored bar that shows if you can afford a mission reward or not."
	],
	"v1.6": [
		"Added option to show mission reward values. (especially useful - one point value)",
		"Searchbars on Market and Calculator tabs auto-focus when opened."
	],
	"v1.5.1": [
		"Temporarily disabled Bazaar Helper as there is a bug with pricing. Patch coming soon!"
	],
	"v1.5": [
		"Added bazaar price helper - auto complete prices (lowest on market)",
		"Added auction helper - show your own auctions all together",
		"Technical: reworked settings section of the extension"
	],
	"v1.4": [
		"Fixed bug where trade values where not displayed in case of 0 items",
		"Added changelog",
		"Removed help section from settings",
		"Reduced api request amount in trade view. Set api limit to 60 requests on trade view."
	]
}