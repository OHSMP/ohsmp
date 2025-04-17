document.addEventListener('DOMContentLoaded', function() {
    var video = document.getElementById('backgroundVideo');
    if (video) {
        // Set playback rate
        video.playbackRate = 0.65;

        // Restore video time from session storage
        var savedTime = sessionStorage.getItem('videoTime');
        if (savedTime) {
            video.currentTime = parseFloat(savedTime);
        }

        // Play the video after setting currentTime
        video.play().catch(error => {
            console.warn('Video autoplay was prevented:', error);
            // Create a play button overlay
            createPlayButton(video);
        });

        // Save video time to session storage before unloading the page
        window.addEventListener('beforeunload', function() {
            sessionStorage.setItem('videoTime', video.currentTime);
        });

        video.addEventListener('error', function() {
            console.error('Error loading the video.');
            // Hide video container and show a fallback background
            handleVideoError();
        });
    } else {
        console.error('Video element not found.');
    }
    
    // Initialize copy buttons
    document.querySelectorAll('.copy-button').forEach(button => {
        if (button.hasAttribute('data-copy-target')) {
            button.addEventListener('click', function() {
                const elementId = this.getAttribute('data-copy-target');
                copyToClipboard(elementId, this);
            });
        } else if (button.getAttribute('onclick') && button.getAttribute('onclick').includes('copyToClipboard')) {
            // Handle old-style copy buttons
            const onclickAttr = button.getAttribute('onclick');
            const match = onclickAttr.match(/copyToClipboard\(['"]([^'"]+)['"]/);
            if (match && match[1]) {
                const elementId = match[1];
                button.removeAttribute('onclick');
                button.addEventListener('click', function() {
                    copyToClipboard(elementId, this);
                });
            }
        }
    });
    
    // Load and animate markdown content if we're on the rules page
    if (window.location.href.includes('rules.html')) {
        loadAndAnimateMarkdown('../assets/rules.md');
    }
    
    // Load and animate whitelist if we're on the whitelist page
    if (window.location.href.includes('whitelist.html')) {
        loadAndAnimateMarkdown('../assets/whitelist.md');
        // Delay avatar rendering to ensure markdown is rendered
        setTimeout(renderMinecraftAvatars, 500);
    }

    // Server status check for homepage
    if (document.getElementById('serverStatus')) {
        checkMinecraftServerStatus('play.ohsmp.com', 25565);
    }
});

// Function to create play button overlay for videos that can't autoplay
function createPlayButton(video) {
    const videoContainer = video.parentElement;
    
    const playButton = document.createElement('button');
    playButton.innerHTML = '<i class="fa fa-play-circle"></i>';
    playButton.className = 'video-play-button';
    playButton.setAttribute('aria-label', 'Play video');
    
    videoContainer.appendChild(playButton);
    
    playButton.addEventListener('click', () => {
        video.play();
        playButton.style.display = 'none';
    });
}

// Function to handle video loading errors
function handleVideoError() {
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
        videoContainer.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
        const video = videoContainer.querySelector('video');
        if (video) {
            video.style.display = 'none';
        }
    }
}

// Function to copy text to clipboard with tooltip feedback
function copyToClipboard(elementId, button) {
    var copyText = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(copyText).then(function() {
        const icon = button.querySelector('i');
        icon.classList.add('copied');
        icon.style.color = '#8C1515';
        
        // Create and show a tooltip
        const tooltip = document.createElement('span');
        tooltip.textContent = 'Copied!';
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = '#333';
        tooltip.style.color = 'white';
        tooltip.style.padding = '5px 10px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.top = '-30px';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.3s';
        
        button.style.position = 'relative';
        button.appendChild(tooltip);
        
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                button.removeChild(tooltip);
            }, 300);
            icon.classList.remove('copied');
            icon.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Could not copy text: ', err);
        alert('Failed to copy text. Please try again.');
    });
}

