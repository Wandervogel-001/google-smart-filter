// ==UserScript==
// @name         Smart Google Filter
// @namespace    https://github.com/Wandervogel-001/google-smart-filter
// @version      1.0
// @description  Blocks distracting searches and images on Google
// @author       Ghost (https://github.com/Wandervogel-001)
// @match        *://*.google.com/search*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // --- SETTINGS ---
    const redFlags = [
        "lingerie", "bikini", "hot", "nsfw", "sexy", "provocative", "yoga",
        "tight", "legging", "nude", "gym", "body", "woman", "ass",
        "butt", "boobs", "erotic", "explicit", "fap", "porn", "cum"
    ];

    const redCombos = [
        ["jerk", "off"],
        ["E", "girl"],
        ["cam", "girl"],
        ["only", "fans"],
        ["feet", "pics"]
    ];

    const blockedSites = ["pinterest", "instagram", "reddit", "youtube", "tiktok"];
    const exceptionKeywords = ["men", "formal", "suit", "trouser", "jeans"];

    // --- HELPERS ---
    const stemWord = word => word.toLowerCase().replace(/(ing|ies|s|ed|ly|er|est|y)$/g, "");

    const getWords = text => text.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(Boolean);

    const hasRedFlag = text => {
        const words = getWords(text);
        return words.some(w => redFlags.some(flag => stemWord(w) === stemWord(flag)));
    };

    const hasRedCombo = text => {
        const words = getWords(text).map(stemWord);
        return redCombos.some(combo =>
                              combo.every(term => words.includes(stemWord(term)))
                             );
    };


    const hasException = text => {
        const words = getWords(text);
        return words.some(w => exceptionKeywords.some(ex => stemWord(w).includes(stemWord(ex))));
    };

    const shouldBlockQuery = () => {
        const query = new URLSearchParams(window.location.search).get("q")?.toLowerCase() || "";
        const flatQuery = query.replace(/[^a-zA-Z0-9]/g, "");
        const queryWords = query.split(/\s+/).map(stemWord);

        const containsRedFlag = redFlags.some(flag => flatQuery.includes(stemWord(flag)));
        const containsOnlyExceptions = queryWords.every(q =>
                                                        exceptionKeywords.some(ex => q.includes(stemWord(ex)))
                                                       );

        const containsCombo = hasRedCombo(query);
        return (containsRedFlag || containsCombo) && !containsOnlyExceptions;
    };

    const blockPage = () => {
        document.documentElement.innerHTML = "";
        document.title = "Blocked for Focus";

        const savedTheme = localStorage.getItem("theme") || "dark";
        const theme = savedTheme === "light" ? "light" : "dark";

        // Apply styles
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

        // Build page elements
        const title = document.createElement("h1");
        title.textContent = "⛔ Blocked";

        const msg = document.createElement("p");
        msg.textContent = "This search was blocked to help protect your focus and productivity.";

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "buttons";

        const backBtn = document.createElement("button");
        backBtn.textContent = "🔙 Back to Google";
        backBtn.onclick = () => window.location.href = "https://www.google.com";

        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = "🌓 Toggle Theme";
        toggleBtn.onclick = () => {
            const isDark = document.body.classList.contains("dark");
            const newTheme = isDark ? "light" : "dark";
            document.body.className = newTheme;
            localStorage.setItem("theme", newTheme);
        };

        // Append all elements
        buttonContainer.appendChild(backBtn);
        buttonContainer.appendChild(toggleBtn);
        document.body.appendChild(title);
        document.body.appendChild(msg);
        document.body.appendChild(buttonContainer);
    };



    // --- BLOCK QUERY ---
    if (shouldBlockQuery()) {
        blockPage();
        return;
    }

    // --- CONTENT FILTERING ---
    const isBlockedText = text => {
        const words = getWords(text);
        return words.some(w => redFlags.some(flag => stemWord(w) === stemWord(flag)));
    };

    const isBlockedSite = text => blockedSites.some(site => text.toLowerCase().includes(site));

    const filterImages = (root = document) => {
        const images = root.querySelectorAll('img');
        images.forEach(img => {
            const alt = img.alt?.toLowerCase() || '';
            const src = img.src?.toLowerCase() || '';
            const container = img.closest('a')?.parentElement?.innerText.toLowerCase() || '';

            if (isBlockedText(alt) || isBlockedText(src) || isBlockedText(container) || isBlockedSite(container)) {
                const box = img.closest('div');
                if (box) box.style.display = 'none';
            }
        });
    };

    const filterLinks = (root = document) => {
        const anchors = root.querySelectorAll('a');
        anchors.forEach(link => {
            const href = link.href?.toLowerCase() || '';
            const text = link.innerText?.toLowerCase() || '';

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
