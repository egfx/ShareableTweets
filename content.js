if (window == top) {
  chrome.extension.onRequest.addListener(function(req, sender, sendResponse) {
        if (req.is_content_script && !document.querySelectorAll('.rbar').length){
            start_content_script();
            sendResponse({is_content_script: true});
        }
  });
};

let emotes = [
    {'type':'like', 'emoji':'👍'}, 
    {'type':'love', 'emoji':'💗'}, 
    {'type':'haha','emoji':'🤣'}, 
    {'type':'wow','emoji':'😮'}, 
    {'type':'sad','emoji':'😥'}, 
    {'type':'angry','emoji':'😠'}
];

let activeTweet;

let go = function(evt, callback) {
    var event = document.createEvent('Event');
    event.initEvent(evt);
    document.dispatchEvent(event);
    callback();
}

let idBucket = [];

function start_content_script(){

    function filteredNewNodeCallback(root, selector, callback) {
        var obs, i;

        if (!root || !selector || !callback) {
            return;
        }

        function filterAndCallback(node) {
            var matches = [], childMatches;
            if (node.matches(selector)){
                matches.push(node);
            }
            childMatches = node.querySelectorAll(selector);
            if (childMatches.length !== 0) {
                matches = matches.concat([].slice.call(childMatches))
            }
            matches.map(callback);
        }

        obs = new MutationObserver(function(mutations){
            mutations.forEach(function(mutation){
                for(i = 0; i < mutation.addedNodes.length; i++) {
                    if (mutation.addedNodes[i].nodeType === 1) {
                        filterAndCallback(mutation.addedNodes[i]);
                    }
                }
            })
        });
        obs.observe(root, {childList: true, subtree: true});
    }

    filteredNewNodeCallback(document.querySelector('#timeline'), '.js-stream-item', tweet => {
        genBarNodes(tweet)
    });

    function genBarNodes(node){
        try {
            let link = 'https://2FB.me/https://twitter.com'+node.querySelector('.tweet').getAttribute('data-permalink-path');
            let tmplStr = `<div class="rbar ProfileTweet-action ProfileTweet-action--reaction js-toggleState">
                <button class="rbutton" data-link="${link}">
                    <span>Like</span>
                    <div class="emoji-container">
                        <div class="emoji like">
                            <div class="icon" data-title="Like"></div>
                        </div>
                        <div class="emoji love">
                            <div class="icon" data-title="Love"></div>
                        </div>
                        <div class="emoji haha">
                            <div class="icon" data-title="Haha"></div>
                        </div>
                        <div class="emoji wow">
                            <div class="icon" data-title="Wow"></div>
                        </div>
                        <div class="emoji sad">
                            <div class="icon" data-title="Sad"></div>
                        </div>
                        <div class="emoji angry">
                            <div class="icon" data-title="Angry"></div>
                        </div>
                    </div>
                </button>
                <span class="ProfileTweet-actionCount" style="top:3.2px;">
                    <span class="ProfileTweet-actionCountForPresentation likebtn hideit">0</span>
                </span>
            </div>`;
            node.querySelector('div.ProfileTweet-action.ProfileTweet-action--favorite').after(document.createRange().createContextualFragment(tmplStr))
                let tweetId = node.getAttribute('data-item-id');
                activeTweet = node.querySelector('.tweet').dataset;
                emotes.forEach(o => {
                    let fblink = o.emoji+link;
                    node.querySelector('.emoji-container').closest('div:nth-child(2)').querySelector('.'+o.type).addEventListener("click", evt => {
                        tryBlocks(node, emotes, fblink, tweetId, o.type);
                    }, false);
                });
        } catch(e){
            console.log('... like buttons were not added to at least some tweets on this page.');
        }
    }

    streamChange();

    function streamChange(){
        document.querySelectorAll('.js-stream-item').forEach((tweet, idx, arr) => {
            genBarNodes(tweet)
        });
    }
}

function tryBlocks(...accessor){
    try {
        document.querySelector('#stream-item-tweet-'+accessor[3]+' > div > div.content > div.stream-item-footer > div.ProfileTweet-actionList.js-actions > div.ProfileTweet-action.ProfileTweet-action--reply > button').click();
        goAction(accessor[1], accessor[2], accessor[4]);
    } catch(e){
        try {
            document.querySelector('#stream-item-activity-'+accessor[3]+' > div > div.content > div.stream-item-footer > div.ProfileTweet-actionList.js-actions > div.ProfileTweet-action.ProfileTweet-action--reply > button').click();
            goAction(accessor[1], accessor[2], accessor[4]);
        } catch(e){
            console.log('no tweets found to add like buttons on');
        }
    }
}

function goAction(...modifier){
    document.querySelector('#global-tweet-dialog-header').innerText = 'React to '+document.querySelector('strong.fullname').innerText;
    document.querySelector('#global-tweet-dialog-dialog').querySelector('span.button-text.replying-text').innerText = 'React';
    document.querySelector('#tweet-box-global').appendChild(document.createRange().createContextualFragment(`${modifier[1]}`));
    go(modifier[2], function(){
        console.log('done emoting');
    });
}

window.onbeforeunload = function(){
    idBucket = [];
}
