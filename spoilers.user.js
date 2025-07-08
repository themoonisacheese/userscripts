// ==UserScript==
// @name         SE Chat spoilers
// @namespace    https://github.com/themoonisacheese
// @version      2025-07-08
// @description  Actually useful spoilers for stack exchange chat
// @author       Themoonisacheese
// @match       *://chat.stackexchange.com/rooms/*
// @match       *://chat.stackoverflow.com/rooms/*
// @match       *://chat.meta.stackexchange.com/rooms/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stackexchange.com
// @grant        none
// @updateURL   https://github.com/themoonisacheese/userscripts/raw/main/spoilers.user.js
// @downloadURL https://github.com/themoonisacheese/userscripts/raw/main/spoilers.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    // Add button to <td id="chat-buttons"> on load
    function init() {
        const td = document.getElementById('chat-buttons');
        if (td) {
            const btn = document.createElement('button');
            btn.className = 'button';
            btn.textContent = 'Send as spoiler';
            btn.addEventListener('click', function() {
                const input = document.getElementById('input');
                if (input) {
                    const original = input.value;
                    if (original == '') return; // Do nothing if input is empty
                    input.value = encode('!spoiler! [userscript](https://github.com/themoonisacheese/userscripts/raw/main/spoilers.user.js) ', original);
                    document.getElementById("sayit-button").click();
                }
            });
            td.appendChild(btn);
        }

        // Process all existing .messages .content elements
        document.querySelectorAll('.messages .content').forEach(processIncomingMessage);

        // Observe #chat for new .messages .content elements
        const chat = document.getElementById('chat');
        if (!chat) return;
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;
                    // The added node is always a .message that contains a .content
                    const content = node.querySelector('.content');
                    if (content) {
                        processIncomingMessage(content);
                    }
                }
            }
        });
        observer.observe(chat, { childList: true, subtree: true });
    }

    // Process an incoming message div for spoilers
    function processIncomingMessage(div) {
        var text = div.textContent || '';
        if (text.startsWith('!spoiler!')) {
            // Remove all links inside the message
            div.querySelectorAll('a').forEach(a => a.remove());
            text = div.textContent;
            const btn = document.createElement('button');
            btn.className = 'button';
            btn.textContent = 'Click to reveal';
            btn.addEventListener('click', function() {
                revealSpoiler(div, text);
            });
            div.appendChild(btn);
        }
    }
    
    // Callback for spoiler button click
    function revealSpoiler(div, encodedText) {        
        // Replace the div's text with the decoded result
        div.textContent = decode(encodedText);
    }
    
    // all following code is from emoji smuggler by Paul Butler. MIT license https://github.com/paulgb/emoji-encoder
    // Variation selectors block https://unicode.org/charts/nameslist/n_FE00.html
    // VS1..=VS16
    const VARIATION_SELECTOR_START = 0xfe00;
    const VARIATION_SELECTOR_END = 0xfe0f;

    // Variation selectors supplement https://unicode.org/charts/nameslist/n_E0100.html
    // VS17..=VS256
    const VARIATION_SELECTOR_SUPPLEMENT_START = 0xe0100;
    const VARIATION_SELECTOR_SUPPLEMENT_END = 0xe01ef;

    function toVariationSelector(byte){
        if (byte >= 0 && byte < 16) {
            return String.fromCodePoint(VARIATION_SELECTOR_START + byte)
        } else if (byte >= 16 && byte < 256) {
            return String.fromCodePoint(VARIATION_SELECTOR_SUPPLEMENT_START + byte - 16)
        } else {
            return null
        }
    }

    function fromVariationSelector(codePoint){
        if (codePoint >= VARIATION_SELECTOR_START && codePoint <= VARIATION_SELECTOR_END) {
            return codePoint - VARIATION_SELECTOR_START
        } else if (codePoint >= VARIATION_SELECTOR_SUPPLEMENT_START && codePoint <= VARIATION_SELECTOR_SUPPLEMENT_END) {
            return codePoint - VARIATION_SELECTOR_SUPPLEMENT_START + 16
        } else {
            return null
        }
    }

    function encode(emoji, text){
        // convert the string to utf-8 bytes
        const bytes = new TextEncoder().encode(text)
        let encoded = emoji

        for (const byte of bytes) {
            encoded += toVariationSelector(byte)
        }

        return encoded
    }

    function decode(text){
        let decoded = []
        const chars = Array.from(text)

        for (const char of chars) {
            const byte = fromVariationSelector(char.codePointAt(0))

                                               if (byte === null && decoded.length > 0) {
                break
            } else if (byte === null) {
                continue
            }

            decoded.push(byte)
        }

        let decodedArray = new Uint8Array(decoded)
        return new TextDecoder().decode(decodedArray)
    }


    document.addEventListener('readystatechange', function() {
        if (document.readyState === 'complete') {
            if (window.CHAT && CHAT.Hub && CHAT.Hub.roomReady && typeof CHAT.Hub.roomReady.add === 'function') {
                CHAT.Hub.roomReady.add(init);
            }
        }
    });
})();
