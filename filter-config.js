// filter-config.js

window.filterConfig = {
    criticalWords: new Set([
        'sex', 'porn', 'nude', 'naked', 'fuck', 'shit', 'ass', 'bitch',
        'cock', 'dick', 'pussy', 'vagina', 'boobs', 'tits', 'cum', 'orgasm',
        'masturbat', 'xxx', 'adult', '18+', 'nsfw', 'r18', 'hentai', 'milf',
        'onlyfans', 'hooker', 'escort', 'slut', 'whore', 'penis', 'anal',
        'oral', 'blow', 'handjob', 'fetish', 'kink', 'bondage', 'dildo',
        'vibrator', 'threesome', 'gangbang', 'creampie', 'gay',
        'lesbian', 'homo', 'butt', 'sxy',
    ]),

    fastPatterns: [
        /\b(sex|porn|nude|naked|fuck|shit|ass|bitch|cock|dick|pussy|vagina|boobs|tits|cum|orgasm|masturbat)\w*\b/i,
        /\b(xxx|adult|18\+|nsfw|r18|hentai|milf|onlyfans)\b/i,
        /(hot|sexy|nude|naked|porn|adult|yoga)\s*(jean|pant|girl|boy|woman|man|body|pic|photo|image|video|content)/i,
        /\b(breasts?|butt|ass|thighs?|boobs?|tits?)\b.*\b(pic|photo|image|video|show|exposed?)\b/i
    ],

    profanityApiUrls: {
        vulgarwords: 'https://raw.githubusercontent.com/Wandervogel-001/google-smart-filter/refs/heads/main/filtered_sensible.txt',
    }
};
