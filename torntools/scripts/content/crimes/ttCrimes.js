$(document).ready(function(){
    let script_tag = doc.new({type: "script", attributes: {type: "text/javascript", src: chrome.runtime.getURL("/scripts/content/crimes/ttInject.js")}});
    doc.find("head").appendChild(script_tag);
})

messageBoxLoaded().then(function(){
    console.log("TT - Quick crimes");

    // Quick crimes
    quickCrimesMain(quick);

    crimesLoaded().then(function(){
        markCrimes();
    });
    

    let in_progress = false;
    let content_wrapper = doc.find(".content-wrapper");
    let content_observer = new MutationObserver(function(mutationList, observer){
        if(doc.find("#ttQuick") || in_progress) return;
        in_progress = true;

        messageBoxLoaded().then(function(){
            if(doc.find("#ttQuick")) return;

            local_storage.get("quick", function(quick){
                quickCrimesMain(quick);
            });
            in_progress = false;
        });

        crimesLoaded().then(function(){
            markCrimes();
        });
        
    });
    content_observer.observe(content_wrapper, {childList: true, subtree: true});
});

function markCrimes(){
    let form_action = doc.find(".content-wrapper form[name=crimes]").getAttribute("action");
    if(!isNaN(parseInt(form_action[form_action.length-1])) && parseInt(form_action[form_action.length-1]) != 3){
        console.log("marking");
        for(let crime of doc.findAll("form[name=crimes]>ul>li")){
            crime = crime.find(".item");

            crime.setAttribute("draggable", "true");
            crime.addEventListener("dragstart", onDragStart);
            crime.addEventListener("dragend", onDragEnd);
        }
    }
}

function crimesLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if([...doc.findAll("form[name=crimes]>ul>li")].length > 1){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}

function quickCrimesMain(quick){
    let quick_container = content.new_container("Quick crimes", {id: "ttQuick", dragzone: true, collapsed: false, next_element: doc.find(".tutorial-cont")}).find(".content"); /*doc.find("#module-desc") || doc.find(".title-black[role=heading]") || doc.find(".users-list-title")*/
    let inner_content = doc.new({type: "div", class: "inner-content"});
    quick_container.appendChild(inner_content);

    if(quick.items.length > 0){
        for(let crime of quick.crimes){
            let div = doc.new({type: "div", class: "item", attributes: {"nerve": crime.nerve, "name": crime.name, "action": crime.action}});
            let pic = doc.new({type: "div", class: "pic", attributes: {style: `background-image: url(${crime.icon})`}});
            let text = doc.new({type: "div", class: "text", text: crime.text});
            let close_icon = doc.new({type: "i", class: "fas fa-times tt-close-icon"});

            div.appendChild(pic);
            div.appendChild(text);
            div.appendChild(close_icon);
            inner_content.appendChild(div);

            close_icon.addEventListener("click", function(event){
                event.stopPropagation();
                div.remove();

                let crimes = [...doc.findAll("#ttQuick .item")].map(x => ({
                    "action": x.getAttribute("action"),
                    "nerve": x.getAttribute("nerve"), 
                    "name": x.getAttribute("name"), 
                    "icon": window.getComputedStyle(x.find(".pic"), false).backgroundImage.split('("')[1].split('")')[0], 
                    "text": x.find(".text").innerText
                }));
                local_storage.change({"quick": {"crimes": crimes}});
            });

            div.addEventListener("click", function(){
                let action = div.getAttribute("action");
                let nerve_take = div.getAttribute("nerve");
                let crime_name = div.getAttribute("name");

                console.log("action", action);
                console.log("nerve_take", nerve_take)
                console.log("crime_name", crime_name)

                let form = doc.find(".content-wrapper form[name=crimes]");
                if(!form){
                    form = doc.new({type: "form", attributes: {name: "crimes", method: "post"}});
                    let dummy_crime = doc.new({type: "input", value: crime_name, attributes: {name: "crime", type: "radio", checked: true}});
                    let submit_button = doc.new({type: "div", id: "do_crimes", class: "btn"});
                    let submit_button_inner = doc.new({type: "button", class: "torn-btn", text: "NEXT STEP"});
                    submit_button.appendChild(submit_button_inner);
                    form.appendChild(dummy_crime);
                    form.appendChild(submit_button);
                    doc.find(".content-wrapper").appendChild(form);
                } else {
                    form.find("input[type=radio]:checked").setAttribute("value", crime_name);
                }

                form.setAttribute("action", action);
                form.setAttribute("hijacked", true);
                if(form.find("input[name=nervetake]")){
                    form.find("input[name=nervetake]").setAttribute("value", nerve_take);
                } else {
                    let input = doc.new({type: "input", attributes: {name: "nervetake", type: "hidden", value: nerve_take}});
                    form.insertBefore(input, form.firstChild);
                }

                form.find("#do_crimes").click();
            });
        }
    }
}

