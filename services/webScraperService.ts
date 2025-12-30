
interface ScrapedResult {
    title: string;
    content: string;
    imageUrl?: string;
}

// Helper for fetch text with timeout (covers both connection and body download)
const fetchTextWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 5000): Promise<{ ok: boolean, status: number, text: string }> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        const text = await response.text();
        clearTimeout(id);
        return { ok: response.ok, status: response.status, text };
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

// Helper to clean LinkedIn specific Markdown noise
const cleanLinkedInMarkdown = (text: string): string => {
    let lines = text.split('\n');
    const cleanLines: string[] = [];

    // 1. Define End Markers (Truncate content after these)
    const endMarkers = [
        // The main reaction bar: [Like](url)[Comment](url)
        // Matches lines containing at least two social actions in markdown link format
        /\[(Like|Comment|Share|Reply)\]\(.*?\).*?\[(Like|Comment|Share|Reply)\]/i,
        /^\[?(Like|Comment|Share|Reply)\]?(\(.*\))?\s*\[?(Like|Comment|Share|Reply)\]?/i,

        /^To view or add a comment/i,
        /^Sign in to view more/i,
        /^See more comments/i,
        /^Explore content categories/i,
        /^Welcome back/i,
        /^New to LinkedIn/i,
        /\[\d+(,\d+)* Comments\]/i, // New marker for "22 Comments"
        /\d+ comments/i,

        // Comment Header: [Name](url) Timestamp
        // e.g. [Muntaha Aslam](...) 16h
        /^\[.*?\]\(.*?linkedin\.com\/in\/.*?\)\s*\d+[mhdwyo]s?$/i,
        // Match standard profile link lines that appear as headers (strict)
        /^\[.*?\]\(.*?linkedin\.com\/in\/.*?\)$/i,
    ];

    // 2. Define Noise Patterns (Skip these lines)
    const noisePatterns = [
        // Social Share Menu Items
        /^(\*|\-)\s*(Copy|LinkedIn|Facebook|X|Twitter|Email|Pinterest|Report this comment)$/i,

        // Navigation & UI Links (detected by [Text](url) pattern)
        /\[(Top Content|People|Learning|Jobs|Games|Report this post|Sign in|Join now|Skip to|Agree & Join|User Agreement|Privacy Policy|Cookie Policy|View [Pp]rofile|Follow|About|Accessibility|Brand Policy|Guest Controls|Community Guidelines|Language|Welcome back|Forgot password|New to LinkedIn|Create your free account|Show more|Show less|Explore content categories)\]/i,

        // Explicit Navigation Text (Standalone)
        /^Agree & Join LinkedIn/i,
        /^Skip to main content/i,
        /^LinkedIn$/i,
        /\[Skip to main content\]/i, // Added specific bracketed case
        /\[LinkedIn\]/i, // Added specific bracketed case
        /^.*?Post\s*$/i, // "Zaroon Sohail's Post" header

        // Video Player Noise
        /^(Play Video|Video Player is loading|Loaded:.*|Play Back to start|Stream Type|Current Time|Duration|Playback Rate|Show Captions|Unmute|Fullscreen|Captions|Audio Track|Quality|Auto)$/i,
        /^\d+:\d+(\s*\/\s*\d+:\d+)?$/, // Time durations like 0:00 or 0:00 / 1:30

        // Social Buttons
        /^\[?(Like|Comment|Share|Reply|Copy|Facebook|X)\]?$/i,

        // Separators
        /^[-=_*]{3,}$/,

        // Timestamps (e.g. 2w, 4d, 3h, 1mo, 10m) on their own line
        /^\d+[mhdwyo]s?$/,
        /^\d+mo$/,

        // Followers / Social counts
        /^\d+(,\d+)* (followers|connections|comments|reactions)/i,

        // Jina Headers & Title artifacts
        /^Markdown Content:/i,
        /^URL Source:/i,
        /^Title:/i,

        // Header line ending with | Author Name (common in Jina output)
        /\| [^|]+$/,

        // Login Form Noise
        /^\s*or\s*$/i,
        /^\s*Show\s*$/i,

        // Language Picker entries (English (English))
        /^[A-Za-z]+\s\([A-Za-z]+\)$/,

        // Trailing 'more' indicators
        /^(…|...)?\s*more$/i,
        /^See more$/i,

        // Comment Action Artifacts
        /\[Report this comment\]/i,
        /Report this comment/i,
    ];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (!line) continue;

        // Check End Markers (only after we have some content to avoid false positives at top)
        if (cleanLines.length > 2) {
            const isEndMarker = endMarkers.some(regex => regex.test(line));
            if (isEndMarker) break;
        }

        // Skip image markdown
        if (line.startsWith('![') || line.startsWith('[![')) continue;

        // Check Noise Patterns
        const isNoise = noisePatterns.some(regex => regex.test(line));
        if (isNoise) continue;

        // Clean Hashtag Links: [#SEO](...) -> #SEO
        line = line.replace(/\[(#\w+)\]\(.*?\)/g, '$1 '); // Added space after hashtag

        cleanLines.push(line);
    }

    return cleanLines.join('\n\n');
};

// Helper to clean general Markdown noise (e.g. from Jina) - More aggressive than LinkedIn cleaner
const cleanJinaMarkdown = (text: string): string => {
    let lines = text.split('\n');
    const cleanLines: string[] = [];

    // 1. End Markers - content after these is usually garbage (footer, related posts)
    const endMarkers = [
        /^#*\s*\[?Related Articles/i,
        /^#*\s*\[?You might also like/i,
        /^#*\s*\[?More from Author/i,
        /^#*\s*\[?Recent Posts/i,
        /^#*\s*\[?Follow us/i,
        /^#*\s*\[?Connect with us/i,
        /^#*\s*\[?Leave a Reply/i,
        /^#*\s*\[?Comments/i,
        /^#*\s*\[?Copyright \d{4}/i,
        /^#*\s*\[?© \d{4}/i,
        /^#*\s*\[?TAGS/i,
        /^#*\s*\[?Latest news/i,
        /^#*\s*\[?CISO Corner/i,
        /^#*\s*\[?Top 10/i,
        /^#*\s*\[?Cyber Security News/i,
        /^#*\s*\[?About Us/i,
        /^#*\s*\[?Contact Us/i
    ];

    // 2. Exact Line Noise - remove these lines entirely
    const exactNoise = new Set([
        "Search", "Menu", "Home", "Skip to content", "Skip to main content",
        "Cyber Security News", "Latest Cyber Security News", "Discover more",
        "Share this post", "Share on", "Read more", "Click to share",
        "Subscribe", "Log in", "Sign up", "Privacy Policy", "Terms of Service",
        "Cybersecurity News", "About Us", "Contact Us", "Latest news", "Top 10"
    ]);

    // 3. Regex Noise Patterns
    const noisePatterns = [
        // Image metdata/captions from markdown `[![Image...`
        /^\[?!\[(Image|Change Gmail Address|CSN|Security Awareness|Enterprise Remote|Parrot|Langchain|Google Now).*?\]/i,

        // Navigation links like [Home](...) or * [Home](...) or - [Home](...)
        // Uses [\s\u00A0]* to match normal AND non-breaking spaces
        /^(\*|\-)?[\s\u00A0]*\[(Home|Threats|Cyber Attacks|Vulnerabilities|Breaches|Top 10|Linkedin|Twitter|RSS|Facebook|Google News|Author|RELATED ARTICLES|MORE FROM AUTHOR|About Us|Contact Us|Privacy Policy)\]\(.*?\)/i,

        // Date lines or bylines that are just noise
        /^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}$/, // e.g., Friday, December 26, 2025

        // Social media clutter
        /^(\*|\-)?[\s\u00A0]*\[(Linkedin|Twitter|Facebook|RSS|Google News)\]\(.*?\)$/i,

        // Headers that are actually just navigation/footer noise: #### [RELATED ARTICLES]
        /^#{1,6}[\s\u00A0]*\[?(RELATED ARTICLES|MORE FROM AUTHOR|Follow us|Top 10|Latest news|CISO Corner)\]?/i,

        // Empty links or just an anchor
        /^\[\]\(.*?\)$/,

        // Just a pipe separator or simple separators
        /^={3,}$/,
        /^\-{3,}$/,
        /^\|.*\|$/ // Table rows that look like nav
    ];

    let shortLineStreak = 0; // Track consecutive short lines (tag clouds)

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Skip Image Markdown completely
        if (line.startsWith('![') || line.startsWith('[![')) continue;

        // Check End Markers
        // Only break if we have some content already (to avoid breaking on top nav bar noise)
        if (cleanLines.length > 5) {
            const isEndMarker = endMarkers.some(regex => regex.test(line));
            if (isEndMarker) break;
        }

        // Exact Match Noise
        if (exactNoise.has(line)) continue;

        // Regex Noise
        if (noisePatterns.some(regex => regex.test(line))) continue;

        // Heuristic: Link Density check for a single line
        // If the line has > 2 links, it's likely a nav bar
        const linkCount = (line.match(/\]\(/g) || []).length;
        if (linkCount > 2) continue;

        // Heuristic: Bullet points that are purely links * [Text](url)
        if (/^(\*|\-)\s*\[.*?\]\(.*?\)$/.test(line) && line.length < 100) {
            continue;
        }

        // Heuristic: Tag Cloud Detection
        // If we see > 3 consecutive lines that are short (< 4 words) and not sentences, skip them
        const wordCount = line.split(/\s+/).length;
        if (wordCount < 4 && !line.endsWith('.') && !line.endsWith(':')) {
            shortLineStreak++;
        } else {
            shortLineStreak = 0;
        }

        if (shortLineStreak > 3) {
            continue;
        }

        cleanLines.push(line);
    }

    return cleanLines.join('\n\n');
};

// Helper function to clean and extract meaningful content from HTML (Readability-style)
const extractContentFromHtml = (html: string): ScrapedResult => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // --- PHASE 0: METADATA EXTRACTION ---
    // Extract Title, Image, and Description before cleaning
    const pageTitle = doc.title ? doc.title.trim() : "Extracted Content";

    // Check for common bot protection titles
    if (pageTitle === "Just a moment..." ||
        pageTitle.includes("Robot Challenge") ||
        pageTitle.includes("Security Check") ||
        pageTitle.includes("Cloudflare")) {
        throw new Error("Blocked by Bot Protection (Title Check)");
    }

    let imageUrl = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
    if (!imageUrl) {
        imageUrl = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
    }

    // Capture description for fallback
    const description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="description"]')?.getAttribute('content');

    // --- PHASE 1: PRE-CLEANING ---
    // Remove obviously non-content tags
    const junkTags = ['script', 'style', 'noscript', 'iframe', 'svg', 'button', 'input', 'form', 'textarea', 'meta', 'link', 'aside', 'nav', 'footer', 'header'];
    junkTags.forEach(tag => {
        doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    // Remove elements by common noise classes/ids
    const noiseSelectors = [
        '.ad', '.ads', '.advertisement', '.social-share', '.share-buttons',
        '.related-articles', '.related-posts', '.sidebar', '.comments',
        '.newsletter-signup', '.popup', '.hidden', '[aria-hidden="true"]',
        '#sidebar', '#comments', '.outbrain', '.taboola',
        // LinkedIn specific noise
        '.job-details-jobs-unified-top-card__content--two-pane',
        '.contextual-sign-in-modal',
        '.global-nav', '.ad-banner-container'
    ];
    noiseSelectors.forEach(sel => {
        try { doc.querySelectorAll(sel).forEach(el => el.remove()); } catch (e) { }
    });

    // --- PHASE 2: SCORING ALGORITHM ---
    // We look for the element containing the most meaningful text (paragraphs)
    const candidates = new Map<Element, number>();

    // Include article and specific LinkedIn classes in search
    const paragraphs = doc.querySelectorAll('p, article, div.feed-shared-update-v2__description-wrapper, .update-components-text');
    paragraphs.forEach(p => {
        const text = p.textContent || "";
        if (text.length < 25) return; // Skip short/empty paragraphs

        // Score based on length and commas (sentence structure)
        let score = 1;
        score += text.split(',').length;
        score += Math.min(Math.floor(text.length / 100), 3);

        // Add score to parent and grandparent
        const parent = p.parentElement;
        if (parent) {
            candidates.set(parent, (candidates.get(parent) || 0) + score);
            const grandparent = parent.parentElement;
            if (grandparent) {
                candidates.set(grandparent, (candidates.get(grandparent) || 0) + (score / 2));
            }
        }
    });

    // Find the top candidate
    let topCandidate: Element | null = null;
    let maxScore = 0;

    candidates.forEach((score, element) => {
        if (score > maxScore) {
            maxScore = score;
            topCandidate = element;
        }
    });

    // Fallback to body if scoring failed
    let contentContainer = topCandidate || doc.body;

    // --- PHASE 3: POST-PROCESSING CANDIDATE ---
    // Helper: Calculate Link Density
    const getLinkDensity = (el: Element) => {
        const links = el.querySelectorAll('a');
        if (links.length === 0) return 0;
        let linkLength = 0;
        links.forEach(l => linkLength += (l.textContent?.length || 0));
        const textLength = el.textContent?.length || 1;
        return linkLength / textLength;
    };

    // Remove children with high link density
    const potentialNoise = contentContainer.querySelectorAll('div, ul, li, section');
    potentialNoise.forEach(el => {
        const density = getLinkDensity(el);
        if (density > 0.6 && (el.textContent?.length || 0) > 50) {
            el.remove();
        }

        const text = el.textContent?.toLowerCase() || "";
        if ((text.includes("related articles") || text.includes("read more") || text.includes("most watched")) && text.length < 100) {
            el.remove();
        }
    });

    // --- PHASE 4: EXTRACTION ---
    let innerHTML = contentContainer.innerHTML;
    innerHTML = innerHTML.replace(/<br\s*\/?>/gi, '\n');
    innerHTML = innerHTML.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n\n');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = innerHTML;

    const rawText = tempDiv.textContent || "";

    // Line Filtering
    const cleanLines = rawText.split('\n')
        .map(line => line.trim())
        .filter(line => {
            if (line.length === 0) return false;
            if (/^(share|comments|read more|related articles|previous|next|most watched|top stories|advertisement|sign in|join now)$/i.test(line)) return false;
            if (line.length < 40 && !/[.!?"]$/.test(line)) return false;
            return true;
        });

    let finalText = cleanLines.join('\n\n');

    // --- PHASE 5: INTELLIGENT FALLBACK ---
    // If the body content is weak (common for SPA/LinkedIn raw HTML), use the meta description.
    if (finalText.length < 150 && description && description.length > 50) {
        finalText = description;
    }

    return {
        title: pageTitle,
        content: `Title: ${pageTitle}\n\n${finalText}`,
        imageUrl: imageUrl || undefined
    };
};

const fetchAndScrape = async (url: string, isLinkedIn: boolean = false): Promise<ScrapedResult> => {
    const errors: string[] = [];

    // Strategy 1: Jina AI (Preferred)
    try {
        const { ok, status, text } = await fetchTextWithTimeout(`https://r.jina.ai/${url}`);
        if (ok) {
            if (text && text.length > 50 && !text.includes("451 Unavailable") && !text.includes("Access Denied")) {
                // Extract title from Jina output (usually first line)
                const titleMatch = text.match(/^Title: (.*)$/m);
                const title = titleMatch ? titleMatch[1].trim() : "Extracted Content";

                // Check for generic bot protection / CAPTCHA screens in the content or title
                if (text.includes("Robot Challenge") ||
                    text.includes("requiring CAPTCHA") ||
                    text.includes("Checking the site connection security") ||
                    title.includes("Robot Challenge") ||
                    title === "Just a moment...") {
                    throw new Error("Jina blocked by CAPTCHA/Bot Protection");
                }

                // Extract first image from Markdown ![]()
                const imgMatch = text.match(/!\[.*?\]\((.*?)\)/);
                const imageUrl = imgMatch ? imgMatch[1] : undefined;

                // SPECIAL HANDLING FOR LINKEDIN MARKDOWN
                let finalContent = text;
                if (isLinkedIn) {
                    finalContent = cleanLinkedInMarkdown(text);
                } else {
                    // GENERAL BLOG CLEANING
                    finalContent = cleanJinaMarkdown(text);
                }

                // Deduplication: Check if the title is already in the content to avoid repetition
                // Normalize both for loose comparison - strip all non-alphanumeric chars AND 'title' prefix
                const normContent = finalContent.toLowerCase().replace(/[^a-z0-9]/g, '');
                const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');

                // Remove "Title:" or "Title" from the start of content if potential match
                const potentialContentStart = normContent.replace(/^title/, '');

                // Only prepend title if it's NOT already the start of the content
                if (finalContent.length > 50 && !potentialContentStart.startsWith(normTitle)) {
                    finalContent = `Title: ${title}\n\n${finalContent}`;
                }

                return {
                    title,
                    content: finalContent,
                    imageUrl
                };
            }
            throw new Error("Jina returned invalid/blocked content");
        }
        throw new Error(`Jina Status: ${status}`);
    } catch (e: any) {
        console.warn("Jina strategy failed:", e.message);
        errors.push(`Jina: ${e.message}`);
    }

    // Strategy 2: AllOrigins (JSON Proxy) - Fallback for when Jina fails
    try {
        const { ok, status, text } = await fetchTextWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        if (ok) {
            const data = JSON.parse(text);
            if (data.contents) {
                const result = extractContentFromHtml(data.contents);
                // Lower threshold for content length to allow short LinkedIn posts (descriptions)
                if (result.content.length > 50) return result;
                throw new Error("Extracted content too short");
            }
        }
        throw new Error(`AllOrigins Status: ${status}`);
    } catch (e: any) {
        console.warn("AllOrigins strategy failed:", e.message);
        errors.push(`AllOrigins: ${e.message}`);
    }

    // Strategy 3: CorsProxy.io (Raw HTML Proxy) - Last resort
    try {
        const { ok, status, text } = await fetchTextWithTimeout(`https://corsproxy.io/?${encodeURIComponent(url)}`);
        if (ok) {
            const result = extractContentFromHtml(text);
            if (result.content.length > 50) return result;
            throw new Error("Extracted content too short");
        }
        throw new Error(`CorsProxy Status: ${status}`);
    } catch (e: any) {
        console.warn("CorsProxy strategy failed:", e.message);
        errors.push(`CorsProxy: ${e.message}`);
    }

    throw new Error(`Failed to fetch content. Attempts: ${errors.join(' | ')}`);
};

export const getBlogContent = async (url: string): Promise<ScrapedResult> => {
    if (!url.startsWith('http')) {
        throw new Error("Invalid URL. Please include http:// or https://");
    }
    return fetchAndScrape(url, false);
};

export const getLinkedInContent = async (url: string): Promise<ScrapedResult> => {
    // Support standard posts and short links (lnkd.in)
    if (!/linkedin\.com\/|lnkd\.in\//.test(url)) {
        throw new Error("Invalid URL. Please provide a valid LinkedIn URL (e.g. https://www.linkedin.com/posts/...).");
    }
    return fetchAndScrape(url, true);
};
