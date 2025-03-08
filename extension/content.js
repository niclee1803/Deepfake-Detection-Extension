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
      .deepfake-extension-loading-circle {
        display: inline-block;
        width: 10px;
        height: 10px;
        margin: 0 10px;
        border: 2px solid rgba(170, 170, 170, 0.3);
        border-radius: 50%;
        border-top-color: #aaa;
        animation: deepfake-extension-spin 0.8s linear infinite;
        vertical-align: middle;
      }
      
      @keyframes deepfake-extension-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* These styles ensure our popup text doesn't inherit from the website */
      #analysis-popup * {
        font-family: Arial, sans-serif !important;
        line-height: 1.5 !important;
        color: #fff !important;
        font-size: 14px !important;
        text-align: left !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      #analysis-popup h2 {
        font-size: 16px !important;
        font-weight: bold !important;
        margin-bottom: 10px !important;
      }
      
      #analysis-popup h3 {
        font-size: 15px !important;
        font-weight: bold !important;
        margin-top: 10px !important;
        margin-bottom: 5px !important;
      }
      
      #analysis-popup p {
        margin-bottom: 10px !important;
      }
      
      #analysis-popup a {
        color: #4da6ff !important;
        text-decoration: underline !important;
      }
      
      #analysis-popup strong {
        font-weight: bold !important;
      }
    `;
    document.head.appendChild(spinnerStyles);
  }

  const popup = document.createElement('div');
  popup.id = 'analysis-popup';
  
  // Create a container div to hold the content
  const contentContainer = document.createElement('div');
  contentContainer.className = 'analysis-content-container';
  contentContainer.innerHTML = content;
  
  popup.style.all = 'initial'; // Reset all properties
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
  closeBtn.style.all = 'initial';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';
  closeBtn.style.backgroundColor = '#555';
  closeBtn.style.color = '#fff';
  closeBtn.style.border = 'none';
  closeBtn.style.padding = '10px 15px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.borderRadius = '5px';
  closeBtn.style.fontFamily = 'Arial, sans-serif';
  closeBtn.style.fontSize = '14px';
  closeBtn.style.height = '30px';
  closeBtn.style.width = '50px';


  closeBtn.onclick = () => popup.remove();
  
  popup.appendChild(contentContainer);
  popup.appendChild(closeBtn);

  document.body.appendChild(popup);
}