// Function to fetch, parse, and animate markdown content
function loadAndAnimateMarkdown(markdownPath) {
    const markdownContainer = document.getElementById('markdown-container');
    if (!markdownContainer) return;

    // Ensure marked parses GitHub-flavored markdown
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            gfm: true,
            breaks: true,
            smartLists: true,
            smartypants: true
        });
    }

    fetch(markdownPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load markdown (${response.status})`);
            }
            return response.text();
        })
        .then(markdown => {
            if (typeof marked !== 'undefined') {
                const htmlContent = marked.parse(markdown);
                markdownContainer.innerHTML = htmlContent;
                animateMarkdownContent(markdownContainer);
            } else {
                console.error('Marked library not available');
                markdownContainer.innerHTML = '<div class="error-message"><i class="fa fa-exclamation-circle"></i> Error loading content. Please refresh the page or try again later.</div>';
            }
        })
        .catch(error => {
            console.error('Error loading markdown:', error);
            markdownContainer.innerHTML = `<div class="error-message"><i class="fa fa-exclamation-circle"></i> Error loading content: ${error.message}</div>`;
        });
}

// Function to animate the markdown content
function animateMarkdownContent(container) {
    const elementsToAnimate = container.querySelectorAll('h1, h2, h3, p, ul, ol, li, pre, blockquote, a, strong, code');

    elementsToAnimate.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
    });

    let delay = 100;
    elementsToAnimate.forEach((element, index) => {
        setTimeout(() => {
            element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay * index);
    });
}

// Function to check Minecraft server status using a public API
function checkMinecraftServerStatus(host, port) {
    const statusBubble = document.querySelector('#serverStatus .status-bubble');
    const statusText = document.getElementById('serverStatusText');
    const lastChecked = document.getElementById('lastChecked');

    // Use a public API (e.g., mcsrvstat.us)
    fetch(`https://api.mcsrvstat.us/2/${host}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.online) {
                statusBubble.classList.remove('status-offline');
                statusBubble.classList.add('status-online');
                statusText.textContent = `Online (${data.players && data.players.online ? data.players.online : 0} players)`;
            } else {
                statusBubble.classList.remove('status-online');
                statusBubble.classList.add('status-offline');
                statusText.textContent = 'Offline';
            }
            if (lastChecked) {
                lastChecked.textContent = `Last checked: ${new Date().toLocaleTimeString()}`;
            }
        })
        .catch(() => {
            statusBubble.classList.remove('status-online');
            statusBubble.classList.add('status-offline');
            statusText.textContent = 'Offline';
            if (lastChecked) {
                lastChecked.textContent = `Last checked: ${new Date().toLocaleTimeString()}`;
            }
        });
}

// Function to render Minecraft skins using Mojang API + Crafatar
function renderMinecraftAvatars() {
    const playerCards = document.querySelectorAll('.player-card');
    playerCards.forEach(card => {
        const playerNameElem = card.querySelector('.player-name');
        if (playerNameElem) {
            const username = playerNameElem.textContent.trim();
            // Fetch UUID of the player from Mojang API
            fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`User ${username} not found`);
                    }
                    return res.json();
                })
                .then(data => {
                    const uuid = data.id;
                    // Use Crafatar to get the player's avatar with overlay (skin details)
                    const avatarImg = document.createElement('img');
                    avatarImg.src = `https://crafatar.com/avatars/${uuid}?size=50&overlay=true`;
                    avatarImg.alt = `${username} Skin`;
                    avatarImg.style.borderRadius = '50%';
                    avatarImg.style.marginRight = '5px';
                    avatarImg.style.verticalAlign = 'middle';
                    // Insert the avatar image before the player name text
                    playerNameElem.insertAdjacentElement('beforebegin', avatarImg);
                })
                .catch(error => {
                    console.error('Error fetching skin for', username, error);
                });
        }
    });
}

// New function to render a Minecraft profile using Mineatar endpoints
function renderMinecraftProfile(username) {
    fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
        .then(res => {
            if (!res.ok) throw new Error(`User ${username} not found`);
            return res.json();
        })
        .then(data => {
            const uuid = data.id;
            const container = document.getElementById('profile-container');
            if (!container) return;
            container.innerHTML = `
                <!-- Profile for ${username} -->
                <h1>${username} - Mineatar Profile</h1>
                <div class="profile-grid">
                  <a href="https://api.mineatar.io/body/full/${uuid}?scale=16" target="_blank" class="profile-card">
                    <img src="https://api.mineatar.io/body/full/${uuid}?scale=16" alt="Full Body of ${username}" />
                    <p>Full Body</p>
                  </a>
                  <a href="https://api.mineatar.io/body/left/${uuid}?scale=16" target="_blank" class="profile-card">
                    <img src="https://api.mineatar.io/body/left/${uuid}?scale=16" alt="Left Side of ${username}" />
                    <p>Left Side</p>
                  </a>
                  <a href="https://api.mineatar.io/body/right/${uuid}?scale=16" target="_blank" class="profile-card">
                    <img src="https://api.mineatar.io/body/right/${uuid}?scale=16" alt="Right Side of ${username}" />
                    <p>Right Side</p>
                  </a>
                  <a href="https://api.mineatar.io/face/${uuid}?scale=32" target="_blank" class="profile-card">
                    <img src="https://api.mineatar.io/face/${uuid}?scale=32" alt="Face of ${username}" />
                    <p>Face</p>
                  </a>
                  <a href="https://api.mineatar.io/head/${uuid}?scale=16" target="_blank" class="profile-card">
                    <img src="https://api.mineatar.io/head/${uuid}?scale=16" alt="Head of ${username}" />
                    <p>Head</p>
                  </a>
                  <div class="profile-card">
                    <p><strong>UUID:</strong></p>
                    <p>${uuid}</p>
                  </div>
                  <div class="profile-card">
                    <p><strong>Trimmed UUID:</strong></p>
                    <p>${uuid.replace(/-/g, '')}</p>
                  </div>
                </div>
            `;
        })
        .catch(error => {
            console.error("Error rendering profile for", username, error);
        });
}
