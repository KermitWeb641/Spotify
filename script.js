document.addEventListener('DOMContentLoaded', () => {
    // Add null checks and error logging
    const urlInput = document.getElementById('spotifyUrlInput');
    const playButton = document.getElementById('playButton');
    const spotifyPlayer = document.getElementById('spotifyPlayer');
    const errorMessage = document.getElementById('errorMessage');
    const playerContainer = document.getElementById('playerContainer');
    const playerPlaceholder = document.getElementById('playerPlaceholder');
    const recentLinksList = document.getElementById('recentLinksList');
    const mediaTitle = document.getElementById('mediaTitle');
    const mediaSubtitle = document.getElementById('mediaSubtitle');
    const copyUrlButton = document.getElementById('copyUrlButton');

    // Debug logging to find null elements
    const elementsToCheck = [
        { name: 'urlInput', element: urlInput },
        { name: 'playButton', element: playButton },
        { name: 'spotifyPlayer', element: spotifyPlayer },
        { name: 'errorMessage', element: errorMessage },
        { name: 'playerContainer', element: playerContainer },
        { name: 'playerPlaceholder', element: playerPlaceholder },
        { name: 'recentLinksList', element: recentLinksList },
        { name: 'mediaTitle', element: mediaTitle },
        { name: 'mediaSubtitle', element: mediaSubtitle },
        { name: 'copyUrlButton', element: copyUrlButton }
    ];

    // Log any null elements
    elementsToCheck.forEach(item => {
        if (!item.element) {
            console.error(`Element not found: ${item.name}`);
        }
    });

    // Ensure all critical elements exist before proceeding
    if (!urlInput || !playButton || !spotifyPlayer || !errorMessage) {
        console.error('Critical elements are missing. Script cannot proceed.');
        return;
    }

    // Remove any previous theme toggle logic
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.remove();
    }

    // Recent links management
    let recentLinks = JSON.parse(localStorage.getItem('recentSpotifyLinks')) || [];

    function updateRecentLinks(url) {
        // Remove duplicates and limit to 5 recent links
        recentLinks = recentLinks.filter(link => link !== url);
        recentLinks.unshift(url);
        recentLinks = recentLinks.slice(0, 5);
        
        localStorage.setItem('recentSpotifyLinks', JSON.stringify(recentLinks));
        renderRecentLinks();
    }

    function renderRecentLinks() {
        recentLinksList.innerHTML = recentLinks.map(link => 
            `<div class="recent-link" data-url="${link}">
                <i class="fab fa-spotify"></i>
                <span>${extractTrackInfo(link)}</span>
                <button class="delete-recent-link" data-url="${link}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>`
        ).join('');

        // Add click event to recent links
        document.querySelectorAll('.recent-link').forEach(link => {
            link.addEventListener('click', (e) => {
                // Prevent click if delete button is clicked
                if (e.target.closest('.delete-recent-link')) return;
                
                const url = e.currentTarget.dataset.url;
                urlInput.value = url;
                loadSpotifyTrack(url);
            });
        });

        // Add delete functionality
        document.querySelectorAll('.delete-recent-link').forEach(deleteBtn => {
            deleteBtn.addEventListener('click', (e) => {
                const urlToDelete = e.currentTarget.dataset.url;
                
                // Remove the specific URL from recent links
                recentLinks = recentLinks.filter(link => link !== urlToDelete);
                
                // Update local storage
                localStorage.setItem('recentSpotifyLinks', JSON.stringify(recentLinks));
                
                // Re-render the list
                renderRecentLinks();
            });
        });
    }

    function extractTrackInfo(url) {
        const parts = url.split('/');
        return parts[parts.length - 1].split('?')[0];
    }

    function loadSpotifyTrack(spotifyUrl) {
        if (!isValidSpotifyUrl(spotifyUrl)) {
            errorMessage.textContent = 'Invalid Spotify URL. Please use a full Spotify link.';
            playerPlaceholder.style.display = 'flex';
            spotifyPlayer.src = '';
            mediaTitle.textContent = '';
            mediaSubtitle.textContent = '';
            return;
        }

        try {
            const embedUrl = convertToEmbedUrl(spotifyUrl);
            spotifyPlayer.src = embedUrl;
            playerPlaceholder.style.display = 'none';
            errorMessage.textContent = '';
            updateRecentLinks(spotifyUrl);

            // Extract and display track/album/playlist info
            const urlParts = spotifyUrl.split('/');
            const type = urlParts[urlParts.indexOf('spotify.com') + 1];
            const id = urlParts[urlParts.indexOf('spotify.com') + 2].split('?')[0];

            // Simulated metadata display (replace with actual Spotify API integration)
            mediaTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            mediaSubtitle.textContent = `ID: ${id}`;
        } catch (error) {
            errorMessage.textContent = 'Could not generate embed URL. Please check the link.';
            playerPlaceholder.style.display = 'flex';
            mediaTitle.textContent = '';
            mediaSubtitle.textContent = '';
        }
    }

    playButton.addEventListener('click', () => {
        const spotifyUrl = urlInput.value.trim();
        loadSpotifyTrack(spotifyUrl);
    });

    // Paste handling
    urlInput.addEventListener('paste', (e) => {
        // Automatically try to play pasted URL
        setTimeout(() => {
            const spotifyUrl = urlInput.value.trim();
            loadSpotifyTrack(spotifyUrl);
        }, 100);
    });

    function isValidSpotifyUrl(url) {
        // More flexible regex to match various Spotify URL formats
        const spotifyRegex = /^(https?:\/\/)?(www\.)?open\.spotify\.com\/(track|album|playlist|episode)\/[a-zA-Z0-9]+/i;
        return spotifyRegex.test(url);
    }

    function convertToEmbedUrl(url) {
        // Ensure full URL is used
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        // Parse URL more robustly
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);

        if (pathParts.length < 2) {
            throw new Error('Invalid Spotify URL');
        }

        const type = pathParts[0]; // track, album, playlist
        const id = pathParts[1];

        // Add error checking
        if (!['track', 'album', 'playlist', 'episode'].includes(type) || !id) {
            throw new Error('Invalid Spotify content type');
        }

        return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`;
    }

    // Clipboard detection
    navigator.clipboard.readText().then(clipText => {
        if (isValidSpotifyUrl(clipText)) {
            urlInput.value = clipText;
            loadSpotifyTrack(clipText);
        }
    }).catch(() => {
        // Clipboard access denied or not supported
    });

    // Copy URL functionality
    copyUrlButton.addEventListener('click', () => {
        const currentUrl = urlInput.value;
        if (currentUrl) {
            navigator.clipboard.writeText(currentUrl).then(() => {
                errorMessage.textContent = 'URL copied to clipboard!';
                errorMessage.style.color = '#1DB954';
                setTimeout(() => {
                    errorMessage.textContent = '';
                }, 2000);
            });
        }
    });

    // Initial render of recent links
    renderRecentLinks();
});