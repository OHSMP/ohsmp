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
        loadAndAnimateMarkdown();
    }
    
    // Load and animate whitelist if we're on the whitelist page
    if (window.location.href.includes('whitelist.html')) {
        loadAndAnimateMarkdown('../assets/whitelist.md');
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

// Function to fetch, parse and animate markdown content
function loadAndAnimateMarkdown(markdownPath = '../assets/rules.md') {
    const markdownContainer = document.getElementById('markdown-container');
    if (!markdownContainer) return;
    
    fetch(markdownPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load markdown (${response.status})`);
            }
            return response.text();
        })
        .then(markdown => {
            // Parse markdown to HTML if marked library is available
            if (typeof marked !== 'undefined') {
                // Special handling for whitelist page
                if (window.location.href.includes('whitelist.html')) {
                    enhanceWhitelistMarkdown(markdown, markdownContainer);
                } else {
                    const htmlContent = marked.parse(markdown);
                    animateMarkdownContent(markdownContainer, htmlContent);
                }
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

// Function to enhance whitelist markdown with cleaner formatting
function enhanceWhitelistMarkdown(markdown, container) {
    // Parse markdown to basic HTML
    const htmlContent = marked.parse(markdown);
    
    // Create a temporary container to manipulate the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Find all sections (h2 headings)
    const sections = tempDiv.querySelectorAll('h2');
    
    // Create search filter for the whitelist
    const searchDiv = document.createElement('div');
    searchDiv.className = 'whitelist-search';
    searchDiv.innerHTML = `
        <input type="text" id="playerSearch" placeholder="Find a player..." />
        <button id="searchButton"><i class="fa fa-search"></i></button>
    `;
    
    // Create simple table of contents
    const toc = document.createElement('div');
    toc.className = 'whitelist-toc';
    
    const tocTitle = document.createElement('h3');
    tocTitle.textContent = 'Jump to Section';
    toc.appendChild(tocTitle);
    
    const tocList = document.createElement('ul');
    
    // Add section IDs and build TOC
    sections.forEach((section, index) => {
        const sectionId = `section-${section.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        section.id = sectionId;
        
        // Add section to TOC
        const tocItem = document.createElement('li');
        const tocLink = document.createElement('a');
        tocLink.href = `#${sectionId}`;
        tocLink.textContent = section.textContent;
        tocItem.appendChild(tocLink);
        tocList.appendChild(tocItem);
        
        // Add visual section dividers if not the first section
        if (index > 0) {
            const divider = document.createElement('hr');
            divider.className = 'section-divider';
            section.parentNode.insertBefore(divider, section);
        }
    });
    
    toc.appendChild(tocList);
    
    // Enhance the whitelisted players section with a clean grid layout
    const whitelistedSection = Array.from(sections).find(section => 
        section.textContent.includes('Currently Whitelisted'));
    
    if (whitelistedSection) {
        const playersList = whitelistedSection.nextElementSibling;
        if (playersList && playersList.tagName === 'UL') {
            const playersGrid = document.createElement('div');
            playersGrid.className = 'players-grid';
            playersGrid.id = 'playersGrid';
            
            const playerItems = playersList.querySelectorAll('li');
            playerItems.forEach(item => {
                const playerCard = document.createElement('div');
                playerCard.className = 'player-card';
                
                // Extract player name and info
                const content = item.innerHTML;
                const match = content.match(/<strong>([^:]+):<\/strong>(.+)/);
                
                if (match) {
                    const playerName = match[1];
                    const playerInfo = match[2];
                    
                    playerCard.innerHTML = `
                        <div class="player-username">${playerName}</div>
                        <div class="player-info">${playerInfo}</div>
                    `;
                } else {
                    playerCard.innerHTML = item.innerHTML;
                }
                
                playersGrid.appendChild(playerCard);
            });
            
            playersList.parentNode.replaceChild(playersGrid, playersList);
        }
    }
    
    // Add a cleaner style to the factions section
    const factionsSection = Array.from(tempDiv.querySelectorAll('h2')).find(section => 
        section.textContent.includes('Factions & Kingdoms'));
    
    if (factionsSection) {
        const factionHeaders = tempDiv.querySelectorAll('h3');
        factionHeaders.forEach(header => {
            if (header.textContent.includes(':')) {
                header.className = 'faction-header';
            }
        });
    }
    
    // Add the search and TOC at the beginning
    tempDiv.insertBefore(searchDiv, tempDiv.firstChild);
    tempDiv.insertBefore(toc, tempDiv.firstChild);
    
    // Set the enhanced HTML content
    container.innerHTML = tempDiv.innerHTML;
    
    // Setup search functionality
    setTimeout(() => {
        const searchInput = document.getElementById('playerSearch');
        const searchButton = document.getElementById('searchButton');
        const playersGrid = document.getElementById('playersGrid');
        
        if (searchInput && searchButton && playersGrid) {
            // Update placeholder text with total count
            const playerCount = playersGrid.querySelectorAll('.player-card').length;
            searchInput.placeholder = `Search ${playerCount} players...`;
            
            const handleSearch = () => {
                const searchTerm = searchInput.value.toLowerCase();
                const playerCards = playersGrid.querySelectorAll('.player-card');
                let matchCount = 0;
                
                playerCards.forEach(card => {
                    const username = card.querySelector('.player-username').textContent.toLowerCase();
                    const info = card.querySelector('.player-info').textContent.toLowerCase();
                    
                    if (username.includes(searchTerm) || info.includes(searchTerm)) {
                        card.style.display = '';
                        if (searchTerm.length > 0) {
                            card.classList.add('highlight-match');
                            setTimeout(() => {
                                card.classList.remove('highlight-match');
                            }, 1500);
                        }
                        matchCount++;
                    } else {
                        card.style.display = 'none';
                    }
                });
                
                // Show match count
                if (searchTerm.length > 0) {
                    const resultText = document.createElement('div');
                    resultText.className = 'search-results';
                    resultText.textContent = `${matchCount} player${matchCount !== 1 ? 's' : ''} found`;
                    resultText.style.textAlign = 'center';
                    resultText.style.fontSize = '0.9em';
                    resultText.style.marginTop = '10px';
                    resultText.style.color = '#666';
                    
                    const oldResults = document.querySelector('.search-results');
                    if (oldResults) oldResults.remove();
                    
                    searchDiv.appendChild(resultText);
                } else {
                    const oldResults = document.querySelector('.search-results');
                    if (oldResults) oldResults.remove();
                }
            };
            
            searchButton.addEventListener('click', handleSearch);
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') handleSearch();
                // Auto-search after a short delay
                if (e.key !== 'Enter') {
                    clearTimeout(searchInput.searchTimeout);
                    searchInput.searchTimeout = setTimeout(handleSearch, 300);
                }
            });
        }
        
        // Add smooth scrolling for TOC links
        document.querySelectorAll('.whitelist-toc a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                    
                    // Gently highlight the section
                    targetElement.classList.add('highlight-section');
                    setTimeout(() => {
                        targetElement.classList.remove('highlight-section');
                    }, 1500);
                }
            });
        });
    }, 0);
    
    // Animate the content
    animateMarkdownContent(container, container.innerHTML);
}

