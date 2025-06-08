// ==UserScript==
// @name         Google Filter
// @description  A Google Search Filter
// @author       Ghost (https://github.com/Wandervogel-001)
// @version      1.0
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

    // --- FAST CONFIGURATION ---
    let filterConfig = null;

    const loadFilterConfig = async () => {
        if (filterConfig) return filterConfig;
    
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://raw.githubusercontent.com/Wandervogel-001/google-smart-filter/refs/heads/main/filter-config.js'; // Replace with raw link
            script.onload = () => {
                filterConfig = window.filterConfig;
                resolve(filterConfig);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    (async () => {
        filterConfig = await loadFilterConfig();
    })();

    // --- OPTIMIZED CACHE ---
    class FastCache {
        constructor(ttl = filterConfig.cacheTTL, maxSize = filterConfig.maxCacheSize) {
            this.data = new Map();
            this.ttl = ttl;
            this.maxSize = maxSize;
        }

        get(key) {
            const entry = this.data.get(key);
            if (entry && (Date.now() - entry.timestamp < this.ttl)) {
                return entry.value;
            }
            this.data.delete(key);
            return null;
        }

        set(key, value) {
            if (this.data.size >= this.maxSize) {
                const firstKey = this.data.keys().next().value;
                this.data.delete(firstKey);
            }

            this.data.set(key, {
                value,
                timestamp: Date.now()
            });
        }

        clear() {
            this.data.clear();
        }
    }

    const cache = new FastCache();

    // --- ENHANCED PROFANITY DATABASE WITH PROGRESSIVE SEARCH ---
    class ProgressiveProfanityDatabase {
        constructor() {
            this.wordSets = new Map(); // Individual loaded sets
            this.loadedSources = new Set(); // Track which sources are loaded
            this.loadingPromises = new Map(); // Track ongoing loads
            this.criticalWords = new Set([...filterConfig.criticalWords]);

            console.log(`Initialized with ${this.criticalWords.size} critical words`);
        }

        // Check if word exists in critical words (instant)
        containsCritical(word) {
            return this.criticalWords.has(word.toLowerCase().trim());
        }

        // Check if word exists in already loaded sets
        containsInLoaded(word) {
            const normalized = word.toLowerCase().trim();
            for (const [sourceName, wordSet] of this.wordSets) {
                if (wordSet.has(normalized)) {
                    console.log(`Word "${word}" found in ${sourceName}`);
                    return true;
                }
            }
            return false;
        }

        // Progressive search through profanity lists
        async searchProgressively(word) {
            const normalized = word.toLowerCase().trim();

            // First check already loaded sets
            if (this.containsInLoaded(normalized)) {
                return true;
            }

            // Then search through unloaded sources one by one
            const unloadedSources = Object.entries(filterConfig.profanityApiUrls)
                .filter(([name]) => !this.loadedSources.has(name));

            console.log(`Starting progressive search for "${word}" through ${unloadedSources.length} sources`);

            for (const [sourceName, url] of unloadedSources) {
                try {
                    // Check if we're already loading this source
                    if (!this.loadingPromises.has(sourceName)) {
                        this.loadingPromises.set(sourceName, this.loadSingleSource(sourceName, url));
                    }

                    // Wait for this source to load
                    const wordSet = await this.loadingPromises.get(sourceName);

                    if (wordSet && wordSet.has(normalized)) {
                        console.log(`Word "${word}" found in ${sourceName} during progressive search`);
                        return true;
                    }

                } catch (error) {
                    console.warn(`Failed to load ${sourceName} during progressive search:`, error);
                    continue; // Continue to next source
                }
            }

            console.log(`Word "${word}" not found in any profanity lists`);
            return false;
        }

        // 1. Add GitHub API methods to the ProgressiveProfanityDatabase class
        // Insert these methods inside the ProgressiveProfanityDatabase class:

        // GitHub API method to fetch file content
        async fetchGitHubFile(owner, repo, filePath, branch = 'main') {
            const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

            try {
                console.log(`[DEBUG] Fetching from GitHub API: ${apiUrl}`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), filterConfig.searchTimeout);

                const response = await fetch(apiUrl, {
                    signal: controller.signal,
                    cache: 'force-cache'
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                // GitHub API returns content as base64 encoded
                const content = atob(data.content.replace(/\s/g, '')); // Remove whitespace before decoding

                console.log(`[DEBUG] Successfully fetched ${content.length} characters from ${filePath}`);

                return content;

            } catch (error) {
                console.error(`[ERROR] Failed to fetch ${filePath}:`, error);
                throw error;
            }
        }

        // Load word list from GitHub
        async loadWordListFromGitHub() {
            const owner = 'Wandervogel-001';
            const repo = 'google-smart-filter';
            const filePath = 'filtered_sensible.txt';
            const branch = 'main';

            try {
                const content = await this.fetchGitHubFile(owner, repo, filePath, branch);

                // Split by lines and preserve complete phrases
                const lines = content
                    .split('\n')
                    .map(line => line.trim().toLowerCase()) // Normalize but keep complete phrases
                    .filter(line => line.length > 0);

                console.log(`[DEBUG] Loaded ${lines.length} phrases/words from GitHub word list`);

                return new Set(lines);

            } catch (error) {
                console.error('[ERROR] Failed to load word list from GitHub:', error);
                return new Set(); // Return empty set on failure
            }
        }


        // 2. Modify the loadSingleSource method to handle GitHub sources
        // Replace the existing loadSingleSource method with this updated version:

        async loadSingleSource(sourceName, url) {
            try {
                console.log(`Loading profanity list: ${sourceName}`);

                let wordSet;

                // Check if this is a GitHub source that should use API
                if (url.includes('github.com') && url.includes('Wandervogel-001/google-smart-filter')) {
                    // Use GitHub API for our specific repository
                    wordSet = await this.loadWordListFromGitHub();
                } else {
                    // Use regular fetch for other sources
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), filterConfig.searchTimeout);

                    const response = await fetch(url, {
                        signal: controller.signal,
                        cache: 'force-cache'
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const data = await response.text();
                    let words = [];

                    // Handle different formats
                    try {
                        const json = JSON.parse(data);
                        words = Array.isArray(json) ? json : Object.keys(json);
                    } catch {
                        // It's a text file, split by lines
                        words = data.split('\n')
                            .map(line => line.trim().toLowerCase())
                            .filter(line => line.length > 0);
                    }

                    // Create wordSet from the processed words (no double processing)
                    wordSet = new Set(words);
                }

                // Store the loaded set
                this.wordSets.set(sourceName, wordSet);
                this.loadedSources.add(sourceName);

                console.log(`Loaded ${wordSet.size} words from ${sourceName}`);

                return wordSet;

            } catch (error) {
                console.warn(`Failed to load ${sourceName}:`, error);
                this.loadedSources.add(sourceName); // Mark as attempted
                return new Set(); // Return empty set to continue
            }
        }

        // Get statistics
        getStats() {
            const totalLoaded = Array.from(this.wordSets.values())
                .reduce((total, set) => total + set.size, 0);

            return {
                criticalWords: this.criticalWords.size,
                loadedSources: this.loadedSources.size,
                totalSources: Object.keys(filterConfig.profanityApiUrls).length,
                totalLoadedWords: totalLoaded
            };
        }
    }

    const profanityDB = new ProgressiveProfanityDatabase();

    // --- TEXT NORMALIZATION ---
    const fastNormalize = (text) => {
        if (!text) return '';

        const cacheKey = 'norm_' + text.substring(0, 50);
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        let normalized = text.toLowerCase()
            .replace(/[0@]/g, 'o')
            .replace(/[1!]/g, 'i')
            .replace(/[3]/g, 'e')
            .replace(/[4]/g, 'a')
            .replace(/[5$]/g, 's')
            // Modified: preserve + symbol and other important characters
            .replace(/[^\w\s+]/g, ' ')  // Keep + symbol
            .replace(/\s+/g, ' ')
            .trim();

        cache.set(cacheKey, normalized);
        return normalized;
    };

    // --- PROGRESSIVE PROFANITY DETECTION ---
    const containsProfanity = async (text) => {
        if (!text) return false;

        const normalized = fastNormalize(text);
        const cacheKey = 'prof_' + normalized.substring(0, 30);
        const cached = cache.get(cacheKey);
        if (cached !== null) {
            console.log(`Cache hit for "${text}": ${cached}`);
            return cached;
        }

        console.log(`Checking profanity for: "${text}"`);

        // PHASE 1: INSTANT checks (critical words and patterns)
        console.log('Phase 1: Checking critical words and patterns...');

        // Check original text first (before normalization) - CRITICAL FIX
        const originalLower = text.toLowerCase().trim();
        console.log(`Checking original text: "${originalLower}"`);

        if (filterConfig.criticalWords.has(originalLower)) {
            console.log(`✅ BLOCKED by critical word (original): ${originalLower}`);
            cache.set(cacheKey, true);
            console.log(`✅ RETURNING TRUE for: ${text}`);
            return true;
        }

        // Fast regex patterns
        for (const pattern of filterConfig.fastPatterns) {
            if (pattern.test(text) || pattern.test(normalized)) {
                console.log('✅ BLOCKED by fast regex pattern');
                cache.set(cacheKey, true);
                console.log(`✅ RETURNING TRUE for: ${text}`);
                return true;
            }
        }

        // Critical word check (individual words from normalized text)
        const words = normalized.split(/\s+/);
        console.log(`Checking normalized words: [${words.join(', ')}]`);

        for (const word of words) {
            if (word.length >= 3 && profanityDB.containsCritical(word)) {
                console.log(`✅ BLOCKED by critical word (normalized): ${word}`);
                cache.set(cacheKey, true);
                console.log(`✅ RETURNING TRUE for: ${text}`);
                return true;
            }
        }

        console.log('Phase 1 passed - no critical words or patterns found');

        // PHASE 2: PROGRESSIVE SEARCH through profanity lists
        console.log('Phase 2: Starting progressive search...');

        // First check the complete normalized text as a phrase
        try {
            const foundAsPhrase = await profanityDB.searchProgressively(normalized);
            if (foundAsPhrase) {
                console.log(`✅ BLOCKED by progressive search (complete phrase): ${normalized}`);
                cache.set(cacheKey, true);
                console.log(`✅ RETURNING TRUE for: ${text}`);
                return true;
            }
        } catch (error) {
            console.warn(`Progressive search failed for complete phrase "${normalized}":`, error);
        }

        // Then check individual words
        for (const word of words) {
            if (word.length >= 3) { // Only check meaningful words
                try {
                    const found = await profanityDB.searchProgressively(word);
                    if (found) {
                        console.log(`✅ BLOCKED by progressive search (individual word): ${word}`);
                        cache.set(cacheKey, true);
                        console.log(`✅ RETURNING TRUE for: ${text}`);
                        return true;
                    }
                } catch (error) {
                    console.warn(`Progressive search failed for "${word}":`, error);
                    // Continue checking other words
                }
            }
        }

        console.log('Phase 2 completed - phrase and words not found in any profanity lists');
        console.log(`❌ RETURNING FALSE for: ${text}`);
        cache.set(cacheKey, false);
        return false;
    };

    // Enhanced shouldBlockQuery with better debugging
    const shouldBlockQuery = async (query) => {
        if (!query) return false;

        const trimmed = query.trim();
        if (trimmed.length === 0) return false;

        console.log(`\n=== ANALYZING QUERY: "${trimmed}" ===`);

        const cacheKey = 'query_' + trimmed.substring(0, 30);
        const cached = cache.get(cacheKey);
        if (cached !== null) {
            console.log(`Query cache result: ${cached ? 'BLOCKED' : 'ALLOWED'}`);
            console.log(`Final result: ${cached ? 'BLOCKED' : 'ALLOWED'}`);
            console.log('=== ANALYSIS COMPLETE ===\n');
            return cached;
        }

        console.log('No cache found, checking profanity...');
        const blocked = await containsProfanity(trimmed);
        console.log(`containsProfanity returned: ${blocked}`);

        cache.set(cacheKey, blocked);

        console.log(`Final result: ${blocked ? 'BLOCKED' : 'ALLOWED'}`);
        console.log('=== ANALYSIS COMPLETE ===\n');

        return blocked;
    };

    // --- BLOCK PAGE WITH ENHANCED STATS ---
    const blockPage = () => {
        document.documentElement.innerHTML = "";
        document.title = "Content Blocked - Progressive Filter";

        const savedTheme = localStorage.getItem("theme") || "dark";
        const theme = savedTheme === "light" ? "light" : "dark";

        const style = document.createElement("style");
        style.textContent = `
            body {
                margin: 0;
                padding: 0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                text-align: center;
                transition: all 0.3s ease;
                position: relative;
                overflow-x: hidden;
            }
            body.dark {
                background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
                color: #f2f3f5;
            }
            body.light {
                background: linear-gradient(135deg, #f5f7fa, #c3cfe2, #e0eafc);
                color: #2c3e50;
            }
            .container {
                max-width: 700px;
                padding: 2rem;
                backdrop-filter: blur(10px);
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }
            body.light .container {
                background: rgba(255, 255, 255, 0.8);
                border: 1px solid rgba(0, 0, 0, 0.1);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            }
            h1 {
                font-size: 3rem;
                margin-bottom: 1rem;
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .subtitle {
                font-size: 1.1rem;
                opacity: 0.8;
                margin-bottom: 2rem;
                line-height: 1.6;
            }
            .stats {
                background: rgba(255, 255, 255, 0.1);
                padding: 1.5rem;
                border-radius: 10px;
                margin: 1rem 0;
                font-size: 0.9rem;
                text-align: left;
            }
            body.light .stats {
                background: rgba(0, 0, 0, 0.05);
            }
            .buttons {
                margin-top: 2rem;
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                justify-content: center;
            }
            button {
                padding: 12px 24px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                border: none;
                border-radius: 50px;
                color: white;
                cursor: pointer;
                font-size: 1rem;
                font-weight: 600;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }
            button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
            }
        `;
        document.head.appendChild(style);
        document.body.className = theme;

        const container = document.createElement("div");
        container.className = "container";

        const title = document.createElement("h1");
        title.textContent = "🛡️ Content Blocked";

        const subtitle = document.createElement("p");
        subtitle.className = "subtitle";
        subtitle.textContent = "Progressive content filtering detected inappropriate search content. The system checked critical words first, then searched through profanity databases progressively.";

        // Enhanced filter statistics
        const stats = profanityDB.getStats();
        const statsDiv = document.createElement("div");
        statsDiv.className = "stats";
        statsDiv.innerHTML = `
            <strong>🔍 Progressive Filter Statistics:</strong><br><br>
            <strong>Phase 1 (Instant):</strong><br>
            • Critical words: ${stats.criticalWords} patterns<br>
            • Fast regex patterns: ${filterConfig.fastPatterns.length} rules<br><br>
            <strong>Phase 2 (Progressive):</strong><br>
            • Sources loaded: ${stats.loadedSources}/${stats.totalSources}<br>
            • Total words in database: ${stats.totalLoadedWords.toLocaleString()}<br>
            • Cache entries: ${cache.data.size}<br><br>
            <strong>Status:</strong> Query blocked during progressive search
        `;

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "buttons";

        const backBtn = document.createElement("button");
        backBtn.textContent = "🔙 Return to Search";
        backBtn.onclick = () => window.location.href = window.location.origin;

        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = "🌓 Toggle Theme";
        toggleBtn.onclick = () => {
            const newTheme = document.body.classList.contains("dark") ? "light" : "dark";
            document.body.className = newTheme;
            localStorage.setItem("theme", newTheme);
        };

        buttonContainer.appendChild(backBtn);
        buttonContainer.appendChild(toggleBtn);

        container.appendChild(title);
        container.appendChild(subtitle);
        container.appendChild(statsDiv);
        container.appendChild(buttonContainer);
        document.body.appendChild(container);
    };

    // --- SEARCH ENGINE HANDLERS ---
    const handleSearchEngine = () => {
        // Check URL immediately
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q') || params.get('query') || params.get('search_query') || '';

        if (query) {
            shouldBlockQuery(query).then(shouldBlock => {
                if (shouldBlock) {
                    blockPage();
                }
            });
        }

        // Monitor input with progressive blocking
        const monitorInput = (input) => {
            if (input.hasAttribute('data-monitored')) return;
            input.setAttribute('data-monitored', 'true');

            let lastValue = '';
            let currentCheck = null;

            const checkInput = async () => {
                const currentValue = input.value;
                if (currentValue !== lastValue && currentValue.length > 2) {
                    lastValue = currentValue;

                    // Cancel any ongoing check
                    if (currentCheck) {
                        currentCheck.cancelled = true;
                    }

                    // Start new check
                    currentCheck = { cancelled: false };
                    const thisCheck = currentCheck;

                    try {
                        const shouldBlock = await shouldBlockQuery(currentValue);

                        // Only act if this check wasn't cancelled
                        if (!thisCheck.cancelled && shouldBlock) {
                            blockPage();
                        }
                    } catch (error) {
                        console.error('Error checking input:', error);
                    }
                }
            };

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    setTimeout(() => checkInput(), 0);
                }
            });

            // Reduced throttle for more responsive progressive blocking
            let throttleTimer = null;
            input.addEventListener('input', () => {
                if (throttleTimer) return;
                throttleTimer = setTimeout(() => {
                    checkInput();
                    throttleTimer = null;
                }, 200); // More responsive
            });
        };

        // Monitor existing inputs
        const searchInputs = document.querySelectorAll('input[type="search"], input[name="q"], input[name="query"]');
        searchInputs.forEach(monitorInput);

        // Monitor form submissions
        document.addEventListener('submit', async (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                const formData = new FormData(form);
                const query = formData.get('q') || formData.get('query') || formData.get('search_query') || '';
                if (query && await shouldBlockQuery(query)) {
                    e.preventDefault();
                    e.stopPropagation();
                    blockPage();
                }
            }
        }, true);

        // Monitor new inputs
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const addedNodes = Array.from(mutation.addedNodes);
                    for (const node of addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const inputs = node.querySelectorAll ?
                                node.querySelectorAll('input[type="search"], input[name="q"], input[name="query"]') : [];
                            inputs.forEach(monitorInput);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // --- INITIALIZATION ---
    const initializeFilter = () => {
        console.log('Progressive Content Filter starting...');

        // Handle search engines
        const hostname = window.location.hostname;
        if (hostname.includes('google.com') || hostname.includes('bing.com') ||
            hostname.includes('duckduckgo.com') || hostname.includes('search.yahoo.com')) {
            handleSearchEngine();
        }

        console.log('Progressive Content Filter ready');
    };

    // Start immediately
    initializeFilter();

    // Handle DOM loading
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const hostname = window.location.hostname;
            if (hostname.includes('google.com') || hostname.includes('bing.com') ||
                hostname.includes('duckduckgo.com') || hostname.includes('search.yahoo.com')) {
                handleSearchEngine();
            }
        });
    }

    // Export for debugging
    window.ContentFilter = {
        shouldBlockQuery,
        containsProfanity,
        blockPage,
        profanityDB,
        cache,
        fastNormalize,
        // Debug functions
        testProgressive: async (word) => {
            console.log(`Testing progressive search for: ${word}`);
            return await profanityDB.searchProgressively(word);
        }
    };

})();
