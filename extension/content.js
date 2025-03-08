chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "showAnalysisResult") {
    showFloatingPopup(message.content);
  }
});

function showFloatingPopup(content) {
  const existingPopup = document.getElementById('analysis-popup');
  if (existingPopup) existingPopup.remove();

  // Add the spinner CSS to the page if it doesn't exist
  if (!document.getElementById('spinner-styles')) {
    const spinnerStyles = document.createElement('style');
    spinnerStyles.id = 'spinner-styles';
    spinnerStyles.textContent = `
      .loading-circle {
        display: inline-block;
        width: 10px;
        height: 10px;
        margin: 0 10px;
        border: 2px solid rgba(170, 170, 170, 0.3);
        border-radius: 50%;
        border-top-color: #aaa;
        animation: spin 0.8s linear infinite;
        vertical-align: middle;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(spinnerStyles);
  }

  const popup = document.createElement('div');
  popup.id = 'analysis-popup';
  popup.innerHTML = content;
  popup.style.position = 'fixed';
  popup.style.bottom = '20px';
  popup.style.right = '20px';
  popup.style.backgroundColor = '#111';
  popup.style.color = '#fff';
  popup.style.padding = '15px';
  popup.style.border = '1px solid #444';
  popup.style.boxShadow = '0 4px 12px rgba(0,0,0,0.6)';
  popup.style.zIndex = '10000';
  popup.style.fontFamily = 'Arial, sans-serif';
  popup.style.borderRadius = '10px';
  popup.style.fontSize = '14px';
  popup.style.lineHeight = '1.5';
  popup.style.opacity = '0.95';

  // Add these for link wrapping:
  popup.style.wordWrap = 'break-word';
  popup.style.overflow = 'hidden';
  popup.style.textOverflow = 'ellipsis';
  popup.style.maxWidth = '320px';
  popup.style.maxHeight = '400px';
  popup.style.overflowY = 'auto';

  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'Close';
  closeBtn.style.backgroundColor = '#555';
  closeBtn.style.color = '#fff';
  closeBtn.style.border = 'none';
  closeBtn.style.padding = '5px 10px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.marginTop = '10px';
  closeBtn.style.borderRadius = '5px';

  closeBtn.onclick = () => popup.remove();

  popup.appendChild(closeBtn);

  document.body.appendChild(popup);
}