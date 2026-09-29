window.Eurus = window.Eurus || { loadedScript: new Set() };

if (!window.Eurus.loadedScript.has('video.js')) {
  window.Eurus.loadedScript.add('video.js');

  const xVideo = {
    ytIframeId: 0,
    vimeoIframeId: 0,
    externalListened: false,

    togglePlay(el) {
      const videoContainer = el.closest('.external-video');
      let video = el.getElementsByClassName('video')[0];
      if (!video && el.closest('.contain-video')) {
        video = el.closest('.contain-video').getElementsByClassName('video')[0];
      }
      if (video) {
        if (videoContainer) {
          video.paused ? videoContainer.classList.remove('function-paused') : videoContainer.classList.add('function-paused');
          const buttonPlay = videoContainer.getElementsByClassName('button-play')[0];
          if (buttonPlay) {
            video.paused ? buttonPlay.classList.remove('hidden') : buttonPlay.classList.add('hidden');
          }
        }
        video.paused ? this.play(el) : this.pause(el);
      }
    },
    play(el) {
      const videoContainer = el.closest('.external-video');
      let video = el.getElementsByClassName('video')[0];
      if (!video && el.closest('.contain-video')) {
        video = el.closest('.contain-video').getElementsByClassName('video')[0];
      }
      if (video) {
        if (videoContainer) {
          const buttonPlay = videoContainer.getElementsByClassName('button-play')[0];
          if (video.tagName == 'IFRAME') {
            if (videoContainer.classList.contains('function-paused')) this.externalPostCommand(video, 'play');
            videoContainer.classList.remove('function-paused');
          } else if (video.tagName == 'VIDEO') {
            if (!videoContainer.classList.contains('function-paused')) {
              if (buttonPlay) buttonPlay.classList.add('hidden');
              video.play().catch((error) => {
                if (buttonPlay) buttonPlay.classList.remove('hidden');
              });
            }
          }
        }
      }
    },
    pause(el) {
      const videoContainer = el.closest('.external-video');
      let video = el.getElementsByClassName('video')[0];
      if (!video && el.closest('.contain-video')) {
        video = el.closest('.contain-video').getElementsByClassName('video')[0];
      }
      if (video) {
        if (videoContainer) {
          const buttonPlay = videoContainer.getElementsByClassName('button-play')[0];
          if (video.tagName == 'IFRAME') {
            if (!videoContainer.classList.contains('paused')) {
              videoContainer.classList.add('function-paused');
            }
            this.externalPostCommand(video, 'pause');
          } else if (video.tagName == 'VIDEO') {
            if (buttonPlay) buttonPlay.classList.remove('hidden');
            video.pause();
          }
        }
      }
    },
    load(el) {
      el?.classList.add('active');
      el?.closest('.animate_transition_card__image')?.classList.remove('animate-Xpulse', 'skeleton-image');
      setTimeout(() => { el.closest('.animate_transition_card__image')?.classList.add('lazy_active'); }, 250);
    },
    mp4Thumbnail(el) {
      const videoContainer = el.closest('.external-video');
      const imgThumbnail = videoContainer.getElementsByClassName('img-thumbnail')[0];
      const imgThumbnailMobile = videoContainer.getElementsByClassName('img-thumbnail')[1];
      if (imgThumbnail) {
        imgThumbnail.classList.add('hidden');
        imgThumbnail.classList.add('md:hidden');
      }
      if (imgThumbnailMobile) {
        imgThumbnailMobile.classList.add('hidden');
      }
      this.togglePlay(el);
    },
    externalLoad(el, host, id, loop, title, controls = 1) {
      let src = '';
      let pointerEvent = '';
      if (host == 'youtube') {
        src = `https://www.youtube.com/embed/${id}?mute=1&playlist=${id}&autoplay=1&playsinline=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&controls=${controls}&showinfo=${controls}`;
      } else {
        src = `https://player.vimeo.com/video/${id}?muted=1&autoplay=1&playsinline=1&api=1&controls=${controls}`;
      }

      if (controls == 0) {
        pointerEvent = ' pointer-events-none';
      }
      requestAnimationFrame(() => {
        const videoContainer = el.closest('.external-video');
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
        const borderRadiusClass = (isIOS && videoContainer.classList.contains('rounded-[10px]')) ? 'rounded-[10px]' : '';
        videoContainer.innerHTML = `<iframe data-video-loop="${loop}" class="iframe-video absolute video ${borderRadiusClass} ${pointerEvent}"
          frameborder="0" host="${host}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen playsinline
          src="${src}" title="${title}"></iframe>`;

        const iframeEl = videoContainer.querySelector('.iframe-video');

        // Standard "cover" crop for embedded video iframes: an <iframe> can't
        // use object-fit, so instead we oversize it relative to the
        // container's actual aspect ratio and clip the overflow on the
        // (already overflow-hidden) container — this is what actually
        // eliminates the letterboxing/black bars instead of just matching
        // the container's box size 1:1.
        const resizeCover = () => {
          const rect = videoContainer.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const videoRatio = 16 / 9;
          const containerRatio = rect.width / rect.height;
          if (containerRatio > videoRatio) {
            iframeEl.style.width = '100%';
            iframeEl.style.height = `${rect.width / videoRatio}px`;
          } else {
            iframeEl.style.height = '100%';
            iframeEl.style.width = `${rect.height * videoRatio}px`;
          }
          iframeEl.style.top = '50%';
          iframeEl.style.left = '50%';
        };
        resizeCover();
        window.addEventListener('resize', resizeCover);

        iframeEl.addEventListener('load', () => {
          setTimeout(() => {
            this.play(videoContainer);

            if (host == 'youtube') {
              this.ytIframeId++;
              videoContainer.querySelector('.iframe-video').contentWindow.postMessage(JSON.stringify({
                event: 'listening',
                id: this.ytIframeId,
                channel: 'widget'
              }), '*');
              videoContainer.querySelector('.iframe-video').contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'addEventListener',
                args: ['onStateChange'],
                id: this.ytIframeId,
                channel: 'widget'
              }), '*');
            } else {
              this.vimeoIframeId++;
              videoContainer.querySelector('.iframe-video').contentWindow.postMessage(JSON.stringify({
                method: 'addEventListener',
                value: 'finish'
              }), '*');
              videoContainer.querySelector('.iframe-video').contentWindow.postMessage(JSON.stringify({
                method: 'addEventListener',
                value: 'play'
              }), '*');
              videoContainer.querySelector('.iframe-video').contentWindow.postMessage(JSON.stringify({
                method: 'addEventListener',
                value: 'pause'
              }), '*');
              videoContainer.querySelector('.iframe-video').contentWindow.postMessage(JSON.stringify({
                method: 'addEventListener',
                value: 'playProgress'
              }), '*');
            }
          }, 100);
        });
      });

      this.externalListen();
    },
    renderVimeoFacade(el, id, options) {
      fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}&width=${options.width}`)
        .then((response) => response.json())
        .then((response) => {
          const html = `
            <picture>
              <img src="${response.thumbnail_url}" loading="lazy" class="w-full h-full object-cover" alt="${options.alt}" width="${response.width}" height="${response.height}"/>
            </picture>
          `;

          requestAnimationFrame(() => {
            el.innerHTML = html;
          });
        });
    },
    externalListen() {
      if (!this.externalListened) {
        window.addEventListener('message', (event) => {
          var iframes = document.getElementsByTagName('IFRAME');

          for (let i = 0, iframe, win, message; i < iframes.length; i++) {
            iframe = iframes[i];

            // Cross-browser way to get iframe's window object
            win = iframe.contentWindow || iframe.contentDocument.defaultView;

            if (win === event.source) {
              if (event.origin == 'https://www.youtube.com') {
                message = JSON.parse(event.data);
                if (iframe.getAttribute('data-video-loop') === 'true') {
                  if (message.info && message.info.playerState == 0) {
                    this.externalPostCommand(iframe, 'play');
                  }
                }
                if (message.info && message.info.playerState == 1) {
                  iframe.parentNode.classList.remove('paused');
                  iframe.parentNode.classList.remove('function-paused');
                }
                if (message.info && message.info.playerState == 2) {
                  iframe.parentNode.classList.add('paused');
                }
              }

              if (event.origin == 'https://player.vimeo.com') {
                message = JSON.parse(event.data);
                if (iframe.getAttribute('data-video-loop') !== 'true') {
                  if (message.event == 'finish') {
                    this.externalPostCommand(iframe, 'play');
                  }
                }
                if (message.event === 'play') {
                  iframe.parentNode.classList.remove('paused');
                  iframe.parentNode.classList.remove('function-paused');
                }
                if (message.event === 'pause') {
                  iframe.parentNode.classList.add('paused');
                }
              }
            }
          }
        });

        this.externalListened = true;
      }
    },
    externalPostCommand(iframe, cmd) {
      const host = iframe.getAttribute('host');
      const command = host == 'youtube' ? {
        event: 'command',
        func: cmd + 'Video'
      } : {
        method: cmd,
        value: 'true'
      };

      iframe.contentWindow.postMessage(JSON.stringify(command), '*');
    },
    toggleMute(el) {
      let video = el.closest('.video-hero') && el.closest('.video-hero').getElementsByClassName('video')[0];
      if (!video && el.closest('.contain-video')) {
        video = el.closest('.contain-video').getElementsByClassName('video')[0];
      }
      if (video) {
        if (video.tagName != 'IFRAME') {
          video.muted = !video.muted;
        }
      }
    }
  };

  window.Eurus.xVideo = xVideo;

  function initAutoplayExternal(root) {
    root.querySelectorAll('[data-video-autoplay-external]:not([data-video-init])').forEach((el) => {
      el.setAttribute('data-video-init', 'true');
      const { videoType, videoId, videoAlt, videoControls } = el.dataset;
      const controls = videoControls === '0' ? 0 : 1;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            if (el.getElementsByClassName('video').length) xVideo.pause(el);
            return;
          }
          if (!el.getElementsByClassName('video').length) {
            if (videoType === 'youtube' || videoType === 'vimeo') {
              xVideo.externalLoad(el, videoType, videoId, false, videoAlt || '', controls);
            }
          } else {
            xVideo.play(el);
          }
        });
      }, { threshold: 0.25 });
      observer.observe(el);

      el.addEventListener('click', (event) => {
        event.stopPropagation();
        xVideo.togglePlay(el);
      });
    });
  }

  function initModalTriggers(root) {
    root.querySelectorAll('[data-video-modal-trigger]:not([data-video-init])').forEach((btn) => {
      btn.setAttribute('data-video-init', 'true');
      if (btn.disabled) return;

      btn.addEventListener('click', () => {
        const modal = document.getElementById(btn.dataset.videoModalTarget);
        if (!modal) return;

        if (!modal.dataset.videoLoaded) {
          modal.dataset.videoLoaded = 'true';
          const { videoType, videoId, videoAlt } = modal.dataset;
          const externalContainer = modal.querySelector('.external-video');
          if (externalContainer && (videoType === 'youtube' || videoType === 'vimeo')) {
            xVideo.externalLoad(externalContainer, videoType, videoId, false, videoAlt || '');
          }
        }

        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        modal.querySelector('[data-video-modal-close]')?.focus();
      });
    });

    root.querySelectorAll('[data-video-modal-close]:not([data-video-init])').forEach((btn) => {
      btn.setAttribute('data-video-init', 'true');
      btn.addEventListener('click', () => {
        const modal = btn.closest('[data-video-modal]');
        if (!modal) return;
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        modal.querySelector('.iframe-video')?.remove();
      });
    });
  }

  function initSoundControls(root) {
    root.querySelectorAll('[data-video-sound-control]:not([data-video-init])').forEach((btn) => {
      btn.setAttribute('data-video-init', 'true');
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        xVideo.toggleMute(btn);
        const muted = btn.classList.toggle('is-muted', !btn.classList.contains('is-muted'));
        btn.querySelectorAll('[data-sound-icon="unmute"]').forEach((el) => el.classList.toggle('hidden', !muted));
        btn.querySelectorAll('[data-sound-icon="mute"]').forEach((el) => el.classList.toggle('hidden', muted));
      });
    });
  }

  function initVimeoFacades(root) {
    root.querySelectorAll('[data-vimeo-facade]:not([data-video-init])').forEach((el) => {
      el.setAttribute('data-video-init', 'true');
      xVideo.renderVimeoFacade(el, el.dataset.videoId, {
        alt: el.dataset.videoAlt || '',
        width: 1280
      });
    });
  }

  function initVideoElements(root = document) {
    initAutoplayExternal(root);
    initModalTriggers(root);
    initSoundControls(root);
    initVimeoFacades(root);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('[data-video-modal]:not(.hidden)').forEach((modal) => {
      modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    });
  });

  window.Eurus.initVideoElements = initVideoElements;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initVideoElements());
  } else {
    initVideoElements();
  }
}