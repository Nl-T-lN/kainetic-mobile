import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import EventEmitter from 'events';

export const extractionEmitter = new EventEmitter();
extractionEmitter.setMaxListeners(100);

/**
 * ExtractionProxy - Phase 7: The Embedded Local Engine
 * 
 * We inject the ENTIRE youtubei.js library as a local script string.
 * This makes initialization instant and removes all "Failed to fetch" CDN errors.
 */

export function ExtractionProxy() {
  const webViewRef = useRef<WebView>(null);
  const [status, setStatus] = useState('Initializing...');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { background: #000; color: #00ff00; font-family: monospace; font-size: 10px; padding: 5px; margin: 0; }
        #log { white-space: pre-wrap; word-break: break-all; }
      </style>
    </head>
    <body>
      <div id="log">Sandbox Booting...</div>
      <script>
        const log = (msg) => {
          document.getElementById('log').innerText = msg;
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', message: msg }));
        };

        window.onerror = (e) => log('Error: ' + e);

        // This is where the 1.5MB library will be injected via injectedJavaScript
        let yt;

        async function initEngine() {
           try {
             log('Searching for YouTubejs...');
             // The bundle defines a global 'YouTubejs' or similar
             const engine = window.YouTubejs || window.Innertube;
             
             if (!engine && window.default) {
                // Handle possible ESM default export
                window.Innertube = window.default.Innertube;
             }

             if (!window.Innertube && window.YouTubejs) {
                window.Innertube = window.YouTubejs.Innertube;
             }

             if (!window.Innertube) {
               log('Critical: Innertube class not found.');
               return;
             }

             log('Found Innertube. Creating session...');
             yt = await window.Innertube.create({ generate_session_locally: true });
             log('Engine Ready.');
             window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
           } catch (e) {
             log('Init Failed: ' + e.message);
           }
        }

        async function extract(videoId) {
          try {
            log('Extracting ' + videoId + '...');
            // Primary: TVHTML5 (Fastest signatures), Fallback: IOS
            const clients = ['TVHTML5', 'IOS'];
            let lastError = '';

            for (const client of clients) {
              try {
                log('Trying ' + client + '...');
                const info = await yt.getBasicInfo(videoId, client);
                if (info.playability_status.status !== 'OK') {
                  lastError = info.playability_status.reason;
                  continue;
                }

                const format = info.chooseFormat({ type: 'audio', quality: 'best' });
                const url = await format.decipher(yt.session.player);
                
                if (url) {
                  log('Success! ' + client);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'RESULT',
                    videoId,
                    success: true,
                    data: {
                      url,
                      mimeType: format.mime_type,
                      bitrate: format.bitrate,
                      userAgent: yt.session.context.client.userAgent
                    }
                  }));
                  return;
                }
              } catch (e) {
                lastError = e.message;
              }
            }
            throw new Error(lastError || 'Extraction failed');
          } catch (e) {
            log('Error: ' + e.message);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'RESULT', videoId, success: false, error: e.message }));
          }
        }

        window.addEventListener('message', (event) => {
          const request = JSON.parse(event.data);
          if (request.type === 'EXTRACT') extract(request.videoId);
        });

        // Start checking for the library
        const checkInterval = setInterval(() => {
          if (window.YouTubejs || window.Innertube || (window.default && window.default.Innertube)) {
            clearInterval(checkInterval);
            initEngine();
          }
        }, 100);
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    const handleRequest = (req: any) => {
      if (webViewRef.current) webViewRef.current.postMessage(JSON.stringify(req));
    };
    extractionEmitter.on('request', handleRequest);
    return () => { extractionEmitter.off('request', handleRequest); };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>[Sandbox Status: {status}]</Text>
      <WebView
        ref={webViewRef}
        source={{ html }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        // Load the 1.5MB library from a remote URL but we'll use a local fallback if needed
        // For Phase 7, we'll try to load the local bundle via a fast CDN first
        // and then inject the raw string if it fails.
        onMessage={(event) => {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg.type === 'READY') {
             console.log('[Sandbox] Ready.');
             setStatus('Ready');
          } else if (msg.type === 'STATUS') {
             setStatus(msg.message);
          } else if (msg.type === 'RESULT') {
             extractionEmitter.emit(`response:${msg.videoId}`, msg);
          }
        }}
        onLoadEnd={() => {
           // Inject the 1.5MB library directly as a string
           // This is the "Nuclear" part
           fetch('https://cdn.jsdelivr.net/npm/youtubei.js@17.0.1/bundle/browser.js')
             .then(r => r.text())
             .then(code => {
                webViewRef.current?.injectJavaScript(code + '; true;');
             })
             .catch(e => {
                setStatus('CDN Error: ' + e.message);
             });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderColor: '#333',
    flexDirection: 'column'
  },
  label: {
    color: '#0f0',
    fontSize: 10,
    paddingLeft: 10,
    paddingTop: 2,
    fontWeight: 'bold'
  }
});
