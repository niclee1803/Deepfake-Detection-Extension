// chrome.runtime.onMessage.addListener((message) => {
//   if (message.action === 'deepfakeResult' || message.action === 'verifyFakeNews') {
//     const resultsDiv = document.getElementById('results');
//     let content = '';

//     if (message.action === 'deepfakeResult') {
//       content = '<h2>Deepfake Detection Results:</h2>';
//       for (const label in message.result) {
//         const probability = (message.result[label] * 100).toFixed(2);
//         content += `<p>${label}: ${probability}%</p>`;
//       }
//     } else if (message.action === 'verifyFakeNews') {
//       content = `<h2>Fake News Verification:</h2><p>${message.result}</p>`;
//     }

//     resultsDiv.innerHTML = content;
//   }
// });