// Dragging
function onDragStart(event) {
    console.log("drag start")
    setTimeout(function(){
        doc.find("#ttQuick .content").classList.add("drag-progress");
    
        if(doc.find("#ttQuick .temp.item")){
            return;
        }
    
        let action = doc.find("form[name=crimes]").getAttribute("action");
        action = action[0] == "/" ? action.substr(1) : action;
        if(action.indexOf("?") == -1){
            action+="?";
        }
    
        let crime_nerve = doc.find("input[name=nervetake]").value;
        let crime_name = event.target.find(".radio.right input").getAttribute("value");
        let crime_icon = event.target.find(".title.left img").getAttribute("src");
        let crime_text = event.target.find(".bonus.left").innerText.trim();
    
        let div = doc.new({type: "div", class: "temp item", attributes: {"nerve": crime_nerve, "name": crime_name, "action": action}});
        let pic = doc.new({type: "div", class: "pic", attributes: {style: `background-image: url(${crime_icon})`}});
        let text = doc.new({type: "div", class: "text", text: crime_text});
        let close_icon = doc.new({type: "i", class: "fas fa-times tt-close-icon"});
    
        div.appendChild(pic);
        div.appendChild(text);
        div.appendChild(close_icon);
        doc.find("#ttQuick .inner-content").appendChild(div);
    
        close_icon.addEventListener("click", function(event){
            event.stopPropagation();
            div.remove();
    
            let crimes = [...doc.findAll("#ttQuick .item")].map(x => ({
                "action": x.getAttribute("action"),
                "nerve": x.getAttribute("nerve"), 
                "name": x.getAttribute("name"), 
                "icon": window.getComputedStyle(x.find(".pic"), false).backgroundImage.split('("')[1].split('")')[0], 
                "text": x.find(".text").innerText
            }));
            local_storage.change({"quick": {"crimes": crimes}});
        });
    
        div.addEventListener("click", function(){
            let action = div.getAttribute("action");
            let nerve_take = div.getAttribute("nerve");
            let crime_name = div.getAttribute("name");
    
            let form = doc.find(".content-wrapper form[name=crimes]");
    
            console.log("action", action);
            console.log("nerve_take", nerve_take)
            console.log("crime_name", crime_name)
            form.setAttribute("action", action);
            form.setAttribute("hijacked", true);
            form.find(".radio.right input[type=radio]:checked").setAttribute("value", crime_name);
            if(form.find("input[name=nervetake]")){
                form.find("input[name=nervetake]").setAttribute("value", nerve_take);
            } else {
                let input = doc.new({type: "input", attributes: {name: "nervetake", type: "hidden", value: nerve_take}});
                form.insertBefore(input, form.firstChild);
            }
    
            doc.find("#do_crimes").click();
        });
    }, 10);
}

function onDragEnd(event){
    console.log("drag end")
    if(doc.find("#ttQuick .temp.item")){
        doc.find("#ttQuick .temp.item").remove();
    }
    
    doc.find("#ttQuick .content").classList.remove("drag-progress");

    let crimes = [...doc.findAll("#ttQuick .item")].map(x => ({
        "action": x.getAttribute("action"),
        "nerve": x.getAttribute("nerve"), 
        "name": x.getAttribute("name"), 
        "icon": window.getComputedStyle(x.find(".pic"), false).backgroundImage.split('("')[1].split('")')[0], 
        "text": x.find(".text").innerText
    }));
    local_storage.change({"quick": {"crimes": crimes}});
}