// ==UserScript==
// @name         Smart Google Filter
// @description  A Google Search Filter
// @author       Ghost (https://github.com/Wandervogel-001)
// @version      1.2
// @match        *://*.google.com/search*
// @match        *://*.bing.com/search*
// @match        *://*.duckduckgo.com/*
// @match        *://*.yahoo.com/search*
// @match        *://*.brave.com/search*
// @match        *://*.startpage.com/*
// @match        *://*.qwant.com/*
// @match        *://*.youtube.com/*

// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- SETTINGS ---
    const singleRedFlags = ["porn","nsfw", "cum","sexy", "fap", "lingerie", "bikini", "boobs", "butt", "ass", "legging", "panties", "panty", "pussy"];

    const extraMultiFlags = ["hot", "pant", "provocative", "yoga", "tight", "erotic", "explicit", "woman", "gym", "girl", "body", "teas", "only", "fans", "feet", "pics", "leg", "jerk", "off", "cam",];

    const multiRedFlags = [...singleRedFlags, ...extraMultiFlags];


    const redCombos = [
        ["E", "girl"],
    ];

    const blockedSites = ["pinterest", "instagram", "reddit", "tiktok"];

    // --- HELPERS ---
    const stemWord = word => word.toLowerCase().replace(/(ing|ies|s|ed|ly|er|est|y)$/g, "");

    const getWords = text => text.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(Boolean);

    const hasRedCombo = text => {
        const lowerText = text.toLowerCase();
        return redCombos.some(combo =>
                              combo.every(term => lowerText.includes(term.toLowerCase()))
                             );
    };


    const containsSingleRedFlag = text => {
        const query = text.toLowerCase();

        // block if any flag is substring of query
        return singleRedFlags.some(flag => query.includes(flag.toLowerCase()));
    };

    // Count how many multiRedFlags are present in text
    const countMultiRedFlags = text => {
        const words = getWords(text).map(stemWord);
        const matchedFlags = new Set();

        words.forEach(w => {
            multiRedFlags.forEach(flag => {
                if (stemWord(flag) === w) matchedFlags.add(w);
            });
        });

        return matchedFlags.size;
    };
    console.log(countMultiRedFlags("cat"))

    const shouldBlockQuery = () => {
        const query = new URLSearchParams(window.location.search).get("q")?.toLowerCase() || "";

        // Check single word flags first (block immediately)
        if (containsSingleRedFlag(query)) return true;

        // Check if 2 or more multi flags present
        if (countMultiRedFlags(query) >= 2) return true;

        // Check combos
        if (hasRedCombo(query)) return true;

        return false;
    };

    const blockPage = () => {
        document.documentElement.innerHTML = "";
        document.title = "Blocked for Focus";

        const savedTheme = localStorage.getItem("theme") || "dark";
        const theme = savedTheme === "light" ? "light" : "dark";

        const style = document.createElement("style");
        style.textContent = `
            body {
                margin: 0;
                padding: 0;
                font-family: 'Segoe UI', sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                text-align: center;
                transition: background 0.3s, color 0.3s;
            }
            body.dark {
                background: #2b2d31;
                color: #f2f3f5;
            }
            body.light {
                background: #f4f4f4;
                color: #1e1e1e;
            }
            h1 {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            p {
                font-size: 1.2rem;
                opacity: 0.8;
            }
            .buttons {
                margin-top: 2rem;
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            button {
                padding: 10px 20px;
                background: #5865f2;
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 1rem;
                transition: background 0.2s;
            }
            button:hover {
                background: #4752c4;
            }
            body.light button {
                background: #1e1e1e;
                color: #fff;
            }
            body.light button:hover {
                background: #444;
            }
        `;
        document.head.appendChild(style);
        document.body.className = theme;

        const title = document.createElement("h1");
        title.textContent = "⛔ Blocked";

        const msg = document.createElement("p");
        msg.textContent = "This search was blocked to help protect your focus and productivity.";

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "buttons";

        const backBtn = document.createElement("button");
        backBtn.textContent = "🔙 Back to Google";
        backBtn.onclick = () => {
            window.location.href = window.location.origin;
        };


        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = "🌓 Toggle Theme";
        toggleBtn.onclick = () => {
            const isDark = document.body.classList.contains("dark");
            const newTheme = isDark ? "light" : "dark";
            document.body.className = newTheme;
            localStorage.setItem("theme", newTheme);
        };

        buttonContainer.appendChild(backBtn);
        buttonContainer.appendChild(toggleBtn);
        document.body.appendChild(title);
        document.body.appendChild(msg);
        document.body.appendChild(buttonContainer);
        (function() {
            const removeDuckDuckGoExtras = () => {
                const keywords = ["feedback", "share feedback", "tell us", "report"]; // Add more if needed

                document.querySelectorAll('div, section, aside, footer').forEach(el => {
                    const text = el.textContent?.toLowerCase() || "";
                    if (keywords.some(k => text.includes(k))) {
                        el.remove();
                    }
                });
            };

            const observer = new MutationObserver(() => {
                removeDuckDuckGoExtras();
            });

            observer.observe(document.body, { childList: true, subtree: true });

            // Initial call
            removeDuckDuckGoExtras();
        })();
    };

    // --- BLOCK QUERY ---
    if (shouldBlockQuery()) {
        blockPage();
        return;
    }

    // --- CONTENT FILTERING ---
    const isBlockedText = text => {
        if (!text) return false;
        return countMultiRedFlags(text) >= 2 || hasRedCombo(text);
    };

    const isBlockedSite = text => blockedSites.some(site => text.toLowerCase().includes(site));

    const filterImages = (root = document) => {
        const images = root.querySelectorAll('img');
        images.forEach(img => {
            const alt = img.alt || '';
            const src = img.src || '';
            const container = img.closest('a')?.parentElement?.innerText || '';

            if (isBlockedText(alt) || isBlockedText(src) || isBlockedText(container) || isBlockedSite(container)) {
                const box = img.closest('div');
                if (box) box.style.display = 'none';
            }
        });
    };

    const filterLinks = (root = document) => {
        const anchors = root.querySelectorAll('a');
        anchors.forEach(link => {
            const href = link.href || '';
            const text = link.innerText || '';

            if (isBlockedSite(href) || isBlockedSite(text) || isBlockedText(text)) {
                const parent = link.closest('div');
                if (parent) parent.style.display = 'none';
            }
        });
    };

    const filterAll = (root = document) => {
        filterImages(root);
        filterLinks(root);
    };

    // Initial run
    filterAll();

    // Observe dynamic content
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) filterAll(node);
            });
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();