// Function to animate the markdown content
function animateMarkdownContent(container, htmlContent) {
    // Set the HTML content first
    container.innerHTML = htmlContent;
    
    // Get all elements to animate
    const elementsToAnimate = container.querySelectorAll('h1, h2, h3, p, ul, ol, li, pre, blockquote, a, strong, code');
    
    // Hide all elements initially
    elementsToAnimate.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
    });
    
    // Animate elements one by one with a delay
    let delay = 80; // Slightly faster animation sequence
    let groupDelay = 0;
    
    // Group elements by their type to animate headers first, then content
    const headers = container.querySelectorAll('h1, h2, h3');
    const contentElements = container.querySelectorAll('p, ul, ol, blockquote');
    const detailElements = container.querySelectorAll('li, pre, a, strong, code');
    
    // Animate headers first
    headers.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('animated-element');
        }, delay * index);
        groupDelay = delay * (headers.length);
    });
    
    // Then animate main content
    contentElements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('animated-element');
        }, groupDelay + (delay * index));
        groupDelay += delay * 0.5;
    });
    
    // Finally animate detailed elements
    detailElements.forEach((element, index) => {
        if (!element.closest('p, ul, ol, blockquote')) {
            setTimeout(() => {
                element.classList.add('animated-element');
            }, groupDelay + (delay * 0.3 * index));
        }
    });
}
