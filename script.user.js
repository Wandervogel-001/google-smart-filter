// ==UserScript==
// @name         Smart Google Filter
// @description  A Google Search Filter
// @author       Ghost (https://github.com/Wandervogel-001)
// @version      1.6
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
    // Heavily obfuscated filter configuration
    const _0x2a4b = ['cG9ybiw=', 'bnNmdyw=', 'Y3VtLA==', 's2V4eSw=', 'ZmFwLA==', 'bGluZ2VyaWU=', 'Ym', 'aWtpbmk=', 'Ym9vYnM=', 'YnV0dA==', 'YXNz', 'bGVnZ2luZw==', 'cGFudGllcw==', 'cGFudHk=', 'cHVzc3k=', 'Yml0Y2g='];
    const _0x3c5d = ['aG90', 'cGFudA==', 'cHJvdm9jYXRpdmU=', 'eW9nYQ==', 'dGlnaHQ=', 'ZXJvdGlj', 'ZXhwbGljaXQ=', 'd29tYW4=', 'Z3lt', 'Z2lybA==', 'Ym9keQ==', 'dGVhcw==', 'b25seQ==', 'ZmFucw==', 'ZmVldA==', 'cGljcw==', 'bGVn', 'amVyaw==', 'b2Zm', 'Y2Ft'];

    // ROT13-like obfuscation function
    const _decode = (arr) => {
        try {
            return arr.map(item => atob(item)).join(',').split(',').filter(Boolean);
        } catch {
            return [];
        }
    };

    // XOR-based simple encryption for additional layer
    const _xor = (str, key = 42) => {
        return str.split('').map(char =>
            String.fromCharCode(char.charCodeAt(0) ^ key)
        ).join('');
    };

    const singleRedFlags = _decode(_0x2a4b);
    const extraMultiFlags = _decode(_0x3c5d);
    const multiRedFlags = [...singleRedFlags, ...extraMultiFlags];

    // Obfuscated combinations
    const redCombos = [
        [String.fromCharCode(69), String.fromCharCode(103,105,114,108)],
    ];

    const blockedSites = ["pinterest", "instagram", "reddit", "youtube", "tiktok"];

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
        return singleRedFlags.some(flag => {
            const regex = new RegExp(`\\b${flag}\\b`, 'i');
            return regex.test(query);
        });
    };

    // Enhanced function to detect compound words and concatenated terms
    const containsCompoundRedFlags = text => {
        const query = text.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''); // Remove spaces and special chars

        // Check if query contains compound words with red flags
        const compoundPatterns = [];

        // Generate patterns for multiRedFlags combined together
        multiRedFlags.forEach(flag1 => {
            multiRedFlags.forEach(flag2 => {
                if (flag1 !== flag2) {
                    compoundPatterns.push(flag1 + flag2);
                    compoundPatterns.push(flag2 + flag1);
                }
            });
        });

        // Check if any compound pattern exists in the query
        return compoundPatterns.some(pattern => query.includes(pattern));
    };

    const countMultiRedFlags = text => {
        const query = text.toLowerCase();
        let count = 0;
        multiRedFlags.forEach(flag => {
            const regex = new RegExp(`\\b${flag}\\b`, 'i');
            if (regex.test(query)) count++;
        });
        return count;
    };

    const shouldBlockQuery = (query) => {
        const searchQuery = query?.toLowerCase() || "";

        // Debug logging (remove or disable in production)
        // console.log('Checking query:', searchQuery);

        // Check single word flags first (block immediately)
        if (containsSingleRedFlag(searchQuery)) {
            // console.log('Blocked by single red flag');
            return true;
        }

        // Check compound/concatenated red flags (like "hotgirl", "yogapants")
        if (containsCompoundRedFlags(searchQuery)) {
            // console.log('Blocked by compound red flags');
            return true;
        }

        // Check if 2 or more multi flags present
        const flagCount = countMultiRedFlags(searchQuery);
        // console.log('Multi-flag count:', flagCount);
        if (flagCount >= 2) {
            // console.log('Blocked by multiple flags');
            return true;
        }

        // Check combos
        if (hasRedCombo(searchQuery)) {
            // console.log('Blocked by red combo');
            return true;
        }

        return false;
    };

    // --- YOUTUBE SPECIFIC HANDLING ---
    const handleYouTube = () => {
        // Check if we're on YouTube
        if (!window.location.hostname.includes('youtube.com')) return;

        // console.log('YouTube handler activated');

        // Function to get YouTube search query
        const getYouTubeQuery = () => {
            // Check URL parameters for search query
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search_query') || urlParams.get('q');

            if (searchQuery) return decodeURIComponent(searchQuery);

            // Also check the search input field
            const searchInput = document.querySelector('input#search') ||
                  document.querySelector('input[name="search_query"]') ||
                  document.querySelector('#search-input input') ||
                  document.querySelector('ytd-searchbox input');

            return searchInput?.value || '';
        };

        // Function to redirect to YouTube home
        const redirectToYouTubeHome = () => {
            // console.log('Redirecting to YouTube home');
            window.location.href = 'https://www.youtube.com/';
        };

        // Check current search query in URL immediately
        const checkCurrentQuery = () => {
            const currentQuery = getYouTubeQuery();
            // console.log('Current YouTube query:', currentQuery);
            if (currentQuery && shouldBlockQuery(currentQuery)) {
                redirectToYouTubeHome();
                return true;
            }
            return false;
        };

        // Monitor search input for real-time checking
        const monitorSearchInput = () => {
            // Multiple selectors to catch different YouTube layouts
            const selectors = [
                'input#search',
                'input[name="search_query"]',
                '#search-input input',
                'ytd-searchbox input',
                '#searchbox input',
                '.ytd-searchbox input'
            ];

            let searchInput = null;
            for (const selector of selectors) {
                searchInput = document.querySelector(selector);
                if (searchInput) break;
            }

            if (searchInput && !searchInput.hasAttribute('data-filter-monitored')) {
                // console.log('Found search input, adding monitors');
                searchInput.setAttribute('data-filter-monitored', 'true');

                // Check on form submission
                const searchForm = searchInput.closest('form');
                if (searchForm) {
                    searchForm.addEventListener('submit', (e) => {
                        const query = searchInput.value;
                        // console.log('Form submit with query:', query);
                        if (shouldBlockQuery(query)) {
                            e.preventDefault();
                            e.stopPropagation();
                            redirectToYouTubeHome();
                        }
                    });
                }

                // Also check on Enter key press
                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const query = searchInput.value;
                        // console.log('Enter key with query:', query);
                        if (shouldBlockQuery(query)) {
                            e.preventDefault();
                            e.stopPropagation();
                            redirectToYouTubeHome();
                        }
                    }
                });

                // Check on input change (real-time)
                searchInput.addEventListener('input', (e) => {
                    const query = searchInput.value;
                    if (query.length > 3 && shouldBlockQuery(query)) {
                        // console.log('Input change blocked:', query);
                        redirectToYouTubeHome();
                    }
                });
            }
        };

        // Initial checks
        if (checkCurrentQuery()) return;

        // Wait for page to load and then monitor
        const waitForElements = () => {
            monitorSearchInput();

            // Continue checking for new elements
            setTimeout(waitForElements, 1000);
        };

        // Start monitoring after a brief delay
        setTimeout(waitForElements, 500);

        // Also monitor URL changes for YouTube's SPA navigation
        let lastUrl = window.location.href;
        const checkUrlChange = () => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                // console.log('URL changed:', lastUrl);
                setTimeout(() => {
                    if (checkCurrentQuery()) return;
                    monitorSearchInput();
                }, 100);
            }
        };

        setInterval(checkUrlChange, 500);

        // Re-check when YouTube's SPA navigation occurs
        const observer = new MutationObserver(() => {
            monitorSearchInput();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // --- REGULAR SEARCH ENGINE HANDLING ---
    const handleRegularSearchEngines = () => {
        const query = new URLSearchParams(window.location.search).get("q");

        if (shouldBlockQuery(query)) {
            blockPage();
            return;
        }

        // Content filtering for regular search engines
        const isBlockedText = text => {
            if (!text) return false;
            return countMultiRedFlags(text) >= 2 || hasRedCombo(text)
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
            .search-container {
                margin-top: 2rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                width: 100%;
                max-width: 500px;
            }
            .search-box {
                display: flex;
                gap: 0.5rem;
                width: 100%;
            }
            #customSearch {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #5865f2;
                border-radius: 6px;
                font-size: 1rem;
                outline: none;
                transition: border-color 0.2s;
            }
            body.dark #customSearch {
                background: #40444b;
                color: #f2f3f5;
                border-color: #5865f2;
            }
            body.light #customSearch {
                background: white;
                color: #1e1e1e;
                border-color: #1e1e1e;
            }
            #customSearch:focus {
                border-color: #4752c4;
            }
            body.light #customSearch:focus {
                border-color: #444;
            }
            #searchBtn {
                padding: 12px 20px;
                background: #5865f2;
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 1rem;
                transition: background 0.2s;
            }
            #searchBtn:hover {
                background: #4752c4;
            }
            body.light #searchBtn {
                background: #1e1e1e;
                color: #fff;
            }
            body.light #searchBtn:hover {
                background: #444;
            }
            .search-hint {
                font-size: 0.9rem;
                opacity: 0.6;
                margin-top: 0.5rem;
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
        backBtn.textContent = "🔙 Back to Search";
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

        // Create search container
        const searchContainer = document.createElement("div");
        searchContainer.className = "search-container";

        const searchBox = document.createElement("div");
        searchBox.className = "search-box";

        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.id = "customSearch";
        searchInput.placeholder = "Search for something productive...";

        const searchButton = document.createElement("button");
        searchButton.id = "searchBtn";
        searchButton.textContent = "🔍 Search";

        const searchHint = document.createElement("p");
        searchHint.className = "search-hint";
        searchHint.textContent = "Try searching for educational content, tutorials, or productive topics";

        // Search functionality
        const performSearch = () => {
            const query = searchInput.value.trim();
            if (query) {
                // Determine the current site and redirect accordingly
                const currentHost = window.location.hostname;
                if (currentHost.includes('youtube.com')) {
                    window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                } else if (currentHost.includes('google.com')) {
                    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                } else if (currentHost.includes('bing.com')) {
                    window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
                } else if (currentHost.includes('duckduckgo.com')) {
                    window.location.href = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
                } else {
                    // Default to Google
                    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                }
            }
        };

        searchButton.onclick = performSearch;
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        searchBox.appendChild(searchInput);
        searchBox.appendChild(searchButton);
        searchContainer.appendChild(searchBox);
        searchContainer.appendChild(searchHint);

        document.body.appendChild(title);
        document.body.appendChild(msg);
        document.body.appendChild(buttonContainer);
        document.body.appendChild(searchContainer);
    };

    // --- MAIN EXECUTION ---
    // console.log('Script starting on:', window.location.hostname);

    if (window.location.hostname.includes('youtube.com')) {
        // console.log('Initializing YouTube handler');
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', handleYouTube);
        } else {
            handleYouTube();
        }
    } else {
        handleRegularSearchEngines();
    }
})();