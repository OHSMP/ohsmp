const serverIp = '172.240.13.165:25702';
const apiUrl = `https://api.mcsrvstat.us/2/${serverIp}`;
let lastCheckedTime = Date.now();

// Video background handling
function initializeVideo() {
    const video = document.getElementById('backgroundVideo');
    if (video) {
        video.playbackRate = 0.65;
        const savedTime = sessionStorage.getItem('videoTime');
        if (savedTime) {
            video.currentTime = parseFloat(savedTime);
        }
        video.play();

        window.addEventListener('beforeunload', () => {
            sessionStorage.setItem('videoTime', video.currentTime);
        });

        video.addEventListener('error', () => {
            console.error('Error loading the video.');
        });
    }
}

// Clipboard functionality
function copyToClipboard(elementId, button) {
    const copyText = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(copyText).then(() => {
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
    });
}

// Server status handling
function updateServerInfo(data) {
    const serverInfo = document.getElementById('serverInfo');
    try {
        const playersList = data.players?.list?.length > 0 
            ? `<div class="player-list">
                 ${data.players.list.map(player => `<span class="player-name">${player}</span>`).join('')}
               </div>`
            : '<p>No players online</p>';

        serverInfo.innerHTML = `
            <div class="server-info-group">
                <p class="status-indicator">
                    <strong>Status:</strong> 
                    <span class="status-bubble ${data.online ? 'status-online' : 'status-offline'}"></span>
                    <span>${data.online ? 'Online' : 'Offline'}</span>
                </p>
                <p><strong>Players:</strong> ${data.players.online}/${data.players.max}</p>
            </div>
            <div class="server-info-group">
                ${playersList}
            </div>
            <div class="server-info-group">
                <p><strong>Version:</strong> <span class="server-version">${data.version}</span></p>
            </div>
        `;
    } catch (error) {
        serverInfo.innerHTML = `
            <div class="server-info-group">
                <p style="color: #8C1515;">Server is offline</p>
            </div>
        `;
    }
}

function checkServerStatus() {
    fetch(apiUrl)
        .then(response => response.ok ? response.json() : Promise.reject('Server not found'))
        .then(data => {
            updateServerInfo(data);
            lastCheckedTime = Date.now();
            updateLastChecked();
        })
        .catch(() => {
            document.getElementById('serverInfo').innerHTML = `<p style="color: red;">Server is offline.</p>`;
        });
}

function updateLastChecked() {
    const secondsSinceLastCheck = Math.floor((Date.now() - lastCheckedTime) / 1000);
    document.getElementById('lastChecked').innerText = `Last checked: ${secondsSinceLastCheck} seconds ago`;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeVideo();
    checkServerStatus();
    setInterval(checkServerStatus, 5000);
    setInterval(updateLastChecked, 1000);

    // Add copy button event listeners
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', () => {
            const elementId = button.getAttribute('data-copy-target');
            copyToClipboard(elementId, button);
        });
    });
});
